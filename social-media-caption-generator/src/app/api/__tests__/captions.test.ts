import { POST } from '@/app/api/captions/generate/route';
import { GET } from '@/app/api/captions/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateCaption } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@/lib/ai');
jest.mock('@/lib/prisma');

const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
  },
};

const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  subscription: {
    id: 'sub-123',
    plan: 'CREATOR',
    credits: 100,
    maxCredits: 200,
  },
  organizationMemberships: [],
};

const mockGenerationResult = {
  success: true,
  caption: 'Generated caption with #hashtags ✨',
  hashtags: ['hashtags'],
  emojis: ['✨'],
  metadata: {
    aiProvider: 'OPENAI',
    model: 'gpt-4o-mini',
    cost: 0.15,
    generationTime: 1500,
    qualityScore: 0.85,
    brandVoiceMatch: 0.90,
    fallbackUsed: false,
  },
};

describe('/api/captions/generate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('POST /api/captions/generate', () => {
    it('should generate caption successfully', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateCaption as jest.Mock).mockResolvedValue(mockGenerationResult);
      (prisma.caption.create as jest.Mock).mockResolvedValue({
        id: 'caption-123',
        ...mockGenerationResult,
      });
      (prisma.caption.update as jest.Mock).mockResolvedValue({
        id: 'caption-123',
        content: mockGenerationResult.caption,
        hashtags: mockGenerationResult.hashtags,
        emojis: mockGenerationResult.emojis,
        platform: 'INSTAGRAM_FEED',
        qualityScore: mockGenerationResult.metadata.qualityScore,
        brandVoiceMatch: mockGenerationResult.metadata.brandVoiceMatch,
        aiProvider: mockGenerationResult.metadata.aiProvider,
        modelUsed: mockGenerationResult.metadata.model,
        generationTime: mockGenerationResult.metadata.generationTime,
        cost: mockGenerationResult.metadata.cost,
        generationStatus: 'COMPLETED',
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});
      (prisma.usageRecord.create as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.activity.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Create a caption about a product launch',
          platform: 'INSTAGRAM_FEED',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.caption.content).toBe(mockGenerationResult.caption);
      expect(data.caption.hashtags).toEqual(mockGenerationResult.hashtags);
      expect(data.caption.emojis).toEqual(mockGenerationResult.emojis);
    });

    it('should reject request without authentication', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          platform: 'INSTAGRAM_FEED',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject request with insufficient credits', async () => {
      const userWithNoCredits = {
        ...mockUser,
        subscription: {
          ...mockUser.subscription,
          credits: 0,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(userWithNoCredits);

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          platform: 'INSTAGRAM_FEED',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(402);
      expect(data.error).toBe('Insufficient credits');
    });

    it('should validate request body', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Short', // Too short
          platform: 'INVALID_PLATFORM',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should handle AI generation failure', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateCaption as jest.Mock).mockResolvedValue({
        success: false,
        error: 'AI service unavailable',
        metadata: {
          aiProvider: 'OPENAI',
          model: 'gpt-4o-mini',
          cost: 0,
          generationTime: 1000,
          fallbackUsed: false,
        },
      });
      (prisma.caption.create as jest.Mock).mockResolvedValue({ id: 'caption-123' });
      (prisma.caption.update as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          platform: 'INSTAGRAM_FEED',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('AI service unavailable');
    });

    it('should include brand voice in generation', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.brandVoice.findFirst as jest.Mock).mockResolvedValue({
        id: 'brand-voice-123',
        name: 'Professional Voice',
        type: 'PROFESSIONAL',
        examples: ['Example 1', 'Example 2'],
        keywords: ['professional', 'expert'],
        toneGuidelines: 'Maintain professional tone',
      });
      (generateCaption as jest.Mock).mockResolvedValue(mockGenerationResult);
      (prisma.caption.create as jest.Mock).mockResolvedValue({ id: 'caption-123' });
      (prisma.caption.update as jest.Mock).mockResolvedValue({
        id: 'caption-123',
        ...mockGenerationResult,
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});
      (prisma.usageRecord.create as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.activity.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          platform: 'INSTAGRAM_FEED',
          brandVoiceId: 'brand-voice-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generateCaption).toHaveBeenCalledWith(
        expect.objectContaining({
          brandVoice: expect.objectContaining({
            name: 'Professional Voice',
            type: 'PROFESSIONAL',
          }),
        })
      );
    });

    it('should include image analysis in generation', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.image.findFirst as jest.Mock).mockResolvedValue({
        id: 'image-123',
        objects: ['laptop', 'desk'],
        colors: ['#ffffff', '#000000'],
        text: 'Innovation',
        faces: 0,
        analysisData: {
          scene: 'office',
          mood: 'professional',
        },
      });
      (generateCaption as jest.Mock).mockResolvedValue(mockGenerationResult);
      (prisma.caption.create as jest.Mock).mockResolvedValue({ id: 'caption-123' });
      (prisma.caption.update as jest.Mock).mockResolvedValue({
        id: 'caption-123',
        ...mockGenerationResult,
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});
      (prisma.usageRecord.create as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.activity.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          platform: 'INSTAGRAM_FEED',
          imageId: 'image-123',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(generateCaption).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAnalysis: expect.objectContaining({
            objects: ['laptop', 'desk'],
            scene: 'office',
            mood: 'professional',
          }),
        })
      );
    });

    it('should deduct credits correctly', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (generateCaption as jest.Mock).mockResolvedValue(mockGenerationResult);
      (prisma.caption.create as jest.Mock).mockResolvedValue({ id: 'caption-123' });
      (prisma.caption.update as jest.Mock).mockResolvedValue({
        id: 'caption-123',
        ...mockGenerationResult,
      });
      (prisma.subscription.update as jest.Mock).mockResolvedValue({});
      (prisma.usageRecord.create as jest.Mock).mockResolvedValue({});
      (prisma.userAnalytics.upsert as jest.Mock).mockResolvedValue({});
      (prisma.activity.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/captions/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: 'Test prompt',
          platform: 'INSTAGRAM_FEED',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      
      // Credits should be deducted based on cost (1 credit = $0.10)
      const expectedCreditsUsed = Math.ceil(mockGenerationResult.metadata.cost * 10);
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: mockUser.subscription.id },
        data: { credits: { decrement: expectedCreditsUsed } },
      });

      expect(data.remainingCredits).toBe(mockUser.subscription.credits - expectedCreditsUsed);
    });
  });
});

