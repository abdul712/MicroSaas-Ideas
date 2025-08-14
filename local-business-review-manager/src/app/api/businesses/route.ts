import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  category: z.string().optional(),
})

const updateBusinessSchema = createBusinessSchema.partial()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check cache first
    const cacheKey = `businesses:${session.user.id}`
    const cachedData = await redis.getJson(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    const businesses = await prisma.business.findMany({
      where: {
        ownerId: session.user.id,
        isActive: true
      },
      include: {
        locations: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            country: true,
            isActive: true,
            _count: {
              select: {
                reviews: {
                  where: {
                    postedAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                  }
                }
              }
            }
          }
        },
        _count: {
          select: {
            locations: {
              where: { isActive: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Cache the results
    await redis.setJson(cacheKey, businesses, 300) // 5 minutes cache

    return NextResponse.json(businesses)
  } catch (error) {
    console.error('Get businesses error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createBusinessSchema.parse(body)

    const business = await prisma.business.create({
      data: {
        ...validatedData,
        website: validatedData.website || null,
        ownerId: session.user.id,
      },
      include: {
        locations: true,
        _count: {
          select: {
            locations: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'BUSINESS',
        entityId: business.id,
        action: 'CREATE',
        changes: validatedData,
        userId: session.user.id
      }
    })

    // Invalidate cache
    const cacheKey = `businesses:${session.user.id}`
    await redis.del(cacheKey)

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Create business error:', error)

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