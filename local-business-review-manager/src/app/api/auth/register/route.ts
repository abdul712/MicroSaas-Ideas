import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  businessType: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.ip || 'unknown'
    const rateLimitKey = `register_attempt:${ip}`
    const isAllowed = await redis.rateLimitCheck(rateLimitKey, 5, 900) // 5 attempts per 15 minutes
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user and business in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email.toLowerCase(),
          role: 'OWNER',
        }
      })

      // Store password hash in separate secure table
      await tx.$executeRaw`
        INSERT INTO user_auth (user_id, password_hash) 
        VALUES (${user.id}, ${hashedPassword})
      `

      // Create business
      const business = await tx.business.create({
        data: {
          name: validatedData.businessName,
          phone: validatedData.phone,
          website: validatedData.website || null,
          category: validatedData.businessType,
          ownerId: user.id,
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          entityType: 'USER',
          entityId: user.id,
          action: 'USER_REGISTRATION',
          changes: {
            email: user.email,
            businessId: business.id,
            businessName: business.name,
            timestamp: new Date().toISOString()
          }
        }
      })

      return { user, business }
    })

    // Cache user session data
    await redis.setJson(`user_profile:${result.user.id}`, {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
      businessId: result.business.id,
      businessName: result.business.name,
    }, 3600) // 1 hour cache

    return NextResponse.json({
      message: 'Registration successful',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)

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