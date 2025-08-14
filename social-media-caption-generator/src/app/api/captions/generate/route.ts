import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCaptions, getOptimalAIConfig, estimateGenerationCost } from '@/services/ai-service'
import { checkRateLimit, updateUserCredits } from '@/lib/auth'

// Request validation schema
const GenerateCaptionRequest = z.object({
  prompt: z.string().optional(),
  imageUrl: z.string().url().optional(),
  platform: z.enum(['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok']),
  projectId: z.string(),
  brandVoiceId: z.string().optional(),
  targetAudience: z.string().optional(),
  industry: z.string().optional(),
  customInstructions: z.string().optional(),
  complexity: z.enum(['simple', 'medium', 'complex']).default('medium'),
  aiProvider: z.enum(['openai', 'anthropic']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = GenerateCaptionRequest.parse(body)

    // Check rate limits
    const canProceed = await checkRateLimit(session.user.id)
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Check if user has sufficient credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { creditsRemaining: true, subscriptionTier: true },
    })

    if (!user || user.creditsRemaining < 1) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      )
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        organization: {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        brandVoice: true,
        organization: true,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Get brand voice if specified
    let brandVoice = null
    if (validatedData.brandVoiceId) {
      brandVoice = await prisma.brandVoice.findFirst({
        where: {
          id: validatedData.brandVoiceId,
          organizationId: project.organizationId,
          isActive: true,
        },
      })
    } else if (project.brandVoice) {
      brandVoice = project.brandVoice
    }

    // Process image if provided
    let imageAnalysis = null
    if (validatedData.imageUrl) {
      // TODO: Implement Google Vision API image analysis
      // For now, we'll use a placeholder
      imageAnalysis = {
        objects: ['placeholder'],
        colors: ['#ff0000'],
        text: [],
        faces: 0,
        sentiment: 'neutral',
      }
    }

    // Get optimal AI configuration
    const prioritizeCost = user.subscriptionTier === 'free'
    const aiConfig = validatedData.aiProvider
      ? { provider: validatedData.aiProvider, model: 'gpt-4-turbo-preview' }
      : getOptimalAIConfig(validatedData.complexity, prioritizeCost)

    // Prepare generation request
    const generationRequest = {
      prompt: validatedData.prompt,
      imageAnalysis,
      platform: validatedData.platform,
      brandVoice: brandVoice
        ? {
            tone: brandVoice.tone || 'professional',
            personality: brandVoice.personality as any,
            sampleContent: brandVoice.sampleContent,
          }
        : undefined,
      targetAudience: validatedData.targetAudience,
      industry: validatedData.industry || brandVoice?.industry,
      customInstructions: validatedData.customInstructions,
    }

    // Generate captions
    const startTime = Date.now()
    const result = await generateCaptions(generationRequest, aiConfig)
    const generationTime = Date.now() - startTime

    // Calculate cost
    const costUsd = estimateGenerationCost(
      result.tokensUsed,
      result.aiProvider,
      result.model
    )

    // Save caption to database
    const savedCaption = await prisma.caption.create({
      data: {
        projectId: validatedData.projectId,
        userId: session.user.id,
        brandVoiceId: brandVoice?.id,
        prompt: validatedData.prompt,
        imageUrl: validatedData.imageUrl,
        imageAnalysis: imageAnalysis as any,
        targetPlatform: validatedData.platform,
        captionText: result.captions[0]?.text || '',
        hashtags: result.captions[0]?.hashtags || [],
        emojis: result.captions[0]?.emojis || [],
        callToAction: result.captions[0]?.callToAction,
        aiModel: result.model,
        generationTime,
        tokensUsed: result.tokensUsed,
        qualityScore: result.captions[0]?.score ? result.captions[0].score / 100 : null,
      },
    })

    // Log API usage
    await prisma.apiUsage.create({
      data: {
        organizationId: project.organizationId,
        userId: session.user.id,
        endpoint: '/api/captions/generate',
        method: 'POST',
        aiProvider: result.aiProvider,
        aiModel: result.model,
        tokensUsed: result.tokensUsed,
        costUsd,
      },
    })

    // Update user credits
    await updateUserCredits(session.user.id, 1)

    // Return response
    return NextResponse.json({
      success: true,
      captionId: savedCaption.id,
      captions: result.captions,
      metadata: {
        aiProvider: result.aiProvider,
        model: result.model,
        tokensUsed: result.tokensUsed,
        generationTime: result.generationTime,
        costUsd,
        creditsUsed: 1,
        creditsRemaining: user.creditsRemaining - 1,
      },
    })
  } catch (error) {
    console.error('Caption generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}