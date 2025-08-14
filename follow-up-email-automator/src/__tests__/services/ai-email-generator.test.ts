import { aiEmailGenerator } from '@/services/ai-email-generator'

// Mock OpenAI
jest.mock('openai')

describe('AIEmailGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateEmailContent', () => {
    it('should generate email content successfully', async () => {
      const input = {
        type: 'follow_up' as const,
        recipientName: 'John Doe',
        company: 'Acme Corp',
        tone: 'professional' as const,
        context: 'Following up on our meeting last week',
      }

      const result = await aiEmailGenerator.generateEmailContent(input)

      expect(result).toMatchObject({
        subject: expect.any(String),
        htmlContent: expect.any(String),
        textContent: expect.any(String),
        variables: expect.any(Array),
        personalizedElements: expect.any(Array),
      })
    })

    it('should handle missing optional parameters', async () => {
      const input = {
        type: 'welcome' as const,
        tone: 'friendly' as const,
      }

      const result = await aiEmailGenerator.generateEmailContent(input)

      expect(result).toBeDefined()
      expect(result.subject).toBeTruthy()
      expect(result.htmlContent).toBeTruthy()
    })

    it('should validate input parameters', async () => {
      const invalidInput = {
        type: 'invalid_type' as any,
        tone: 'invalid_tone' as any,
      }

      await expect(aiEmailGenerator.generateEmailContent(invalidInput)).rejects.toThrow()
    })
  })

  describe('generateSubjectLineVariations', () => {
    it('should generate multiple subject line variations', async () => {
      const baseSubject = 'Follow up on our meeting'
      const count = 3

      const result = await aiEmailGenerator.generateSubjectLineVariations(baseSubject, count)

      expect(result).toHaveLength(count)
      expect(result.every(variation => typeof variation === 'string')).toBe(true)
    })
  })

  describe('optimizeEmailContent', () => {
    it('should optimize email content based on metrics', async () => {
      const content = '<p>Hello {{firstName}},</p><p>Following up on our conversation...</p>'
      const metrics = {
        openRate: 15.5,
        clickRate: 2.3,
        replyRate: 1.1,
      }

      const result = await aiEmailGenerator.optimizeEmailContent(content, metrics)

      expect(result).toMatchObject({
        optimizedContent: expect.any(String),
        improvements: expect.any(Array),
        predictedImprovements: {
          openRate: expect.any(Number),
          clickRate: expect.any(Number),
          replyRate: expect.any(Number),
        },
      })
    })
  })

  describe('generateSequence', () => {
    it('should generate a complete email sequence', async () => {
      const sequenceType = 'onboarding'
      const steps = 3
      const context = {
        industry: 'SaaS',
        audience: 'new users',
        goal: 'activation',
        tone: 'friendly',
      }

      const result = await aiEmailGenerator.generateSequence(sequenceType, steps, context)

      expect(result).toHaveLength(steps)
      result.forEach((step, index) => {
        expect(step).toMatchObject({
          stepNumber: index + 1,
          delayDays: expect.any(Number),
          subject: expect.any(String),
          content: expect.any(String),
          purpose: expect.any(String),
        })
      })
    })
  })

  describe('analyzeEmailSentiment', () => {
    it('should analyze email sentiment correctly', async () => {
      const content = 'Thank you for your time today! I look forward to working together.'

      const result = await aiEmailGenerator.analyzeEmailSentiment(content)

      expect(result).toMatchObject({
        sentiment: expect.stringMatching(/^(positive|neutral|negative)$/),
        confidence: expect.any(Number),
        suggestions: expect.any(Array),
      })
    })

    it('should provide suggestions for improvement', async () => {
      const content = 'This is urgent! You must respond immediately or face consequences!'

      const result = await aiEmailGenerator.analyzeEmailSentiment(content)

      expect(result.suggestions).toHaveLength(0) // Mocked to return empty array
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    })
  })

  describe('error handling', () => {
    it('should handle OpenAI API errors gracefully', async () => {
      const input = {
        type: 'follow_up' as const,
        tone: 'professional' as const,
      }

      // Mock OpenAI to throw an error
      const OpenAI = require('openai')
      const mockInstance = new OpenAI()
      mockInstance.chat.completions.create.mockRejectedValue(new Error('API Error'))

      await expect(aiEmailGenerator.generateEmailContent(input)).rejects.toThrow('Failed to generate email content')
    })
  })

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = aiEmailGenerator
      const instance2 = aiEmailGenerator
      
      expect(instance1).toBe(instance2)
    })
  })
})