import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ai/openai';
import { BrandVoiceType } from '@prisma/client';
import { z } from 'zod';

const createBrandVoiceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  type: z.nativeEnum(BrandVoiceType),
  examples: z.array(z.string().min(10, 'Examples must be at least 10 characters')).min(3, 'At least 3 examples required').max(20, 'Maximum 20 examples'),
  keywords: z.array(z.string().min(1)).min(3, 'At least 3 keywords required').max(50, 'Maximum 50 keywords'),
  toneGuidelines: z.string().optional(),
  organizationId: z.string().optional(),
  isDefault: z.boolean().optional().default(false),
});

const getBrandVoicesSchema = z.object({
  organizationId: z.string().optional(),
  type: z.nativeEnum(BrandVoiceType).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = getBrandVoicesSchema.parse(params);

    // Build where clause
    const where: any = {
      OR: [
        { userId: session.user.id },
        ...(validatedParams.organizationId ? [{ organizationId: validatedParams.organizationId }] : []),
      ],
      isActive: true,
    };

    if (validatedParams.type) {
      where.type = validatedParams.type;
    }

    if (validatedParams.search) {
      where.AND = [
        where,
        {
          OR: [
            { name: { contains: validatedParams.search, mode: 'insensitive' } },
            { description: { contains: validatedParams.search, mode: 'insensitive' } },
            { keywords: { hasSome: [validatedParams.search] } },
          ],
        },
      ];
      delete where.OR;
    }

    const brandVoices = await prisma.brandVoice.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { lastUsedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            captions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: brandVoices,
    });

  } catch (error) {
    console.error('Get brand voices error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createBrandVoiceSchema.parse(body);

    // Check if user has permission to create brand voice in organization
    if (validatedData.organizationId) {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          organizationId: validatedData.organizationId,
          userId: session.user.id,
          role: { in: ['owner', 'admin', 'member'] },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Check subscription limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user?.subscription) {
      return NextResponse.json(
        { error: 'No active subscription' },
        { status: 402 }
      );
    }

    // Count existing brand voices
    const existingVoicesCount = await prisma.brandVoice.count({
      where: {
        OR: [
          { userId: session.user.id },
          ...(validatedData.organizationId ? [{ organizationId: validatedData.organizationId }] : []),
        ],
        isActive: true,
      },
    });

    // Check plan limits
    const planLimits = {
      FREE: 2,
      CREATOR: 5,
      PROFESSIONAL: 15,
      AGENCY: 50,
    };

    const limit = planLimits[user.subscription.plan];
    if (existingVoicesCount >= limit) {
      return NextResponse.json(
        { error: `Brand voice limit reached. Your ${user.subscription.plan} plan allows ${limit} brand voices.` },
        { status: 402 }
      );
    }

    // Generate embeddings for brand voice training
    const trainingText = [
      validatedData.name,
      validatedData.description || '',
      ...validatedData.examples,
      validatedData.toneGuidelines || '',
      validatedData.keywords.join(' '),
    ].join(' ');

    let embeddings;
    try {
      embeddings = await generateEmbedding(trainingText);
    } catch (error) {
      console.error('Embedding generation failed:', error);
      // Continue without embeddings if service is unavailable
      embeddings = null;
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.brandVoice.updateMany({
        where: {
          OR: [
            { userId: session.user.id },
            ...(validatedData.organizationId ? [{ organizationId: validatedData.organizationId }] : []),
          ],
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create brand voice
    const brandVoice = await prisma.brandVoice.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        userId: validatedData.organizationId ? undefined : session.user.id,
        organizationId: validatedData.organizationId,
        examples: validatedData.examples,
        keywords: validatedData.keywords,
        toneGuidelines: validatedData.toneGuidelines,
        isDefault: validatedData.isDefault,
        embeddings: embeddings ? `[${embeddings.join(',')}]` : undefined,
        settings: {
          version: '1.0',
          trainingDate: new Date().toISOString(),
          exampleCount: validatedData.examples.length,
          keywordCount: validatedData.keywords.length,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        type: 'BRAND_VOICE_CREATED',
        description: `Created brand voice: ${validatedData.name}`,
        metadata: {
          brandVoiceId: brandVoice.id,
          type: validatedData.type,
          exampleCount: validatedData.examples.length,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: brandVoice,
    });

  } catch (error) {
    console.error('Create brand voice error:', error);
    
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