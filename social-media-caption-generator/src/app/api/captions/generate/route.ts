import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateCaption } from '@/lib/ai';
import { Platform, AIProvider, GenerationStatus } from '@prisma/client';
import { z } from 'zod';

const generateRequestSchema = z.object({
  prompt: z.string().min(10, 'Prompt must be at least 10 characters'),
  platform: z.nativeEnum(Platform),
  brandVoiceId: z.string().optional(),
  imageId: z.string().optional(),
  organizationId: z.string().optional(),
  projectId: z.string().optional(),
  preferences: z.object({
    aiProvider: z.nativeEnum(AIProvider).optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(50).max(1000).optional(),
    enableFallback: z.boolean().optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validatedData = generateRequestSchema.parse(body);

    // Check user credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
        organizationMemberships: {
          where: validatedData.organizationId ? {
            organizationId: validatedData.organizationId
          } : undefined,
          include: {
            organization: {
              include: {
                subscription: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Determine which subscription to use (org vs personal)
    let activeSubscription = user.subscription;
    if (validatedData.organizationId) {
      const orgMembership = user.organizationMemberships.find(
        m => m.organizationId === validatedData.organizationId
      );
      if (orgMembership?.organization.subscription) {
        activeSubscription = orgMembership.organization.subscription;
      }
    }

    if (!activeSubscription || activeSubscription.credits <= 0) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402 }
      );
    }

    // Get brand voice if specified
    let brandVoice;
    if (validatedData.brandVoiceId) {
      brandVoice = await prisma.brandVoice.findFirst({
        where: {
          id: validatedData.brandVoiceId,
          OR: [
            { userId: session.user.id },
            { organizationId: validatedData.organizationId },
          ],
        },
      });
    }

    // Get image analysis if specified
    let imageAnalysis;
    if (validatedData.imageId) {
      const image = await prisma.image.findFirst({
        where: {
          id: validatedData.imageId,
          userId: session.user.id,
        },
      });
      
      if (image) {
        imageAnalysis = {
          objects: image.objects,
          scene: (image.analysisData as any)?.scene,
          colors: image.colors,
          text: image.text,
          faces: image.faces,
          mood: (image.analysisData as any)?.mood,
        };
      }
    }

    // Create caption record
    const captionRecord = await prisma.caption.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        projectId: validatedData.projectId,
        imageId: validatedData.imageId,
        brandVoiceId: validatedData.brandVoiceId,
        originalPrompt: validatedData.prompt,
        platform: validatedData.platform,
        content: '', // Will be updated after generation
        hashtags: [],
        emojis: [],
        aiProvider: validatedData.preferences?.aiProvider || AIProvider.GOOGLE,
        modelUsed: validatedData.preferences?.model || 'auto',
        generationStatus: GenerationStatus.PROCESSING,
      },
    });

    // Generate caption
    const startTime = Date.now();
    
    const generationResult = await generateCaption({
      prompt: validatedData.prompt,
      platform: validatedData.platform,
      brandVoice: brandVoice ? {
        name: brandVoice.name,
        type: brandVoice.type,
        description: brandVoice.description,
        examples: brandVoice.examples,
        keywords: brandVoice.keywords,
        toneGuidelines: brandVoice.toneGuidelines,
      } : undefined,
      imageAnalysis,
      preferences: validatedData.preferences,
    });

    if (!generationResult.success) {
      // Update caption record with error
      await prisma.caption.update({
        where: { id: captionRecord.id },
        data: {
          generationStatus: GenerationStatus.FAILED,
          metadata: { error: generationResult.error },
        },
      });

      return NextResponse.json(
        { error: generationResult.error },
        { status: 500 }
      );
    }

    // Update caption record with results
    const updatedCaption = await prisma.caption.update({
      where: { id: captionRecord.id },
      data: {
        content: generationResult.caption!,
        hashtags: generationResult.hashtags!,
        emojis: generationResult.emojis!,
        aiProvider: generationResult.metadata.aiProvider,
        modelUsed: generationResult.metadata.model,
        generationStatus: GenerationStatus.COMPLETED,
        generationTime: generationResult.metadata.generationTime,
        cost: generationResult.metadata.cost,
        qualityScore: generationResult.metadata.qualityScore,
        brandVoiceMatch: generationResult.metadata.brandVoiceMatch,
        metadata: {
          fallbackUsed: generationResult.metadata.fallbackUsed,
          usage: generationResult.metadata,
        },
      },
    });

    // Deduct credits
    const creditsUsed = Math.ceil(generationResult.metadata.cost * 10); // 1 credit = $0.10
    
    if (validatedData.organizationId && activeSubscription.id.includes('org')) {
      await prisma.organizationSubscription.update({
        where: { id: activeSubscription.id },
        data: { credits: { decrement: creditsUsed } },
      });
      
      await prisma.organizationUsageRecord.create({
        data: {
          subscriptionId: activeSubscription.id,
          creditsUsed,
          action: 'caption_generation',
          metadata: {
            captionId: captionRecord.id,
            platform: validatedData.platform,
            aiProvider: generationResult.metadata.aiProvider,
            cost: generationResult.metadata.cost,
          },
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: { credits: { decrement: creditsUsed } },
      });
      
      await prisma.usageRecord.create({
        data: {
          subscriptionId: activeSubscription.id,
          creditsUsed,
          action: 'caption_generation',
          metadata: {
            captionId: captionRecord.id,
            platform: validatedData.platform,
            aiProvider: generationResult.metadata.aiProvider,
            cost: generationResult.metadata.cost,
          },
        },
      });
    }

    // Update user analytics
    await prisma.userAnalytics.upsert({
      where: { userId: session.user.id },
      update: {
        totalCaptionsGenerated: { increment: 1 },
        totalCreditsUsed: { increment: creditsUsed },
        averageGenerationTime: generationResult.metadata.generationTime,
        lastActiveAt: new Date(),
      },
      create: {
        userId: session.user.id,
        totalCaptionsGenerated: 1,
        totalCreditsUsed: creditsUsed,
        averageGenerationTime: generationResult.metadata.generationTime,
        lastActiveAt: new Date(),
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        type: 'CAPTION_GENERATED',
        description: `Generated ${validatedData.platform} caption`,
        metadata: {
          captionId: captionRecord.id,
          platform: validatedData.platform,
          aiProvider: generationResult.metadata.aiProvider,
          creditsUsed,
        },
      },
    });

    return NextResponse.json({
      success: true,
      caption: {
        id: updatedCaption.id,
        content: updatedCaption.content,
        hashtags: updatedCaption.hashtags,
        emojis: updatedCaption.emojis,
        platform: updatedCaption.platform,
        qualityScore: updatedCaption.qualityScore,
        brandVoiceMatch: updatedCaption.brandVoiceMatch,
        metadata: {
          aiProvider: updatedCaption.aiProvider,
          model: updatedCaption.modelUsed,
          cost: updatedCaption.cost,
          generationTime: updatedCaption.generationTime,
          creditsUsed,
        },
      },
      remainingCredits: activeSubscription.credits - creditsUsed,
    });

  } catch (error) {
    console.error('Caption generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}