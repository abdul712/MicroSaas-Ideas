import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions, canAccessStore } from "@/lib/auth"
import { recommendationQuerySchema } from "@/lib/validations"
import { BundleRecommendationEngine } from "@/services/recommendation-engine"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get("storeId")
    
    if (!storeId) {
      return NextResponse.json({ error: "Store ID is required" }, { status: 400 })
    }

    // Check store access
    if (!(await canAccessStore(session.user.id, storeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Validate query parameters
    const queryParams = recommendationQuerySchema.parse({
      targetProductId: searchParams.get("targetProductId"),
      customerSegment: searchParams.get("customerSegment"),
      seasonality: searchParams.get("seasonality"),
      inventoryConstraints: searchParams.get("inventoryConstraints"),
      limit: searchParams.get("limit")
    })

    const { targetProductId, customerSegment, seasonality, inventoryConstraints, limit } = queryParams

    // Initialize recommendation engine
    const engine = new BundleRecommendationEngine(storeId)

    // Generate recommendations
    const recommendations = await engine.generateRecommendations({
      storeId,
      targetProductId,
      customerSegment,
      seasonality,
      inventoryConstraints
    }, limit)

    // Enrich recommendations with product details
    const enrichedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const products = await prisma.product.findMany({
          where: {
            id: { in: rec.products },
            storeId
          },
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            quantity: true,
            images: {
              orderBy: { position: "asc" },
              take: 1
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })

        return {
          ...rec,
          products: products,
          createdAt: new Date().toISOString()
        }
      })
    )

    // Track recommendation impressions
    await Promise.all(
      enrichedRecommendations.map(async (rec) => {
        if (rec.products.length > 0) {
          await prisma.productRecommendation.upsert({
            where: {
              productId: rec.products[0].id + "_" + rec.algorithm
            },
            create: {
              productId: rec.products[0].id,
              type: getRecommendationType(rec.algorithm),
              algorithm: rec.algorithm,
              confidence: rec.confidence,
              strength: rec.confidence,
              relatedProductIds: rec.products.slice(1).map(p => p.id),
              impressions: 1,
              metadata: rec.metadata
            },
            update: {
              impressions: { increment: 1 },
              confidence: rec.confidence,
              strength: rec.confidence,
              relatedProductIds: rec.products.slice(1).map(p => p.id),
              metadata: rec.metadata
            }
          })
        }
      })
    )

    return NextResponse.json({
      recommendations: enrichedRecommendations,
      metadata: {
        storeId,
        targetProductId,
        customerSegment,
        seasonality,
        inventoryConstraints,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error("Error generating recommendations:", error)
    
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, recommendationId, action, productIds } = body

    if (!storeId || !recommendationId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check store access
    if (!(await canAccessStore(session.user.id, storeId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Track recommendation interaction
    if (action === "click" && productIds && productIds.length > 0) {
      await Promise.all(
        productIds.map(async (productId: string) => {
          const recommendation = await prisma.productRecommendation.findFirst({
            where: {
              productId,
              id: recommendationId
            }
          })

          if (recommendation) {
            await prisma.productRecommendation.update({
              where: { id: recommendation.id },
              data: {
                clicks: { increment: 1 }
              }
            })
          }
        })
      )
    }

    // Track conversion if bundle was created from recommendation
    if (action === "create_bundle" && productIds && productIds.length > 0) {
      await Promise.all(
        productIds.map(async (productId: string) => {
          const recommendation = await prisma.productRecommendation.findFirst({
            where: {
              productId,
              id: recommendationId
            }
          })

          if (recommendation) {
            await prisma.productRecommendation.update({
              where: { id: recommendation.id },
              data: {
                conversions: { increment: 1 }
              }
            })
          }
        })
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error tracking recommendation interaction:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to map algorithm names to recommendation types
function getRecommendationType(algorithm: string) {
  switch (algorithm) {
    case "association_rules":
      return "FREQUENTLY_BOUGHT_TOGETHER"
    case "collaborative_filtering":
      return "SIMILAR_PRODUCTS"
    case "content_based":
      return "SIMILAR_PRODUCTS"
    case "seasonal_analysis":
      return "SEASONAL"
    case "inventory_optimization":
      return "CROSS_SELL"
    default:
      return "FREQUENTLY_BOUGHT_TOGETHER"
  }
}