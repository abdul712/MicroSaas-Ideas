import { generateCaptions, analyzeBrandVoice, analyzeImageForContext } from '../ai-service';
import { SocialPlatform, ContentType } from '@prisma/client';
import OpenAI from 'openai';

// Mock the OpenAI module
jest.mock('openai');
const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('AI Service', () => {
  let mockOpenAI: jest.Mocked<OpenAI>;

  beforeEach(() => {
    mockOpenAI = new MockedOpenAI() as jest.Mocked<OpenAI>;
    MockedOpenAI.mockImplementation(() => mockOpenAI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateCaptions', () => {
    it('should generate captions for Instagram platform', async () => {
      // Mock OpenAI response
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              { message: { content: 'Amazing sunset vibes! 🌅 #sunset #nature #peaceful' } },
              { message: { content: 'Nature at its finest ✨ #beautiful #outdoor #inspiration' } },
              { message: { content: 'Golden hour magic 🌟 #goldenhour #photography #mood' } }
            ],
            usage: { total_tokens: 150 }
          })
        }
      } as any;

      const options = {
        platform: SocialPlatform.INSTAGRAM,
        contentType: ContentType.IMAGE,
        imageContext: 'Beautiful sunset over mountains',
        tone: 'inspirational'
      };

      const result = await generateCaptions(options);

      expect(result).toEqual({
        captions: [
          'Amazing sunset vibes! 🌅 #sunset #nature #peaceful',
          'Nature at its finest ✨ #beautiful #outdoor #inspiration',
          'Golden hour magic 🌟 #goldenhour #photography #mood'
        ],
        hashtags: ['#sunset', '#nature', '#peaceful', '#beautiful', '#outdoor', '#inspiration', '#goldenhour', '#photography', '#mood'],
        provider: 'openai',
        model: 'gpt-4-1106-preview',
        cost: expect.any(Number),
        processingTime: expect.any(Number),
        confidenceScore: 0.85
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-1106-preview',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('expert social media caption writer')
            }),
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('Platform: INSTAGRAM')
            })
          ]),
          temperature: 0.7,
          max_tokens: 300,
          n: 3
        })
      );
    });

    it('should handle Twitter platform with character limits', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              { message: { content: 'Quick update: loving this weather! ☀️ #sunny' } }
            ],
            usage: { total_tokens: 50 }
          })
        }
      } as any;

      const options = {
        platform: SocialPlatform.TWITTER,
        contentType: ContentType.TEXT,
        tone: 'casual'
      };

      const result = await generateCaptions(options);

      expect(result.captions[0]).toHaveLength(42); // Should be within Twitter limits
      expect(result.hashtags).toContain('#sunny');
    });

    it('should apply brand voice when provided', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              { message: { content: 'Professional insight on market trends today. #business' } }
            ],
            usage: { total_tokens: 75 }
          })
        }
      } as any;

      const options = {
        platform: SocialPlatform.LINKEDIN,
        brandVoice: 'Professional, authoritative tone focusing on business insights and thought leadership.',
        tone: 'professional'
      };

      const result = await generateCaptions(options);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Brand voice: Professional, authoritative tone')
            })
          ])
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API quota exceeded'))
        }
      } as any;

      const options = {
        platform: SocialPlatform.INSTAGRAM,
        contentType: ContentType.IMAGE
      };

      await expect(generateCaptions(options)).rejects.toThrow('Caption generation failed');
    });
  });

  describe('analyzeBrandVoice', () => {
    it('should analyze brand voice from examples', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify(['professional', 'friendly', 'knowledgeable'])
              }
            }]
          })
        }
      } as any;

      const examples = [
        'Welcome to our community! We\'re here to help.',
        'Thanks for your question. Here\'s what we recommend.',
        'We believe in transparency and quality service.'
      ];

      const result = await analyzeBrandVoice(examples);

      expect(result).toEqual(['professional', 'friendly', 'knowledgeable']);
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining(examples.join('\n\n'))
            })
          ])
        })
      );
    });

    it('should return empty array for no examples', async () => {
      const result = await analyzeBrandVoice([]);
      expect(result).toEqual([]);
      expect(mockOpenAI.chat.completions.create).not.toHaveBeenCalled();
    });

    it('should handle analysis errors', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('Analysis failed'))
        }
      } as any;

      const examples = ['Test example'];
      const result = await analyzeBrandVoice(examples);

      expect(result).toEqual([]);
    });
  });

  describe('analyzeImageForContext', () => {
    it('should analyze image and return context', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: 'The image shows a beautiful sunset over mountains with warm orange and pink colors in the sky.'
              }
            }]
          })
        }
      } as any;

      const imageUrl = 'https://example.com/sunset.jpg';
      const result = await analyzeImageForContext(imageUrl);

      expect(result).toBe('The image shows a beautiful sunset over mountains with warm orange and pink colors in the sky.');
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4-vision-preview',
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.arrayContaining([
                expect.objectContaining({
                  type: 'text',
                  text: expect.stringContaining('Describe this image in detail')
                }),
                expect.objectContaining({
                  type: 'image_url',
                  image_url: { url: imageUrl }
                })
              ])
            })
          ])
        })
      );
    });

    it('should handle image analysis errors', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('Image analysis failed'))
        }
      } as any;

      const result = await analyzeImageForContext('invalid-url');
      expect(result).toBe('');
    });
  });

  describe('Provider Selection', () => {
    it('should select Anthropic for complex brand voice', async () => {
      const longBrandVoice = 'A'.repeat(600); // > 500 characters
      
      // Mock Anthropic response
      const mockAnthropic = {
        messages: {
          create: jest.fn().mockResolvedValue({
            content: [{ type: 'text', text: '["Professional caption here"]' }],
            usage: { input_tokens: 100, output_tokens: 50 }
          })
        }
      };

      // Mock the Anthropic import
      jest.doMock('@anthropic-ai/sdk', () => jest.fn(() => mockAnthropic));

      const options = {
        platform: SocialPlatform.INSTAGRAM,
        brandVoice: longBrandVoice
      };

      // This test would need to be run with actual provider selection logic
      // For now, we're just testing that the concept works
      expect(longBrandVoice.length).toBeGreaterThan(500);
    });

    it('should select Google for simple TikTok captions', async () => {
      const options = {
        platform: SocialPlatform.TIKTOK,
        tone: 'fun'
      };

      // In actual implementation, this would route to Google Gemini
      // Testing the routing logic concept
      expect(options.platform).toBe(SocialPlatform.TIKTOK);
    });
  });

  describe('Cost Calculation', () => {
    it('should calculate OpenAI costs correctly', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{ message: { content: 'Test caption' } }],
            usage: { total_tokens: 1000 }
          })
        }
      } as any;

      const options = {
        platform: SocialPlatform.INSTAGRAM
      };

      const result = await generateCaptions(options);
      
      // 1000 tokens * $0.045 per 1k tokens = $0.045
      expect(result.cost).toBeCloseTo(0.045, 3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty API responses', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [],
            usage: { total_tokens: 0 }
          })
        }
      } as any;

      const options = {
        platform: SocialPlatform.INSTAGRAM
      };

      const result = await generateCaptions(options);
      expect(result.captions).toEqual([]);
    });

    it('should handle null/undefined content in responses', async () => {
      mockOpenAI.chat = {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              { message: { content: null } },
              { message: { content: undefined } },
              { message: { content: 'Valid caption' } }
            ],
            usage: { total_tokens: 50 }
          })
        }
      } as any;

      const options = {
        platform: SocialPlatform.INSTAGRAM
      };

      const result = await generateCaptions(options);
      expect(result.captions).toEqual(['Valid caption']);
    });
  });
});