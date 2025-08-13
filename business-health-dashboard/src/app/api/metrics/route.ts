import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const timeRange = searchParams.get('timeRange') || '30d'

    // In a real implementation, you would:
    // 1. Query metrics from the database based on user's organization
    // 2. Filter by category and time range
    // 3. Calculate changes and trends
    // 4. Return actual data

    // Mock data for now
    const metrics = {
      revenue: { value: 145000, change: 12.5, period: 'This Month' },
      expenses: { value: 89000, change: -3.2, period: 'This Month' },
      cashFlow: { value: 56000, change: 8.7, period: 'This Month' },
      customers: { value: 1247, change: 5.3, period: 'Active' },
      conversionRate: { value: 3.2, change: 0.4, period: 'This Month' },
      churnRate: { value: 2.1, change: -0.3, period: 'This Month' }
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { category, name, value, unit, timestamp } = body

    // In a real implementation, you would:
    // 1. Validate the input data
    // 2. Store the metric in the database
    // 3. Trigger health score recalculation
    // 4. Send notifications if thresholds are exceeded

    return NextResponse.json({
      message: 'Metric stored successfully',
      id: `metric_${Date.now()}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error storing metric:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}