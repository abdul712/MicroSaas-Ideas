import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const getCaptionsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  platform: z.string().optional(),
  organizationId: z.string().optional(),
  projectId: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'qualityScore', 'brandVoiceMatch']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  favorite: z.string().optional(),
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
    const validatedParams = getCaptionsSchema.parse(params);

    const page = parseInt(validatedParams.page);
    const limit = Math.min(parseInt(validatedParams.limit), 100); // Max 100 per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    if (validatedParams.platform) {
      where.platform = validatedParams.platform;
    }

    if (validatedParams.organizationId) {
      where.organizationId = validatedParams.organizationId;
    }

    if (validatedParams.projectId) {
      where.projectId = validatedParams.projectId;
    }

    if (validatedParams.search) {
      where.OR = [
        { content: { contains: validatedParams.search, mode: 'insensitive' } },
        { originalPrompt: { contains: validatedParams.search, mode: 'insensitive' } },
        { hashtags: { hasSome: [validatedParams.search] } },
      ];
    }

    if (validatedParams.favorite === 'true') {
      where.isFavorite = true;
    }

    // Build order by
    const orderBy: any = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Get captions with related data
    const [captions, totalCount] = await Promise.all([
      prisma.caption.findMany({
        where,
        orderBy,
        skip,
        take: limit,
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
          project: {
            select: {
              id: true,
              name: true,
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
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.caption.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        captions,
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
    console.error('Get captions error:', error);
    
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