import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const reviewFiltersSchema = z.object({
  businessId: z.string().optional(),
  locationId: z.string().optional(),
  platform: z.enum(['GOOGLE', 'YELP', 'FACEBOOK', 'TRIPADVISOR', 'TRUSTPILOT', 'FOURSQUARE', 'CUSTOM']).optional(),
  status: z.enum(['NEW', 'REVIEWED', 'RESPONDED', 'ESCALATED', 'RESOLVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  rating: z.number().min(1).max(5).optional(),
  hasResponse: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['postedAt', 'rating', 'priority', 'status']).default('postedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters = reviewFiltersSchema.parse(Object.fromEntries(searchParams))

    // Build cache key based on filters
    const cacheKey = `reviews:${session.user.id}:${Buffer.from(JSON.stringify(filters)).toString('base64')}`
    const cachedData = await redis.getJson(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    // Get user's businesses for access control
    const userBusinesses = await prisma.business.findMany({
      where: { ownerId: session.user.id, isActive: true },
      select: { id: true }
    })

    const businessIds = userBusinesses.map(b => b.id)

    if (businessIds.length === 0) {
      return NextResponse.json({
        reviews: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: filters.page,
        hasNextPage: false,
        hasPrevPage: false
      })
    }

    // Build where clause
    const whereClause: any = {
      location: {
        businessId: {
          in: filters.businessId ? [filters.businessId] : businessIds
        },
        isActive: true
      }
    }

    if (filters.locationId) {
      whereClause.locationId = filters.locationId
    }
    if (filters.platform) {
      whereClause.platform = filters.platform
    }
    if (filters.status) {
      whereClause.status = filters.status
    }
    if (filters.priority) {
      whereClause.priority = filters.priority
    }
    if (filters.rating) {
      whereClause.rating = filters.rating
    }
    if (filters.hasResponse !== undefined) {
      whereClause.hasResponse = filters.hasResponse
    }
    if (filters.dateFrom || filters.dateTo) {
      whereClause.postedAt = {}
      if (filters.dateFrom) {
        whereClause.postedAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        whereClause.postedAt.lte = new Date(filters.dateTo)
      }
    }
    if (filters.search) {
      whereClause.OR = [
        { content: { contains: filters.search, mode: 'insensitive' } },
        { authorName: { contains: filters.search, mode: 'insensitive' } },
        { title: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    // Get total count and reviews
    const [totalCount, reviews] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({
        where: whereClause,
        include: {
          location: {
            select: {
              id: true,
              name: true,
              businessId: true,
              business: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          responses: {
            where: { isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: {
          [filters.sortBy]: filters.sortOrder
        },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit
      })
    ])

    const totalPages = Math.ceil(totalCount / filters.limit)

    const response = {
      reviews,
      totalCount,
      totalPages,
      currentPage: filters.page,
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1,
      filters: {
        ...filters,
        businessIds: businessIds
      }
    }

    // Cache results for 2 minutes
    await redis.setJson(cacheKey, response, 120)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get reviews error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid filters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

const createReviewSchema = z.object({
  locationId: z.string(),
  platform: z.enum(['GOOGLE', 'YELP', 'FACEBOOK', 'TRIPADVISOR', 'TRUSTPILOT', 'FOURSQUARE', 'CUSTOM']),
  platformReviewId: z.string(),
  authorName: z.string().optional(),
  authorAvatar: z.string().optional(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  content: z.string().optional(),
  postedAt: z.string().datetime(),
  isPublic: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createReviewSchema.parse(body)

    // Verify location ownership
    const location = await prisma.location.findUnique({
      where: { id: validatedData.locationId },
      include: {
        business: {
          select: {
            id: true,
            ownerId: true
          }
        }
      }
    })

    if (!location || location.business.ownerId !== session.user.id) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 })
    }

    // Check for duplicate review
    const existingReview = await prisma.review.findUnique({
      where: { platformReviewId: validatedData.platformReviewId }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'Review already exists' },
        { status: 400 }
      )
    }

    // Determine priority based on rating and content
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM'
    if (validatedData.rating <= 2) {
      priority = 'URGENT'
    } else if (validatedData.rating === 3) {
      priority = 'HIGH'
    } else if (validatedData.rating === 4) {
      priority = 'MEDIUM'
    } else {
      priority = 'LOW'
    }

    const review = await prisma.review.create({
      data: {
        ...validatedData,
        postedAt: new Date(validatedData.postedAt),
        priority,
        status: 'NEW'
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            business: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // Queue alert notifications
    await redis.enqueueJob('alerts', {
      type: 'NEW_REVIEW',
      reviewId: review.id,
      businessId: location.business.id,
      rating: review.rating,
      priority: review.priority
    })

    // If negative review, queue immediate alert
    if (validatedData.rating <= 3) {
      await redis.enqueueJob('alerts', {
        type: 'NEGATIVE_REVIEW',
        reviewId: review.id,
        businessId: location.business.id,
        rating: review.rating,
        priority: 'URGENT'
      }, 10) // High priority
    }

    // Invalidate review caches
    await redis.del(`reviews:${session.user.id}:*`)

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}