import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/ai/openai';
import { BrandVoiceType } from '@prisma/client';
import { z } from 'zod';

const updateBrandVoiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.nativeEnum(BrandVoiceType).optional(),
  examples: z.array(z.string().min(10)).min(3).max(20).optional(),
  keywords: z.array(z.string().min(1)).min(3).max(50).optional(),
  toneGuidelines: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const brandVoice = await prisma.brandVoice.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          {
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                },
              },
            },
          },
        ],
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
        captions: {
          select: {
            id: true,
            platform: true,
            qualityScore: true,
            brandVoiceMatch: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            captions: true,
          },
        },
      },
    });

    if (!brandVoice) {
      return NextResponse.json(
        { error: 'Brand voice not found' },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const captionStats = await prisma.caption.aggregate({
      where: {
        brandVoiceId: params.id,
      },
      _avg: {
        qualityScore: true,
        brandVoiceMatch: true,
      },
      _count: {
        id: true,
      },
    });

    const platformUsage = await prisma.caption.groupBy({
      by: ['platform'],
      where: {
        brandVoiceId: params.id,
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...brandVoice,
        statistics: {
          totalCaptions: captionStats._count.id,
          averageQualityScore: captionStats._avg.qualityScore,
          averageBrandVoiceMatch: captionStats._avg.brandVoiceMatch,
          platformUsage: platformUsage.reduce((acc, item) => {
            acc[item.platform] = item._count.id;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });

  } catch (error) {
    console.error('Get brand voice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateBrandVoiceSchema.parse(body);

    // Check if brand voice exists and user has permission
    const existingBrandVoice = await prisma.brandVoice.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          {
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['owner', 'admin', 'member'] },
                },
              },
            },
          },
        ],
      },
    });

    if (!existingBrandVoice) {
      return NextResponse.json(
        { error: 'Brand voice not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.examples !== undefined) updateData.examples = validatedData.examples;
    if (validatedData.keywords !== undefined) updateData.keywords = validatedData.keywords;
    if (validatedData.toneGuidelines !== undefined) updateData.toneGuidelines = validatedData.toneGuidelines;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    // Handle default setting
    if (validatedData.isDefault === true) {
      // Unset other defaults for this user/organization
      await prisma.brandVoice.updateMany({
        where: {
          OR: [
            { userId: existingBrandVoice.userId },
            ...(existingBrandVoice.organizationId ? [{ organizationId: existingBrandVoice.organizationId }] : []),
          ],
          isDefault: true,
        },
        data: { isDefault: false },
      });
      updateData.isDefault = true;
    } else if (validatedData.isDefault === false) {
      updateData.isDefault = false;
    }

    // Regenerate embeddings if content changed
    if (validatedData.examples || validatedData.keywords || validatedData.name) {
      const updatedExamples = validatedData.examples || existingBrandVoice.examples;
      const updatedKeywords = validatedData.keywords || existingBrandVoice.keywords;
      const updatedName = validatedData.name || existingBrandVoice.name;

      const trainingText = [
        updatedName,
        validatedData.description || existingBrandVoice.description || '',
        ...updatedExamples,
        validatedData.toneGuidelines || existingBrandVoice.toneGuidelines || '',
        updatedKeywords.join(' '),
      ].join(' ');

      try {
        const embeddings = await generateEmbedding(trainingText);
        updateData.embeddings = `[${embeddings.join(',')}]`;
      } catch (error) {
        console.error('Embedding generation failed:', error);
        // Continue without updating embeddings
      }

      updateData.settings = {
        ...existingBrandVoice.settings,
        lastUpdated: new Date().toISOString(),
        version: '1.1',
      };
    }

    // Update last used timestamp
    updateData.lastUsedAt = new Date();

    // Update the brand voice
    const updatedBrandVoice = await prisma.brandVoice.update({
      where: { id: params.id },
      data: updateData,
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

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        organizationId: existingBrandVoice.organizationId,
        type: 'BRAND_VOICE_UPDATED',
        description: `Updated brand voice: ${updatedBrandVoice.name}`,
        metadata: {
          brandVoiceId: params.id,
          changes: Object.keys(updateData),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBrandVoice,
    });

  } catch (error) {
    console.error('Update brand voice error:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if brand voice exists and user has permission
    const existingBrandVoice = await prisma.brandVoice.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: session.user.id },
          {
            organization: {
              members: {
                some: {
                  userId: session.user.id,
                  role: { in: ['owner', 'admin'] }, // Only owners and admins can delete
                },
              },
            },
          },
        ],
      },
    });

    if (!existingBrandVoice) {
      return NextResponse.json(
        { error: 'Brand voice not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Check if brand voice is being used
    const captionCount = await prisma.caption.count({
      where: { brandVoiceId: params.id },
    });

    if (captionCount > 0) {
      // Soft delete - mark as inactive instead of hard delete
      await prisma.brandVoice.update({
        where: { id: params.id },
        data: { 
          isActive: false,
          name: `${existingBrandVoice.name} (Deleted)`,
        },
      });
    } else {
      // Hard delete if no captions are using it
      await prisma.brandVoice.delete({
        where: { id: params.id },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        organizationId: existingBrandVoice.organizationId,
        type: 'BRAND_VOICE_DELETED',
        description: `Deleted brand voice: ${existingBrandVoice.name}`,
        metadata: {
          brandVoiceId: params.id,
          hadCaptions: captionCount > 0,
          softDelete: captionCount > 0,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: captionCount > 0 
        ? 'Brand voice deactivated (was being used by existing captions)'
        : 'Brand voice deleted successfully',
    });

  } catch (error) {
    console.error('Delete brand voice error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}