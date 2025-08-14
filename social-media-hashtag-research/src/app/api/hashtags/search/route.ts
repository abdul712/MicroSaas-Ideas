import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Platform } from '@prisma/client';

const searchSchema = z.object({
  query: z.string().min(1).max(100),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  limit: z.number().min(1).max(100).default(20),
  includeRelated: z.boolean().default(true),
  sortBy: z.enum(['relevance', 'posts', 'engagement', 'difficulty']).default('relevance'),
  difficultyRange: z.array(z.number().min(0).max(1)).length(2).optional(),
});

interface HashtagResult {
  id: string;
  tag: string;
  totalPosts: bigint;
  avgEngagement: number;
  difficultyScore: number;
  trendScore: number;
  platforms: {
    [key in Platform]?: {
      posts: number;
      engagement: number;
      growth: number;
    };
  };
  relatedHashtags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limits and usage
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        searchesUsed: true,
        planType: true,
        lastResetDate: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Define usage limits based on plan
    const usageLimits = {
      FREE: 10,
      STARTER: 100,
      PROFESSIONAL: -1, // unlimited
      BUSINESS: -1,
      ENTERPRISE: -1,
      TEAM: -1,
    };

    const limit = usageLimits[user.planType];
    if (limit !== -1 && user.searchesUsed >= limit) {
      return NextResponse.json({ 
        error: 'Usage limit exceeded. Please upgrade your plan.',
        code: 'USAGE_LIMIT_EXCEEDED'
      }, { status: 429 });
    }

    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    // Create search record
    const search = await prisma.hashtagSearch.create({
      data: {
        userId: session.user.id,
        searchTerm: validatedData.query,
        platforms: validatedData.platforms || [Platform.INSTAGRAM],
        filters: {
          limit: validatedData.limit,
          includeRelated: validatedData.includeRelated,
          sortBy: validatedData.sortBy,
          difficultyRange: validatedData.difficultyRange,
        },
      },
    });

    // For MVP, we'll simulate hashtag search results
    // In production, this would query real social media APIs
    const mockResults: HashtagResult[] = generateMockHashtagResults(
      validatedData.query,
      validatedData.limit
    );

    // Store search results
    for (let i = 0; i < mockResults.length; i++) {
      const result = mockResults[i];
      
      // Create or update hashtag
      const hashtag = await prisma.hashtag.upsert({
        where: { normalizedTag: result.tag.toLowerCase().replace('#', '') },
        update: {
          totalPosts: result.totalPosts,
          avgEngagement: result.avgEngagement,
          difficultyScore: result.difficultyScore,
          trendScore: result.trendScore,
          lastUpdated: new Date(),
        },
        create: {
          tag: result.tag,
          normalizedTag: result.tag.toLowerCase().replace('#', ''),
          totalPosts: result.totalPosts,
          avgEngagement: result.avgEngagement,
          difficultyScore: result.difficultyScore,
          trendScore: result.trendScore,
          category: inferCategory(result.tag),
        },
      });

      // Store search result
      await prisma.hashtagSearchResult.create({
        data: {
          searchId: search.id,
          hashtagId: hashtag.id,
          platform: Platform.INSTAGRAM, // Default platform
          position: i + 1,
          score: calculateRelevanceScore(result, validatedData.query),
          reason: generateRecommendationReason(result, validatedData.query),
        },
      });
    }

    // Update user search count
    await prisma.user.update({
      where: { id: session.user.id },
      data: { searchesUsed: { increment: 1 } },
    });

    // Track usage
    await prisma.usageHistory.create({
      data: {
        userId: session.user.id,
        action: 'SEARCH_HASHTAG',
        resource: validatedData.query,
        metadata: {
          platforms: validatedData.platforms,
          resultsCount: mockResults.length,
        },
      },
    });

