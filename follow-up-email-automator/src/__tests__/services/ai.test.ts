import { aiEmailService } from '@/services/ai';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

describe('AI Email Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEmailContent', () => {
    it('should generate email content successfully', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              subject: 'Test Subject',
              bodyHtml: '<p>Test content with {{firstName}}</p>',
              bodyText: 'Test content with {{firstName}}',
              variables: ['firstName'],
              suggestions: ['Consider adding a call-to-action'],
            }),
          },
        }],
      });

      const result = await aiEmailService.generateEmailContent({
        prompt: 'Generate a welcome email',
        tone: 'professional',
        length: 'medium',
        emailType: 'welcome',
      });

      expect(result).toEqual({
        subject: 'Test Subject',
        bodyHtml: '<p>Test content with {{firstName}}</p>',
        bodyText: 'Test content with {{firstName}}',
        variables: ['firstName'],
        suggestions: ['Consider adding a call-to-action'],
      });

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          { role: 'system', content: expect.stringContaining('professional') },
          { role: 'user', content: expect.stringContaining('Generate a welcome email') },
        ]),
        temperature: 0.7,
        max_tokens: 1500,
      });
    });

    it('should handle API errors gracefully', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockRejectedValue(new Error('API Error'));

      await expect(
        aiEmailService.generateEmailContent({
          prompt: 'Generate a welcome email',
        })
      ).rejects.toThrow('Failed to generate email content');
    });

    it('should handle empty API response', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [],
      });

      await expect(
        aiEmailService.generateEmailContent({
          prompt: 'Generate a welcome email',
        })
      ).rejects.toThrow('Failed to generate email content');
    });
  });

  describe('optimizeSubjectLine', () => {
    it('should generate subject line variations', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Optimized Subject 1\nOptimized Subject 2\nOptimized Subject 3',
          },
        }],
      });

      const result = await aiEmailService.optimizeSubjectLine(
        'Original Subject',
        'Email content here'
      );

      expect(result).toEqual([
        'Optimized Subject 1',
        'Optimized Subject 2',
        'Optimized Subject 3',
      ]);
    });

    it('should return empty array on error', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await aiEmailService.optimizeSubjectLine(
        'Original Subject',
        'Email content here'
      );

      expect(result).toEqual([]);
    });
  });

  describe('analyzeEmailSentiment', () => {
    it('should analyze email sentiment correctly', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              sentiment: 'positive',
              score: 85,
              suggestions: ['Great tone!', 'Consider adding more enthusiasm'],
            }),
          },
        }],
      });

      const result = await aiEmailService.analyzeEmailSentiment(
        'Thank you for your interest in our product!'
      );

      expect(result).toEqual({
        sentiment: 'positive',
        score: 85,
        suggestions: ['Great tone!', 'Consider adding more enthusiasm'],
      });
    });

    it('should return default values on error', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockRejectedValue(new Error('API Error'));

      const result = await aiEmailService.analyzeEmailSentiment(
        'Test email content'
      );

      expect(result).toEqual({
        sentiment: 'neutral',
        score: 50,
        suggestions: [],
      });
    });
  });

  describe('checkSpamScore', () => {
    it('should check spam score and provide suggestions', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              score: 75,
              issues: ['Missing unsubscribe link'],
              suggestions: ['Add an unsubscribe link', 'Reduce exclamation points'],
            }),
          },
        }],
      });

      const result = await aiEmailService.checkSpamScore(
        '<p>Buy now!!!</p>',
        'URGENT: Limited Time Offer!!!'
      );

      expect(result).toEqual({
        score: 75,
        issues: ['Missing unsubscribe link'],
        suggestions: ['Add an unsubscribe link', 'Reduce exclamation points'],
      });
    });

    it('should return default values on parsing error', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
      });

      const result = await aiEmailService.checkSpamScore(
        'Test content',
        'Test subject'
      );

      expect(result).toEqual({
        score: 50,
        issues: [],
        suggestions: [],
      });
    });
  });

  describe('generateSequence', () => {
    it('should generate email sequence successfully', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      const expectedSequence = [
        {
          subject: 'Welcome to our service!',
          content: '<p>Welcome email content</p>',
          delayDays: 0,
        },
        {
          subject: 'Getting started guide',
          content: '<p>Follow-up content</p>',
          delayDays: 3,
        },
      ];

      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(expectedSequence),
          },
        }],
      });

      const result = await aiEmailService.generateSequence(
        'Onboarding sequence for new users',
        2,
        'Software developers',
        'User activation'
      );

      expect(result).toEqual(expectedSequence);
    });

    it('should return empty array on JSON parsing error', async () => {
      const mockOpenAI = require('openai').default;
      const mockCreate = mockOpenAI().chat.completions.create;
      
      mockCreate.mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON',
          },
        }],
      });

      const result = await aiEmailService.generateSequence(
        'Test sequence',
        2,
        'Test audience',
        'Test goal'
      );

      expect(result).toEqual([]);
    });
  });
});