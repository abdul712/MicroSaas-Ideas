import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { signUpSchema } from '@/lib/validations'
import { createHandler, successResponse, errorResponse, ErrorCodes } from '@/lib/api-helpers'
import { generateSlug } from '@/lib/utils'

export const POST = createHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = signUpSchema.parse(body)
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email },
  })
  
  if (existingUser) {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'User with this email already exists',
      400
    )
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 12)
  
  // Create organization slug
  const orgSlug = generateSlug(validatedData.organizationName)
  let uniqueSlug = orgSlug
  let counter = 1
  
  // Ensure slug is unique
  while (await prisma.organization.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${orgSlug}-${counter}`
    counter++
  }
  
  try {
    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get free plan
      const freePlan = await tx.plan.findFirst({
        where: { slug: 'free' }
      })
      
      if (!freePlan) {
        throw new Error('Free plan not found')
      }
      
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: validatedData.organizationName,
          slug: uniqueSlug,
          planId: freePlan.id,
        },
      })
      
      // Create user
      const user = await tx.user.create({
        data: {
          name: validatedData.name,
          email: validatedData.email,
          password: hashedPassword,
          role: 'OWNER',
          organizationId: organization.id,
        },
      })
      
      return { user, organization }
    })
    
    return successResponse({
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to create account',
      500
    )
  }
})