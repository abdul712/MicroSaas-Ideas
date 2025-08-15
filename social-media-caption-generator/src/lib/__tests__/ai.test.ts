import { generateCaption, estimateGenerationCost } from '@/lib/ai';
import { Platform, AIProvider } from '@prisma/client';
import * as OpenAI from '@/lib/ai/openai';
import * as Anthropic from '@/lib/ai/anthropic';
import * as Google from '@/lib/ai/google';

// Mock the AI modules
jest.mock('@/lib/ai/openai');
jest.mock('@/lib/ai/anthropic');
jest.mock('@/lib/ai/google');

describe('AI Integration', () => {
  const mockOpenAIResponse = {
    content: 'Generated Instagram caption with #hashtags ✨',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    cost: 0.15,
    model: 'gpt-4o-mini',
    finishReason: 'stop',
  };

  const mockAnthropicResponse = {
    content: 'Generated Instagram caption with #hashtags ✨',
    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    cost: 0.08,
    model: 'claude-3-haiku-20240307',
    stopReason: 'end_turn',
  };

  const mockGoogleResponse = {
    content: 'Generated Instagram caption with #hashtags ✨',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    cost: 0.05,
    model: 'gemini-1.5-flash',
    finishReason: 'STOP',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCaption', () => {
    it('should generate caption with OpenAI provider', async () => {
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue(mockOpenAIResponse);

      const request = {
        prompt: 'Create a caption about a product launch',
        platform: Platform.INSTAGRAM_FEED,
        preferences: {
          aiProvider: AIProvider.OPENAI,
        },
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(result.caption).toBe('Generated Instagram caption with #hashtags ✨');
      expect(result.metadata.aiProvider).toBe(AIProvider.OPENAI);
      expect(result.metadata.cost).toBe(0.15);
      expect(OpenAI.generateCaption).toHaveBeenCalledWith({
        prompt: request.prompt,
        platform: request.platform,
        brandVoice: undefined,
        imageAnalysis: undefined,
        maxTokens: 300,
        temperature: 0.7,
        model: 'gpt-4o-mini',
      });
    });

    it('should generate caption with Anthropic provider', async () => {
      (Anthropic.generateCaption as jest.Mock).mockResolvedValue(mockAnthropicResponse);

      const request = {
        prompt: 'Create a caption about a product launch',
        platform: Platform.INSTAGRAM_FEED,
        preferences: {
          aiProvider: AIProvider.ANTHROPIC,
        },
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(result.metadata.aiProvider).toBe(AIProvider.ANTHROPIC);
      expect(result.metadata.cost).toBe(0.08);
    });

    it('should generate caption with Google provider', async () => {
      (Google.generateCaption as jest.Mock).mockResolvedValue(mockGoogleResponse);

      const request = {
        prompt: 'Create a caption about a product launch',
        platform: Platform.INSTAGRAM_FEED,
        preferences: {
          aiProvider: AIProvider.GOOGLE,
        },
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(result.metadata.aiProvider).toBe(AIProvider.GOOGLE);
      expect(result.metadata.cost).toBe(0.05);
    });

    it('should use fallback provider when primary fails', async () => {
      (Google.generateCaption as jest.Mock).mockRejectedValue(new Error('Google API error'));
      (Anthropic.generateCaption as jest.Mock).mockResolvedValue(mockAnthropicResponse);

      const request = {
        prompt: 'Create a caption about a product launch',
        platform: Platform.INSTAGRAM_FEED,
        preferences: {
          aiProvider: AIProvider.GOOGLE,
          enableFallback: true,
        },
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(result.metadata.fallbackUsed).toBe(true);
      expect(result.metadata.aiProvider).toBe(AIProvider.ANTHROPIC);
    });

    it('should include brand voice in generation', async () => {
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue(mockOpenAIResponse);

      const brandVoice = {
        name: 'Professional Voice',
        type: 'PROFESSIONAL',
        examples: ['Example 1', 'Example 2'],
        keywords: ['professional', 'expert'],
        toneGuidelines: 'Maintain professional tone',
      };

      const request = {
        prompt: 'Create a caption about a product launch',
        platform: Platform.INSTAGRAM_FEED,
        brandVoice,
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(OpenAI.generateCaption).toHaveBeenCalledWith(
        expect.objectContaining({
          brandVoice: expect.stringContaining('Professional Voice'),
        })
      );
    });

    it('should include image analysis in generation', async () => {
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue(mockOpenAIResponse);

      const imageAnalysis = {
        objects: ['laptop', 'desk'],
        scene: 'office',
        colors: ['#ffffff', '#000000'],
        text: 'Innovation',
        faces: 0,
        mood: 'professional',
      };

      const request = {
        prompt: 'Create a caption about this image',
        platform: Platform.INSTAGRAM_FEED,
        imageAnalysis,
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(OpenAI.generateCaption).toHaveBeenCalledWith(
        expect.objectContaining({
          imageAnalysis,
        })
      );
    });

    it('should handle generation errors gracefully', async () => {
      (Google.generateCaption as jest.Mock).mockRejectedValue(new Error('API error'));

      const request = {
        prompt: 'Create a caption',
        platform: Platform.INSTAGRAM_FEED,
        preferences: {
          aiProvider: AIProvider.GOOGLE,
          enableFallback: false,
        },
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API error');
      expect(result.metadata.fallbackUsed).toBe(false);
    });

    it('should calculate quality scores correctly', async () => {
      const captionWithHashtags = 'Great post with #trending #hashtags! What do you think? 🤔';
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue({
        ...mockOpenAIResponse,
        content: captionWithHashtags,
      });

      const request = {
        prompt: 'Create engaging caption',
        platform: Platform.INSTAGRAM_FEED,
      };

      const result = await generateCaption(request);

      expect(result.success).toBe(true);
      expect(result.metadata.qualityScore).toBeGreaterThan(0.7);
      expect(result.hashtags?.length).toBeGreaterThan(0);
      expect(result.emojis?.length).toBeGreaterThan(0);
    });
  });

  describe('estimateGenerationCost', () => {
    it('should estimate cost for simple request', () => {
      const request = {
        prompt: 'Simple caption',
        platform: Platform.TWITTER_POST,
      };

      const cost = estimateGenerationCost(request);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1);
    });

    it('should estimate higher cost for complex request', () => {
      const simpleCost = estimateGenerationCost({
        prompt: 'Simple caption',
        platform: Platform.TWITTER_POST,
      });

      const complexCost = estimateGenerationCost({
        prompt: 'Complex caption with brand voice',
        platform: Platform.INSTAGRAM_REELS,
        brandVoice: {
          name: 'Brand Voice',
          type: 'PROFESSIONAL',
          examples: ['Example'],
          keywords: ['keyword'],
        },
        imageAnalysis: {
          objects: ['object'],
          colors: ['#ffffff'],
        },
        preferences: {
          temperature: 0.9,
          maxTokens: 500,
        },
      });

      expect(complexCost).toBeGreaterThan(simpleCost);
    });

    it('should account for different AI providers', () => {
      const request = {
        prompt: 'Test caption',
        platform: Platform.INSTAGRAM_FEED,
      };

      const googleCost = estimateGenerationCost({
        ...request,
        preferences: { aiProvider: AIProvider.GOOGLE },
      });

      const openaiCost = estimateGenerationCost({
        ...request,
        preferences: { aiProvider: AIProvider.OPENAI },
      });

      expect(openaiCost).toBeGreaterThan(googleCost);
    });
  });

  describe('Caption Processing', () => {
    it('should extract hashtags correctly', async () => {
      const contentWithHashtags = 'Amazing post! #photography #nature #beautiful #sunset';
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue({
        ...mockOpenAIResponse,
        content: contentWithHashtags,
      });

      const result = await generateCaption({
        prompt: 'Test',
        platform: Platform.INSTAGRAM_FEED,
      });

      expect(result.hashtags).toEqual(['photography', 'nature', 'beautiful', 'sunset']);
    });

    it('should extract emojis correctly', async () => {
      const contentWithEmojis = 'Beautiful sunset 🌅 perfect day! ✨ Love it! ❤️';
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue({
        ...mockOpenAIResponse,
        content: contentWithEmojis,
      });

      const result = await generateCaption({
        prompt: 'Test',
        platform: Platform.INSTAGRAM_FEED,
      });

      expect(result.emojis).toEqual(['🌅', '✨', '❤️']);
    });

    it('should handle duplicate hashtags and emojis', async () => {
      const contentWithDuplicates = 'Test #test #test 🌅 🌅 #unique ✨';
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue({
        ...mockOpenAIResponse,
        content: contentWithDuplicates,
      });

      const result = await generateCaption({
        prompt: 'Test',
        platform: Platform.INSTAGRAM_FEED,
      });

      expect(result.hashtags).toEqual(['test', 'unique']);
      expect(result.emojis).toEqual(['🌅', '✨']);
    });
  });

  describe('Platform Optimization', () => {
    it('should optimize for Twitter character limits', async () => {
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue(mockOpenAIResponse);

      const result = await generateCaption({
        prompt: 'Test',
        platform: Platform.TWITTER_POST,
      });

      expect(result.success).toBe(true);
      expect(OpenAI.generateCaption).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: Platform.TWITTER_POST,
        })
      );
    });

    it('should optimize for LinkedIn professional tone', async () => {
      (OpenAI.generateCaption as jest.Mock).mockResolvedValue(mockOpenAIResponse);

      const result = await generateCaption({
        prompt: 'Test',
        platform: Platform.LINKEDIN_POST,
      });

      expect(result.success).toBe(true);
      expect(OpenAI.generateCaption).toHaveBeenCalledWith(
        expect.objectContaining({
          platform: Platform.LINKEDIN_POST,
        })
      );
    });
  });
});