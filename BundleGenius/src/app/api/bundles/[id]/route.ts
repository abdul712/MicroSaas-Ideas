import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions, canAccessStore } from "@/lib/auth"
import { updateBundleSchema } from "@/lib/validations"
import { cacheInvalidatePattern } from "@/lib/redis"

interface RouteContext {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    
    // Get bundle with all related data
    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                compareAtPrice: true,
                quantity: true,
                trackQuantity: true,
                status: true,
                images: {
                  orderBy: { position: "asc" }
                },
                category: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: { position: "asc" }
        },
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          orderBy: { date: "desc" }
        },
        abTests: {
          where: {
            status: "RUNNING"
          },
          include: {
            test: {
              select: {
                id: true,
                name: true,
                status: true
              }
            }
          }
        }
      }
    })

    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 })
    }

    // Check store access
    if (!(await canAccessStore(session.user.id, bundle.storeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Calculate bundle metrics
    const totalPrice = bundle.items.reduce((sum, item) => 
      sum + (item.product.price * item.quantity), 0)
    
    let bundlePrice = totalPrice
    if (bundle.pricingType === "PERCENTAGE_DISCOUNT" && bundle.discountValue) {
      bundlePrice = totalPrice * (1 - bundle.discountValue)
    } else if (bundle.pricingType === "FIXED_DISCOUNT" && bundle.discountValue) {
      bundlePrice = Math.max(0, totalPrice - bundle.discountValue)
    } else if (bundle.pricingType === "FIXED_PRICE" && bundle.fixedPrice) {
      bundlePrice = bundle.fixedPrice
    }

    // Calculate performance metrics from analytics
    const last30DaysAnalytics = bundle.analytics
    const totalImpressions = last30DaysAnalytics.reduce((sum, a) => sum + a.impressions, 0)
    const totalViews = last30DaysAnalytics.reduce((sum, a) => sum + a.views, 0)
    const totalPurchases = last30DaysAnalytics.reduce((sum, a) => sum + a.purchases, 0)
    const totalRevenue = last30DaysAnalytics.reduce((sum, a) => sum + a.revenue, 0)

    const bundleWithMetrics = {
      ...bundle,
      pricing: {
        totalPrice,
        bundlePrice,
        savings: totalPrice - bundlePrice,
        savingsPercentage: totalPrice > 0 ? ((totalPrice - bundlePrice) / totalPrice) * 100 : 0
      },
      performance: {
        impressions: totalImpressions,
        views: totalViews,
        purchases: totalPurchases,
        revenue: totalRevenue,
        impressionToViewRate: totalImpressions > 0 ? (totalViews / totalImpressions) * 100 : 0,
        viewToPurchaseRate: totalViews > 0 ? (totalPurchases / totalViews) * 100 : 0,
        revenuePerView: totalViews > 0 ? totalRevenue / totalViews : 0
      }
    }

    return NextResponse.json(bundleWithMetrics)

  } catch (error) {
    console.error("Error fetching bundle:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()

    // Check if bundle exists and user has access
    const existingBundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        store: true,
        items: true
      }
    })

    if (!existingBundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 })
    }

    // Check store access
    if (!(await canAccessStore(session.user.id, existingBundle.storeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate update data
    const validatedData = updateBundleSchema.parse({ id, ...body })
    const { items, ...bundleData } = validatedData

    // Check slug uniqueness if being updated
    if (bundleData.slug && bundleData.slug !== existingBundle.slug) {
      const conflictingBundle = await prisma.bundle.findUnique({
        where: {
          storeId_slug: {
            storeId: existingBundle.storeId,
            slug: bundleData.slug
          }
        }
      })

      if (conflictingBundle) {
        return NextResponse.json(
          { error: "Bundle slug already exists" },
          { status: 409 }
        )
      }
    }

    // Validate products if items are being updated
    if (items) {
      const productIds = items.map(item => item.productId)
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds },
          storeId: existingBundle.storeId,
          status: "ACTIVE"
        },
        select: { id: true, price: true, quantity: true, trackQuantity: true }
      })

      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: "Some products are invalid or not found" },
          { status: 400 }
        )
      }

      // Check inventory availability
      const inventoryIssues = items.filter(item => {
        const product = products.find(p => p.id === item.productId)
        return product?.trackQuantity && 
               product.quantity < item.quantity
      })

      if (inventoryIssues.length > 0) {
        return NextResponse.json(
          { 
            error: "Insufficient inventory for some products",
            issues: inventoryIssues
          },
          { status: 400 }
        )
      }
    }

    // Update bundle in transaction
    const updatedBundle = await prisma.$transaction(async (tx) => {
      // Update bundle data
      const bundle = await tx.bundle.update({
        where: { id },
        data: {
          ...bundleData,
          startsAt: bundleData.startsAt ? new Date(bundleData.startsAt) : undefined,
          endsAt: bundleData.endsAt ? new Date(bundleData.endsAt) : undefined,
          lastOptimized: new Date()
        }
      })

      // Update items if provided
      if (items) {
        // Delete existing items
        await tx.bundleItem.deleteMany({
          where: { bundleId: id }
        })

        // Create new items
        await tx.bundleItem.createMany({
          data: items.map(item => ({
            bundleId: id,
            productId: item.productId,
            quantity: item.quantity,
            required: item.required,
            position: item.position
          }))
        })
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          storeId: existingBundle.storeId,
          userId: session.user.id,
          action: "UPDATE_BUNDLE",
          resource: "BUNDLE",
          resourceId: id,
          details: {
            changes: Object.keys(bundleData),
            itemsUpdated: !!items
          }
        }
      })

      // Return updated bundle with items
      return await tx.bundle.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  price: true,
                  images: {
                    orderBy: { position: "asc" },
                    take: 1
                  }
                }
              }
            }
          }
        }
      })
    })

    // Invalidate related caches
    await cacheInvalidatePattern(`recommendations:${existingBundle.storeId}:*`)
    await cacheInvalidatePattern(`pricing:${id}`)

    return NextResponse.json(updatedBundle)

  } catch (error) {
    console.error("Error updating bundle:", error)
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if bundle exists and user has access
    const existingBundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        orders: { take: 1 }, // Check if bundle has been used in orders
        abTests: { where: { status: "RUNNING" } }
      }
    })

    if (!existingBundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 })
    }

    // Check store access
    if (!(await canAccessStore(session.user.id, existingBundle.storeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Prevent deletion if bundle has orders or running A/B tests
    if (existingBundle.orders.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete bundle that has been used in orders. Archive it instead." },
        { status: 409 }
      )
    }

    if (existingBundle.abTests.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete bundle with running A/B tests. Stop tests first." },
        { status: 409 }
      )
    }

    // Soft delete by archiving instead of hard delete
    const archivedBundle = await prisma.$transaction(async (tx) => {
      const bundle = await tx.bundle.update({
        where: { id },
        data: {
          status: "ARCHIVED"
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          storeId: existingBundle.storeId,
          userId: session.user.id,
          action: "DELETE_BUNDLE",
          resource: "BUNDLE",
          resourceId: id,
          details: {
            title: existingBundle.title,
            archived: true
          }
        }
      })

      return bundle
    })

    // Invalidate related caches
    await cacheInvalidatePattern(`recommendations:${existingBundle.storeId}:*`)
    await cacheInvalidatePattern(`pricing:${id}`)

    return NextResponse.json({ 
      message: "Bundle archived successfully",
      bundle: archivedBundle 
    })

  } catch (error) {
    console.error("Error deleting bundle:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}