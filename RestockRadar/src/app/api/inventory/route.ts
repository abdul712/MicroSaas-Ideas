import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createInventorySchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  type: z.enum(['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGED', 'TRANSFER']),
  quantity: z.number().int(),
  cost: z.number().optional(),
  reason: z.string().optional(),
})

const updateInventorySchema = z.object({
  currentStock: z.number().int().min(0),
  reorderPoint: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(1).optional(),
  cost: z.number().positive().optional(),
  price: z.number().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const productId = searchParams.get('productId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = { storeId }
    if (productId) whereClause.productId = productId
    if (type) whereClause.type = type

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
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
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.inventoryLog.count({ where: whereClause })
    ])

    return NextResponse.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error fetching inventory logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createInventorySchema.parse(body)

    const { storeId, productId, type, quantity, cost, reason } = validatedData

    // Get current product stock
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { currentStock: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const previousStock = product.currentStock
    let newStock = previousStock

    // Calculate new stock based on operation type
    switch (type) {
      case 'PURCHASE':
      case 'RETURN':
        newStock = previousStock + quantity
        break
      case 'SALE':
      case 'DAMAGED':
      case 'ADJUSTMENT':
        newStock = Math.max(0, previousStock - quantity)
        break
      case 'TRANSFER':
        // For transfers, quantity can be positive (incoming) or negative (outgoing)
        newStock = Math.max(0, previousStock + quantity)
        break
    }

    // Create inventory log and update product stock in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const log = await tx.inventoryLog.create({
        data: {
          storeId,
          productId,
          type,
          quantity: Math.abs(quantity),
          previousStock,
          newStock,
          cost,
          reason,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              sku: true,
            }
          }
        }
      })

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      })

      return log
    })

    // Check if reorder alert is needed
    const updatedProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { reorderRules: true }
    })

    if (updatedProduct?.reorderRules?.[0] && newStock <= updatedProduct.reorderRules[0].reorderPoint) {
      // Create low stock notification
      await prisma.notification.create({
        data: {
          storeId,
          productId,
          type: 'LOW_STOCK',
          title: 'Low Stock Alert',
          message: `${updatedProduct.title} is running low (${newStock} remaining)`,
          priority: 'HIGH',
          channels: ['IN_APP', 'EMAIL'],
        }
      })
    }

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating inventory log:', error)
    return NextResponse.json(
      { error: 'Failed to create inventory log' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateInventorySchema.parse(body)

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: validatedData,
      include: {
        store: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(updatedProduct)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating inventory:', error)
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    )
  }
}