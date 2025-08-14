import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const updateBusinessSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  category: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = params

    // Check cache first
    const cacheKey = `business:${businessId}`
    const cachedData = await redis.getJson(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }

    const business = await prisma.business.findUnique({
      where: { 
        id: businessId,
        ownerId: session.user.id // Ensure ownership
      },
      include: {
        locations: {
          where: { isActive: true },
          include: {
            _count: {
              select: {
                reviews: {
                  where: {
                    postedAt: {
                      gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                  }
                }
              }
            }
          }
        },
        integrationTokens: {
          select: {
            platform: true,
            isActive: true,
            lastSyncAt: true,
            syncStatus: true
          }
        },
        subscriptions: {
          where: {
            status: 'ACTIVE'
          }
        },
        _count: {
          select: {
            locations: true,
            reviewTemplates: true,
            alertSettings: true
          }
        }
      }
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Cache the result
    await redis.setJson(cacheKey, business, 300) // 5 minutes cache

    return NextResponse.json(business)
  } catch (error) {
    console.error('Get business error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = params
    const body = await request.json()
    const validatedData = updateBusinessSchema.parse(body)

    // Verify ownership
    const existingBusiness = await prisma.business.findUnique({
      where: { 
        id: businessId,
        ownerId: session.user.id
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        ...validatedData,
        website: validatedData.website || null,
        updatedAt: new Date()
      },
      include: {
        locations: {
          where: { isActive: true }
        },
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
        entityId: businessId,
        action: 'UPDATE',
        changes: validatedData,
        userId: session.user.id
      }
    })

    // Invalidate cache
    await Promise.all([
      redis.del(`business:${businessId}`),
      redis.del(`businesses:${session.user.id}`)
    ])

    return NextResponse.json(business)
  } catch (error) {
    console.error('Update business error:', error)

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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { businessId } = params

    // Verify ownership
    const existingBusiness = await prisma.business.findUnique({
      where: { 
        id: businessId,
        ownerId: session.user.id
      },
      include: {
        locations: {
          include: {
            reviews: true
          }
        }
      }
    })

    if (!existingBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Soft delete - just mark as inactive
    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'BUSINESS',
        entityId: businessId,
        action: 'DELETE',
        changes: {
          soft_delete: true,
          deleted_at: new Date().toISOString()
        },
        userId: session.user.id
      }
    })

    // Invalidate cache
    await Promise.all([
      redis.del(`business:${businessId}`),
      redis.del(`businesses:${session.user.id}`)
    ])

    return NextResponse.json({ message: 'Business deleted successfully' })
  } catch (error) {
    console.error('Delete business error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}