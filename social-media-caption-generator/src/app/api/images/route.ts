import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getImagesSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  search: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
  sortBy: z.enum(['createdAt', 'size', 'filename']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
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
    const validatedParams = getImagesSchema.parse(params);

    const page = parseInt(validatedParams.page);
    const limit = Math.min(parseInt(validatedParams.limit), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (validatedParams.search) {
      where.OR = [
        { filename: { contains: validatedParams.search, mode: 'insensitive' } },
        { tags: { hasSome: [validatedParams.search] } },
        { objects: { hasSome: [validatedParams.search] } },
        { text: { contains: validatedParams.search, mode: 'insensitive' } },
      ];
    }

    if (validatedParams.tags) {
      const tagList = validatedParams.tags.split(',').map(tag => tag.trim());
      where.tags = { hasSome: tagList };
    }

    // Build order by
    const orderBy: any = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Get images with usage statistics
    const [images, totalCount] = await Promise.all([
      prisma.image.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              captions: true,
            },
          },
        },
      }),
      prisma.image.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Get usage statistics for each image
    const imagesWithStats = await Promise.all(
      images.map(async (image) => {
        const captionStats = await prisma.caption.aggregate({
          where: { imageId: image.id },
          _avg: {
            qualityScore: true,
            engagementPrediction: true,
          },
          _count: {
            id: true,
          },
        });

        return {
          ...image,
          usage: {
            captionCount: captionStats._count.id,
            averageQualityScore: captionStats._avg.qualityScore,
            averageEngagementPrediction: captionStats._avg.engagementPrediction,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        images: imagesWithStats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get images error:', error);
    
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