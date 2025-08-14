import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSupplierSchema = z.object({
  storeId: z.string(),
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    zipCode: z.string().optional(),
  }).optional(),
  leadTime: z.number().int().min(1).default(7),
  reliability: z.number().min(0).max(100).default(95),
  qualityRating: z.number().min(0).max(5).default(5),
})

const updateSupplierSchema = createSupplierSchema.partial().omit(['storeId'])

const supplierPerformanceSchema = z.object({
  supplierId: z.string(),
  deliveryTime: z.number().int().min(1),
  qualityScore: z.number().min(0).max(5),
  onTimeDelivery: z.boolean(),
  orderValue: z.number().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const includePerformance = searchParams.get('includePerformance') === 'true'

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      )
    }

    const suppliers = await prisma.supplier.findMany({
      where: { storeId },
      include: {
        products: includeProducts ? {
          select: {
            id: true,
            title: true,
            sku: true,
            currentStock: true,
            reorderPoint: true,
          }
        } : false,
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' },
    })

    // Calculate performance metrics if requested
    let suppliersWithPerformance = suppliers
    if (includePerformance) {
      suppliersWithPerformance = await Promise.all(
        suppliers.map(async (supplier) => {
          const performanceData = await calculateSupplierPerformance(supplier.id)
          return {
            ...supplier,
            performance: performanceData
          }
        })
      )
    }

    return NextResponse.json({
      suppliers: suppliersWithPerformance,
      summary: {
        totalSuppliers: suppliers.length,
        avgReliability: suppliers.reduce((sum, s) => sum + s.reliability.toNumber(), 0) / suppliers.length,
        avgQuality: suppliers.reduce((sum, s) => sum + s.qualityRating.toNumber(), 0) / suppliers.length,
        avgLeadTime: suppliers.reduce((sum, s) => sum + s.leadTime, 0) / suppliers.length,
      }
    })

  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createSupplierSchema.parse(body)

    // Check if supplier with same name already exists for this store
    const existingSupplier = await prisma.supplier.findFirst({
      where: {
        storeId: validatedData.storeId,
        name: validatedData.name
      }
    })

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this name already exists' },
        { status: 409 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        ...validatedData,
        reliability: validatedData.reliability,
        qualityRating: validatedData.qualityRating,
      },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json(supplier, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateSupplierSchema.parse(body)

    const updatedSupplier = await prisma.supplier.update({
      where: { id: supplierId },
      data: {
        ...validatedData,
        reliability: validatedData.reliability,
        qualityRating: validatedData.qualityRating,
      },
      include: {
        products: {
          select: {
            id: true,
            title: true,
            sku: true,
            currentStock: true,
          }
        },
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    return NextResponse.json(updatedSupplier)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      )
    }

    // Check if supplier has associated products
    const productsCount = await prisma.product.count({
      where: { supplierId }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete supplier with ${productsCount} associated products. Please reassign products first.` 
        },
        { status: 409 }
      )
    }

    await prisma.supplier.delete({
      where: { id: supplierId }
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })

  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}

// Update supplier performance metrics
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'performance') {
      const body = await request.json()
      const { supplierId, deliveryTime, qualityScore, onTimeDelivery, orderValue } = 
        supplierPerformanceSchema.parse(body)

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId }
      })

      if (!supplier) {
        return NextResponse.json(
          { error: 'Supplier not found' },
          { status: 404 }
        )
      }

      // Update supplier metrics based on new performance data
      const currentReliability = supplier.reliability.toNumber()
      const currentQuality = supplier.qualityRating.toNumber()

      // Simple weighted average update (in production, use more sophisticated algorithms)
      const reliabilityAdjustment = onTimeDelivery ? 2 : -5
      const newReliability = Math.max(0, Math.min(100, currentReliability + reliabilityAdjustment * 0.1))

      const qualityAdjustment = (qualityScore - currentQuality) * 0.1
      const newQuality = Math.max(0, Math.min(5, currentQuality + qualityAdjustment))

      // Update lead time based on actual delivery performance
      const leadTimeAdjustment = deliveryTime !== supplier.leadTime ? 
        Math.round((deliveryTime - supplier.leadTime) * 0.2) : 0
      const newLeadTime = Math.max(1, supplier.leadTime + leadTimeAdjustment)

      const updatedSupplier = await prisma.supplier.update({
        where: { id: supplierId },
        data: {
          reliability: newReliability,
          qualityRating: newQuality,
          leadTime: newLeadTime,
        }
      })

      return NextResponse.json({
        supplier: updatedSupplier,
        performanceUpdate: {
          previousReliability: currentReliability,
          newReliability,
          previousQuality: currentQuality,
          newQuality,
          previousLeadTime: supplier.leadTime,
          newLeadTime,
          deliveryPerformance: {
            actualDeliveryTime: deliveryTime,
            onTime: onTimeDelivery,
            qualityScore
          }
        }
      })
    }

    return NextResponse.json(
      { error: 'Invalid action. Use performance to update supplier metrics.' },
      { status: 400 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating supplier performance:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier performance' },
      { status: 500 }
    )
  }
}

// Helper function to calculate supplier performance metrics
async function calculateSupplierPerformance(supplierId: string) {
  try {
    // Get supplier's products and their reorder history
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      include: {
        products: {
          include: {
            inventoryLogs: {
              where: {
                type: 'PURCHASE',
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                }
              },
              orderBy: { createdAt: 'desc' }
            },
            reorderRules: true
          }
        }
      }
    })

    if (!supplier) return null

    const totalProducts = supplier.products.length
    const productsWithStock = supplier.products.filter(p => p.currentStock > 0).length
    const productsLowStock = supplier.products.filter(p => 
      p.reorderRules[0] && p.currentStock <= p.reorderRules[0].reorderPoint
    ).length

    // Calculate delivery performance from purchase logs
    const totalPurchases = supplier.products.reduce((sum, p) => sum + p.inventoryLogs.length, 0)
    const avgOrderValue = supplier.products.reduce((sum, p) => {
      const productValue = p.inventoryLogs.reduce((pSum, log) => 
        pSum + (log.cost?.toNumber() || 0) * log.quantity, 0
      )
      return sum + productValue
    }, 0) / Math.max(totalPurchases, 1)

    return {
      totalProducts,
      productsInStock: productsWithStock,
      productsLowStock,
      stockCoverage: totalProducts > 0 ? (productsWithStock / totalProducts) * 100 : 0,
      recentPurchases: totalPurchases,
      avgOrderValue,
      lastOrderDate: supplier.products.reduce((latest, p) => {
        const productLatest = p.inventoryLogs.reduce((pLatest, log) => 
          log.createdAt > pLatest ? log.createdAt : pLatest, new Date(0)
        )
        return productLatest > latest ? productLatest : latest
      }, new Date(0))
    }
  } catch (error) {
    console.error('Error calculating supplier performance:', error)
    return null
  }
}