    return NextResponse.json({
      searchId: search.id,
      results: mockResults.map(result => ({
        ...result,
        totalPosts: result.totalPosts.toString(), // Convert BigInt to string for JSON
      })),
      totalResults: mockResults.length,
      searchTerm: validatedData.query,
      platforms: validatedData.platforms || [Platform.INSTAGRAM],
    });

  } catch (error) {
    console.error('Hashtag search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

function generateMockHashtagResults(query: string, limit: number): HashtagResult[] {
  const baseHashtags = [
    `#${query}`,
    `#${query}life`,
    `#${query}love`,
    `#${query}daily`,
    `#${query}tips`,
    `#${query}inspiration`,
    `#${query}community`,
    `#${query}goals`,
    `#${query}motivation`,
    `#${query}journey`,
  ];

  const results: HashtagResult[] = [];

  for (let i = 0; i < Math.min(limit, baseHashtags.length); i++) {
    const tag = baseHashtags[i];
    const posts = BigInt(Math.floor(Math.random() * 5000000) + 10000);
    const engagement = Math.random() * 8 + 1; // 1-9%
    const difficulty = Math.random();
    const trend = Math.random();

    results.push({
      id: `hashtag-${i}`,
      tag,
      totalPosts: posts,
      avgEngagement: engagement,
      difficultyScore: difficulty,
      trendScore: trend,
      platforms: {
        [Platform.INSTAGRAM]: {
          posts: Number(posts) * 0.6,
          engagement: engagement * 1.1,
          growth: (Math.random() - 0.5) * 20, // -10% to +10%
        },
        [Platform.TWITTER]: {
          posts: Number(posts) * 0.3,
          engagement: engagement * 0.8,
          growth: (Math.random() - 0.5) * 15,
        },
        [Platform.TIKTOK]: {
          posts: Number(posts) * 0.1,
          engagement: engagement * 1.5,
          growth: (Math.random() - 0.5) * 30,
        },
      },
      relatedHashtags: generateRelatedHashtags(tag, 5),
    });
  }

  return results;
}

function generateRelatedHashtags(baseTag: string, count: number): string[] {
  const related = [];
  const base = baseTag.replace('#', '');
  
  const suffixes = ['tips', 'life', 'love', 'daily', 'goals', 'inspiration', 'community', 'style', 'art', 'vibes'];
  const prefixes = ['daily', 'my', 'love', 'best', 'top', 'amazing', 'beautiful', 'perfect'];
  
  for (let i = 0; i < count; i++) {
    if (i % 2 === 0) {
      related.push(`#${base}${suffixes[i % suffixes.length]}`);
    } else {
      related.push(`#${prefixes[i % prefixes.length]}${base}`);
    }
  }
  
  return related;
}

function calculateRelevanceScore(hashtag: HashtagResult, query: string): number {
  const baseScore = 0.5;
  const queryLower = query.toLowerCase();
  const tagLower = hashtag.tag.toLowerCase();
  
  // Exact match bonus
  if (tagLower.includes(queryLower)) {
    return Math.min(1.0, baseScore + 0.4 + hashtag.trendScore * 0.1);
  }
  
  return Math.min(1.0, baseScore + hashtag.trendScore * 0.2 + Math.random() * 0.3);
}

function generateRecommendationReason(hashtag: HashtagResult, query: string): string {
  const reasons = [
    'High engagement rate',
    'Growing trend',
    'Perfect difficulty level',
    'Popular in your niche',
    'Competitive advantage',
    'Broad reach potential',
  ];
  
  return reasons[Math.floor(Math.random() * reasons.length)];
}

function inferCategory(hashtag: string): string {
  const tag = hashtag.toLowerCase();
  
  if (tag.includes('fitness') || tag.includes('health') || tag.includes('workout')) return 'Health & Fitness';
  if (tag.includes('food') || tag.includes('recipe') || tag.includes('cooking')) return 'Food & Cooking';
  if (tag.includes('travel') || tag.includes('adventure')) return 'Travel';
  if (tag.includes('business') || tag.includes('entrepreneur')) return 'Business';
  if (tag.includes('fashion') || tag.includes('style')) return 'Fashion';
  if (tag.includes('photo') || tag.includes('art')) return 'Photography & Art';
  if (tag.includes('tech') || tag.includes('digital')) return 'Technology';
  
  return 'General';
}