import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { slugify } from '@/lib/utils'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, organizationName } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate organization slug
    const baseSlug = slugify(organizationName)
    let slug = baseSlug
    let counter = 1

    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'MEMBER',
        },
      })

      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          slug,
          ownerId: user.id,
          planType: 'FREE',
          settings: {
            timezone: 'UTC',
            language: 'en',
            notifications: {
              email: true,
              slack: false,
            },
          },
        },
      })

      // Add user as organization member
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          orgId: organization.id,
          role: 'OWNER',
        },
      })

      // Create billing record
      await tx.billing.create({
        data: {
          orgId: organization.id,
          planType: 'FREE',
          status: 'active',
        },
      })

      return { user, organization }
    })

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}