describe('/api/captions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/captions', () => {
    const mockCaptions = [
      {
        id: 'caption-1',
        userId: 'test-user-id',
        content: 'Caption 1',
        platform: 'INSTAGRAM_FEED',
        hashtags: ['test'],
        emojis: ['✨'],
        qualityScore: 0.85,
        createdAt: new Date(),
        image: null,
        brandVoice: null,
        project: null,
        organization: null,
        feedback: [],
      },
      {
        id: 'caption-2',
        userId: 'test-user-id',
        content: 'Caption 2',
        platform: 'TWITTER_POST',
        hashtags: ['social'],
        emojis: ['🚀'],
        qualityScore: 0.92,
        createdAt: new Date(),
        image: null,
        brandVoice: null,
        project: null,
        organization: null,
        feedback: [],
      },
    ];

    it('should get captions successfully', async () => {
      (prisma.caption.findMany as jest.Mock).mockResolvedValue(mockCaptions);
      (prisma.caption.count as jest.Mock).mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/captions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.captions).toHaveLength(2);
      expect(data.data.pagination.totalCount).toBe(2);
    });

    it('should filter captions by platform', async () => {
      const instagramCaptions = mockCaptions.filter(c => c.platform === 'INSTAGRAM_FEED');
      (prisma.caption.findMany as jest.Mock).mockResolvedValue(instagramCaptions);
      (prisma.caption.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/captions?platform=INSTAGRAM_FEED');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.captions).toHaveLength(1);
      expect(data.data.captions[0].platform).toBe('INSTAGRAM_FEED');
    });

    it('should search captions by content', async () => {
      const filteredCaptions = mockCaptions.filter(c => c.content.includes('Caption 1'));
      (prisma.caption.findMany as jest.Mock).mockResolvedValue(filteredCaptions);
      (prisma.caption.count as jest.Mock).mockResolvedValue(1);

      const request = new NextRequest('http://localhost:3000/api/captions?search=Caption%201');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.captions).toHaveLength(1);
      expect(prisma.caption.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { content: { contains: 'Caption 1', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should paginate results correctly', async () => {
      (prisma.caption.findMany as jest.Mock).mockResolvedValue([mockCaptions[0]]);
      (prisma.caption.count as jest.Mock).mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/captions?page=1&limit=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.captions).toHaveLength(1);
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(1);
      expect(data.data.pagination.totalPages).toBe(2);
      expect(data.data.pagination.hasNext).toBe(true);
      expect(data.data.pagination.hasPrev).toBe(false);
    });

    it('should sort captions correctly', async () => {
      (prisma.caption.findMany as jest.Mock).mockResolvedValue(mockCaptions);
      (prisma.caption.count as jest.Mock).mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/captions?sortBy=qualityScore&sortOrder=desc');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.caption.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { qualityScore: 'desc' },
        })
      );
    });

    it('should reject request without authentication', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/captions');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should validate query parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/captions?limit=150'); // Over limit
      const response = await GET(request);

      expect(response.status).toBe(200); // Should still work but limit to 100
      expect(prisma.caption.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at 100
        })
      );
    });
  });
});