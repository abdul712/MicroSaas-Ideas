import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateLeadMagnetContent, generateLeadMagnetImage, trackUsage } from '@/lib/openai'
import { rateLimiter } from '@/lib/redis'

// Request validation schema
const generateRequestSchema = z.object({
  type: z.enum(['content', 'image']),
  leadMagnetType: z.enum(['ebook', 'checklist', 'template', 'calculator', 'infographic']).optional(),
  prompt: z.string().min(1),
  parameters: z.object({
    industry: z.string().optional(),
    tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'conversational']).optional(),
    targetAudience: z.string().optional(),
    keyPoints: z.array(z.string()).optional(),
    wordCount: z.number().min(100).max(5000).optional(),
    brandVoice: z.string().optional(),
    style: z.enum(['photorealistic', 'illustration', 'minimalist', 'corporate', 'creative']).optional(),
    aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).optional(),
    colors: z.array(z.string()).optional(),
  }).optional().default({}),
})

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = generateRequestSchema.parse(body)

    const { type, leadMagnetType, prompt, parameters } = validatedData
    const userId = session.user.id
    const organizationId = session.user.organizationId

    // Check rate limiting
    const rateLimitKey = `ai_generation:${organizationId}`
    const rateLimit = await rateLimiter.check(rateLimitKey, 10, 60 * 60 * 1000) // 10 per hour

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      )
    }

    // Get organization and check usage limits
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Check monthly generation limits based on plan
    const usage = organization.usage as any
    const limits = organization.planLimits as any
    
    if (usage.monthlyGenerations >= limits.monthlyGenerations) {
      return NextResponse.json(
        { 
          error: 'Monthly generation limit exceeded',
          usage: usage.monthlyGenerations,
          limit: limits.monthlyGenerations,
        },
        { status: 402 } // Payment Required
      )
    }

    // Create AI generation record
    const generation = await prisma.aIGeneration.create({
      data: {
        type,
        prompt,
        parameters,
        status: 'pending',
        userId,
      },
    })

    let result: any
    let tokensUsed = 0

    try {
      if (type === 'content') {
        if (!leadMagnetType) {
          throw new Error('Lead magnet type required for content generation')
        }

        const contentResult = await generateLeadMagnetContent({
          type: leadMagnetType,
          topic: prompt,
          ...parameters,
        })

        result = {
          content: contentResult.content,
          model: contentResult.model,
        }
        tokensUsed = contentResult.usage?.total_tokens || 0

      } else if (type === 'image') {
        const imageResult = await generateLeadMagnetImage({
          prompt,
          style: parameters.style || 'professional',
          aspectRatio: parameters.aspectRatio || '16:9',
          colors: parameters.colors,
        })

        result = {
          url: imageResult.url,
          revisedPrompt: imageResult.revisedPrompt,
        }
        tokensUsed = 1 // DALL-E doesn't use tokens, use 1 for tracking

      } else {
        throw new Error('Invalid generation type')
      }

      // Update generation record with success
      await prisma.aIGeneration.update({
        where: { id: generation.id },
        data: {
          result,
          status: 'completed',
          tokensUsed,
        },
      })

      // Update organization usage
      await prisma.organization.update({
        where: { id: organizationId },
        data: {
          usage: {
            ...usage,
            monthlyGenerations: usage.monthlyGenerations + 1,
          },
        },
      })

      // Track usage for billing/analytics
      await trackUsage(userId, organizationId, type, tokensUsed)

      return NextResponse.json({
        success: true,
        generationId: generation.id,
        result,
        tokensUsed,
        remaining: {
          generations: limits.monthlyGenerations - usage.monthlyGenerations - 1,
          rateLimit: rateLimit.remaining - 1,
        },
      })

    } catch (error) {
      // Update generation record with error
      await prisma.aIGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      console.error('AI generation error:', error)
      throw error
    }

  } catch (error) {
    console.error('Generate API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const organizationId = session.user.organizationId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    // Build where clause
    const where: any = {
      user: {
        organizationId,
      },
    }

    if (type) {
      where.type = type
    }

    if (status) {
      where.status = status
    }

    // Get generations with pagination
    const [generations, total] = await Promise.all([
      prisma.aIGeneration.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          leadMagnet: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aIGeneration.count({ where }),
    ])

    // Get organization usage stats
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        usage: true,
        planLimits: true,
        subscription: true,
      },
    })

    return NextResponse.json({
      generations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      usage: organization?.usage,
      limits: organization?.planLimits,
      subscription: organization?.subscription,
    })

  } catch (error) {
    console.error('Get generations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}