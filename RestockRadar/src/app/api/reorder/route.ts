import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createReorderRuleSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  reorderPoint: z.number().int().min(0),
  reorderQuantity: z.number().int().min(1),
  maxStock: z.number().int().min(1).optional(),
  autoReorder: z.boolean().default(false),
  leadTimeDays: z.number().int().min(1).default(7),
  safetyStock: z.number().int().min(0).default(5),
})

const updateReorderRuleSchema = createReorderRuleSchema.partial().omit(['storeId', 'productId'])

const triggerReorderSchema = z.object({
  storeId: z.string(),
  productIds: z.array(z.string()).optional(),
  forceReorder: z.boolean().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const productId = searchParams.get('productId')
    const activeOnly = searchParams.get('active') === 'true'

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const whereClause: any = { storeId }
    if (productId) whereClause.productId = productId
    if (activeOnly) whereClause.isActive = true

    const reorderRules = await prisma.reorderRule.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            title: true,
            sku: true,
            currentStock: true,
            supplier: {
              select: {
                id: true,
                name: true,
                leadTime: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate which products need reordering
    const reorderAlerts = reorderRules
      .filter(rule => rule.product.currentStock <= rule.reorderPoint)
      .map(rule => ({
        ...rule,
        urgency: rule.product.currentStock === 0 ? 'CRITICAL' : 
                rule.product.currentStock <= rule.reorderPoint * 0.5 ? 'HIGH' : 'MEDIUM',
        recommendedQuantity: calculateReorderQuantity(
          rule.product.currentStock,
          rule.reorderPoint,
          rule.maxStock || rule.reorderQuantity * 2,
          rule.reorderQuantity
        )
      }))

    return NextResponse.json({
      reorderRules,
      reorderAlerts,
      summary: {
        totalRules: reorderRules.length,
        activeRules: reorderRules.filter(r => r.isActive).length,
        productsNeedingReorder: reorderAlerts.length,
        criticalStock: reorderAlerts.filter(a => a.urgency === 'CRITICAL').length
      }
    })

  } catch (error) {
    console.error('Error fetching reorder rules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reorder rules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createReorderRuleSchema.parse(body)

    // Check if rule already exists for this product
    const existingRule = await prisma.reorderRule.findUnique({
      where: {
        storeId_productId: {
          storeId: validatedData.storeId,
          productId: validatedData.productId
        }
      }
    })

    if (existingRule) {
      return NextResponse.json(
        { error: 'Reorder rule already exists for this product' },
        { status: 409 }
      )
    }

    const reorderRule = await prisma.reorderRule.create({
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

    return NextResponse.json(reorderRule, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating reorder rule:', error)
    return NextResponse.json(
      { error: 'Failed to create reorder rule' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateReorderRuleSchema.parse(body)

    const updatedRule = await prisma.reorderRule.update({
      where: { id: ruleId },
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

    return NextResponse.json(updatedRule)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating reorder rule:', error)
    return NextResponse.json(
      { error: 'Failed to update reorder rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ruleId = searchParams.get('ruleId')

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    await prisma.reorderRule.delete({
      where: { id: ruleId }
    })

    return NextResponse.json({ message: 'Reorder rule deleted successfully' })

  } catch (error) {
    console.error('Error deleting reorder rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete reorder rule' },
      { status: 500 }
    )
  }
}

// Trigger automatic reordering
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { storeId, productIds, forceReorder } = triggerReorderSchema.parse(body)

    let whereClause: any = {
      storeId,
      isActive: true,
      autoReorder: true
    }

    if (productIds && productIds.length > 0) {
      whereClause.productId = { in: productIds }
    }

    // Get active reorder rules
    const reorderRules = await prisma.reorderRule.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            supplier: true
          }
        }
      }
    })

    const reorderActions = []
    
    for (const rule of reorderRules) {
      const currentStock = rule.product.currentStock
      const needsReorder = forceReorder || currentStock <= rule.reorderPoint

      if (needsReorder) {
        const recommendedQuantity = calculateReorderQuantity(
          currentStock,
          rule.reorderPoint,
          rule.maxStock || rule.reorderQuantity * 2,
          rule.reorderQuantity
        )

        // Create reorder notification
        const notification = await prisma.notification.create({
          data: {
            storeId,
            productId: rule.productId,
            type: 'REORDER_ALERT',
            title: 'Automatic Reorder Triggered',
            message: `${rule.product.title} needs reordering. Recommended quantity: ${recommendedQuantity}`,
            priority: currentStock === 0 ? 'URGENT' : 'HIGH',
            channels: ['IN_APP', 'EMAIL'],
            metadata: {
              ruleId: rule.id,
              currentStock,
              reorderPoint: rule.reorderPoint,
              recommendedQuantity,
              supplierId: rule.product.supplierId,
              cost: rule.product.cost
            }
          }
        })

        // Update last triggered timestamp
        await prisma.reorderRule.update({
          where: { id: rule.id },
          data: { lastTriggered: new Date() }
        })

        reorderActions.push({
          productId: rule.productId,
          productTitle: rule.product.title,
          currentStock,
          reorderPoint: rule.reorderPoint,
          recommendedQuantity,
          notificationId: notification.id,
          supplier: rule.product.supplier?.name || 'No supplier assigned'
        })
      }
    }

    return NextResponse.json({
      reorderActions,
      summary: {
        rulesProcessed: reorderRules.length,
        reordersTriggered: reorderActions.length,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error triggering reorders:', error)
    return NextResponse.json(
      { error: 'Failed to trigger reorders' },
      { status: 500 }
    )
  }
}

// Helper function to calculate optimal reorder quantity
function calculateReorderQuantity(
  currentStock: number,
  reorderPoint: number,
  maxStock: number,
  defaultReorderQuantity: number
): number {
  // Economic Order Quantity (EOQ) simplified calculation
  const stockToReorder = Math.max(0, reorderPoint - currentStock)
  const recommendedQuantity = Math.max(stockToReorder, defaultReorderQuantity)
  
  // Don't exceed max stock capacity
  const finalQuantity = Math.min(recommendedQuantity, maxStock - currentStock)
  
  return Math.max(0, finalQuantity)
}