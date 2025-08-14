import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const forecastRequestSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  forecastDays: z.number().int().min(1).max(365).default(30),
})

const createForecastSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  forecastDate: z.string().transform((str) => new Date(str)),
  predictedDemand: z.number().int().min(0),
  confidence: z.number().min(0).max(100),
  modelVersion: z.string(),
  features: z.record(z.any()),
  actualDemand: z.number().int().min(0).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const productId = searchParams.get('productId')
    const days = parseInt(searchParams.get('days') || '30')

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = { storeId }
    if (productId) whereClause.productId = productId

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    whereClause.forecastDate = {
      gte: startDate,
      lte: endDate
    }

    const forecasts = await prisma.demandForecast.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
            currentStock: true,
          }
        }
      },
      orderBy: { forecastDate: 'asc' },
    })

    return NextResponse.json({ forecasts })

  } catch (error) {
    console.error('Error fetching demand forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch demand forecasts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (Array.isArray(body)) {
      // Batch creation
      const validatedData = body.map(item => createForecastSchema.parse(item))
      
      const forecasts = await prisma.demandForecast.createMany({
        data: validatedData,
        skipDuplicates: true,
      })

      return NextResponse.json({ 
        created: forecasts.count,
        message: `${forecasts.count} forecasts created successfully`
      }, { status: 201 })

    } else {
      // Single forecast creation
      const validatedData = createForecastSchema.parse(body)
      
      const forecast = await prisma.demandForecast.create({
        data: validatedData,
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sku: true,
              currentStock: true,
            }
          }
        }
      })

      return NextResponse.json(forecast, { status: 201 })
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating demand forecast:', error)
    return NextResponse.json(
      { error: 'Failed to create demand forecast' },
      { status: 500 }
    )
  }
}

// Generate AI-powered demand forecasts
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, productId, forecastDays = 30 } = forecastRequestSchema.parse(body)

    // Get historical sales data
    const historicalData = await prisma.inventoryLog.findMany({
      where: {
        storeId,
        productId,
        type: 'SALE',
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        store: true,
        inventoryLogs: {
          where: { type: 'SALE' },
          orderBy: { createdAt: 'desc' },
          take: 30
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Simple demand forecasting algorithm (in production, this would use ML models)
    const forecasts = []
    const dailySales = calculateDailySales(historicalData)
    const avgDailySales = dailySales.reduce((a, b) => a + b, 0) / Math.max(dailySales.length, 1)
    const seasonalityFactor = calculateSeasonality(historicalData)

    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date()
      forecastDate.setDate(forecastDate.getDate() + i)
      
      // Apply seasonal adjustments and random variation
      const seasonalAdjustment = getSeasonalAdjustment(forecastDate, seasonalityFactor)
      const baselineDemand = avgDailySales * seasonalAdjustment
      const randomVariation = 0.8 + (Math.random() * 0.4) // ±20% variation
      const predictedDemand = Math.max(0, Math.round(baselineDemand * randomVariation))
      
      const confidence = Math.max(60, 95 - (i * 0.5)) // Decreasing confidence over time

      forecasts.push({
        storeId,
        productId,
        forecastDate,
        predictedDemand,
        confidence,
        modelVersion: 'v1.0-basic',
        features: {
          avgDailySales,
          seasonalityFactor,
          historicalPeriod: 90,
          forecastDayOffset: i
        }
      })
    }

    // Save forecasts to database
    await prisma.demandForecast.createMany({
      data: forecasts,
      skipDuplicates: true
    })

    return NextResponse.json({
      forecasts,
      summary: {
        totalForecasts: forecasts.length,
        avgDailyDemand: avgDailySales,
        avgConfidence: forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error generating demand forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate demand forecast' },
      { status: 500 }
    )
  }
}

// Helper functions for demand forecasting
function calculateDailySales(logs: any[]): number[] {
  const salesByDate = new Map<string, number>()
  
  logs.forEach(log => {
    const date = new Date(log.createdAt).toISOString().split('T')[0]
    salesByDate.set(date, (salesByDate.get(date) || 0) + log.quantity)
  })

  return Array.from(salesByDate.values())
}

function calculateSeasonality(logs: any[]): { [key: string]: number } {
  const salesByDayOfWeek = Array(7).fill(0)
  const countByDayOfWeek = Array(7).fill(0)

  logs.forEach(log => {
    const dayOfWeek = new Date(log.createdAt).getDay()
    salesByDayOfWeek[dayOfWeek] += log.quantity
    countByDayOfWeek[dayOfWeek]++
  })

  const avgSalesByDay = salesByDayOfWeek.map((sales, i) => 
    countByDayOfWeek[i] > 0 ? sales / countByDayOfWeek[i] : 0
  )

  const overallAvg = avgSalesByDay.reduce((a, b) => a + b, 0) / 7
  
  return avgSalesByDay.reduce((acc, avg, i) => {
    acc[i.toString()] = overallAvg > 0 ? avg / overallAvg : 1
    return acc
  }, {} as { [key: string]: number })
}

function getSeasonalAdjustment(date: Date, seasonalityFactor: { [key: string]: number }): number {
  const dayOfWeek = date.getDay()
  return seasonalityFactor[dayOfWeek.toString()] || 1
}