import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AIContentEngine, GenerationRequest } from '@/lib/ai-engine'
import { prisma } from '@/lib/prisma'
import { RateLimiter } from '@/lib/redis'
import { z } from 'zod'

const generateRequestSchema = z.object({
  type: z.enum(['EBOOK', 'CHECKLIST', 'TEMPLATE', 'CALCULATOR', 'INFOGRAPHIC']),
  topic: z.string().min(1).max(200),
  industry: z.string().min(1).max(100),
  targetAudience: z.string().min(1).max(200),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'conversational']),
  brandVoice: z.string().optional(),
  contentLength: z.enum(['short', 'medium', 'long']),
  includeImages: z.boolean().default(false)
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateRequestSchema.parse(body)

    // Check user permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            id: true,
            plan: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check plan limits
    const planLimits = {
      STARTER: { monthly: 10, includeImages: false },
      PROFESSIONAL: { monthly: 50, includeImages: true },
      ENTERPRISE: { monthly: 200, includeImages: true }
    }

    const userPlan = user.organization.plan as keyof typeof planLimits
    const limits = planLimits[userPlan]

    if (!limits) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    // Check monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const monthlyUsage = await prisma.usage.findUnique({
      where: {
        organizationId_type_period_date: {
          organizationId: user.organizationId,
          type: 'AI_GENERATIONS',
          period: 'MONTHLY',
          date: new Date(currentMonth + '-01')
        }
      }
    })

    if (monthlyUsage && monthlyUsage.count >= limits.monthly) {
      return NextResponse.json(
        { error: 'Monthly generation limit exceeded. Please upgrade your plan.' },
        { status: 429 }
      )
    }

    // Check image generation permissions
    if (validatedData.includeImages && !limits.includeImages) {
      return NextResponse.json(
        { error: 'Image generation not available on your plan. Please upgrade.' },
        { status: 403 }
      )
    }

    // Rate limiting
    const rateLimitKey = `ai_generation:${user.organizationId}`
    const rateLimit = await RateLimiter.checkLimit(rateLimitKey, 10, 3600) // 10 per hour

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      )
    }

    // Prepare generation request
    const generationRequest: GenerationRequest = {
      ...validatedData,
      organizationId: user.organizationId,
      userId: user.id
    }

    // Generate content
    const generatedContent = await AIContentEngine.generateContent(generationRequest)

    // Update usage tracking
    await prisma.usage.upsert({
      where: {
        organizationId_type_period_date: {
          organizationId: user.organizationId,
          type: 'AI_GENERATIONS',
          period: 'MONTHLY',
          date: new Date(currentMonth + '-01')
        }
      },
      update: {
        count: {
          increment: 1
        }
      },
      create: {
        organizationId: user.organizationId,
        type: 'AI_GENERATIONS',
        period: 'MONTHLY',
        date: new Date(currentMonth + '-01'),
        count: 1
      }
    })

    // Log successful generation
    await prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.id,
        action: 'AI_CONTENT_GENERATED',
        resource: 'AI_GENERATION',
        metadata: {
          type: validatedData.type,
          topic: validatedData.topic,
          industry: validatedData.industry,
          wordCount: generatedContent.metadata.wordCount,
          qualityScore: generatedContent.metadata.qualityScore
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: generatedContent,
      usage: {
        monthly: (monthlyUsage?.count || 0) + 1,
        limit: limits.monthly,
        remaining: limits.monthly - (monthlyUsage?.count || 0) - 1
      }
    })

  } catch (error) {
    console.error('AI generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Log error
    const session = await getServerSession(authOptions)
    if (session?.user) {
      await prisma.auditLog.create({
        data: {
          organizationId: session.user.organizationId,
          userId: session.user.id,
          action: 'AI_GENERATION_ERROR',
          resource: 'AI_GENERATION',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }).catch(console.error)
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: {
          select: {
            plan: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get current usage
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyUsage = await prisma.usage.findUnique({
      where: {
        organizationId_type_period_date: {
          organizationId: user.organizationId,
          type: 'AI_GENERATIONS',
          period: 'MONTHLY',
          date: new Date(currentMonth + '-01')
        }
      }
    })

    // Get recent generations
    const recentGenerations = await prisma.aIGeneration.findMany({
      where: {
        organizationId: user.organizationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        type: true,
        qualityScore: true,
        tokensUsed: true,
        createdAt: true
      }
    })

    const planLimits = {
      STARTER: { monthly: 10, includeImages: false },
      PROFESSIONAL: { monthly: 50, includeImages: true },
      ENTERPRISE: { monthly: 200, includeImages: true }
    }

    const userPlan = user.organization.plan as keyof typeof planLimits
    const limits = planLimits[userPlan]

    return NextResponse.json({
      usage: {
        monthly: monthlyUsage?.count || 0,
        limit: limits.monthly,
        remaining: limits.monthly - (monthlyUsage?.count || 0),
        canGenerateImages: limits.includeImages
      },
      recent: recentGenerations
    })

  } catch (error) {
    console.error('Get AI usage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}