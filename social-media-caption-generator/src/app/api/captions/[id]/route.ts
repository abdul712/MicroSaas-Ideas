import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCaptionSchema = z.object({
  content: z.string().optional(),
  isFavorite: z.boolean().optional(),
  isUsed: z.boolean().optional(),
  actualEngagement: z.object({
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    saves: z.number().optional(),
    clicks: z.number().optional(),
    impressions: z.number().optional(),
    engagementRate: z.number().optional(),
  }).optional(),
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

    const caption = await prisma.caption.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        image: {
          select: {
            id: true,
            filename: true,
            originalUrl: true,
            thumbnailUrl: true,
            tags: true,
            objects: true,
            colors: true,
            analysisData: true,
          },
        },
        brandVoice: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        feedback: {
          select: {
            id: true,
            rating: true,
            comment: true,
            helpful: true,
            createdAt: true,
          },
        },
      },
    });

    if (!caption) {
      return NextResponse.json(
        { error: 'Caption not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: caption,
    });

  } catch (error) {
    console.error('Get caption error:', error);
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
    const validatedData = updateCaptionSchema.parse(body);

    // Check if caption exists and belongs to user
    const existingCaption = await prisma.caption.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCaption) {
      return NextResponse.json(
        { error: 'Caption not found' },
        { status: 404 }
      );
    }

    // Update the caption
    const updateData: any = {};
    
    if (validatedData.content !== undefined) {
      updateData.content = validatedData.content;
    }
    
    if (validatedData.isFavorite !== undefined) {
      updateData.isFavorite = validatedData.isFavorite;
    }
    
    if (validatedData.isUsed !== undefined) {
      updateData.isUsed = validatedData.isUsed;
      if (validatedData.isUsed) {
        updateData.usedAt = new Date();
        updateData.shareCount = { increment: 1 };
      }
    }
    
    if (validatedData.actualEngagement) {
      updateData.actualEngagement = validatedData.actualEngagement;
    }

    const updatedCaption = await prisma.caption.update({
      where: { id: params.id },
      data: updateData,
      include: {
        image: {
          select: {
            id: true,
            filename: true,
            thumbnailUrl: true,
            tags: true,
          },
        },
        brandVoice: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Log activity for significant changes
    if (validatedData.isFavorite || validatedData.isUsed || validatedData.actualEngagement) {
      const activityType = validatedData.isFavorite ? 'CAPTION_FAVORITED' : 
                          validatedData.isUsed ? 'CAPTION_USED' :
                          'CAPTION_ANALYTICS_UPDATED';

      await prisma.activity.create({
        data: {
          userId: session.user.id,
          organizationId: existingCaption.organizationId,
          type: activityType as any,
          description: `Updated caption: ${activityType.toLowerCase().replace('_', ' ')}`,
          metadata: {
            captionId: params.id,
            platform: existingCaption.platform,
            changes: validatedData,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedCaption,
    });

  } catch (error) {
    console.error('Update caption error:', error);
    
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

    // Check if caption exists and belongs to user
    const existingCaption = await prisma.caption.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCaption) {
      return NextResponse.json(
        { error: 'Caption not found' },
        { status: 404 }
      );
    }

    // Delete the caption (this will cascade to feedback)
    await prisma.caption.delete({
      where: { id: params.id },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        organizationId: existingCaption.organizationId,
        type: 'CAPTION_DELETED',
        description: `Deleted ${existingCaption.platform} caption`,
        metadata: {
          captionId: params.id,
          platform: existingCaption.platform,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Caption deleted successfully',
    });

  } catch (error) {
    console.error('Delete caption error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}