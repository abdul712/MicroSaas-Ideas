import { generateContent, generateImage, optimizeContent } from '@/services/openai'
import { LeadMagnetType } from '@prisma/client'

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    images: {
      generate: jest.fn(),
    },
  }))
})

// Mock Prisma
const mockPrisma = {
  organization: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  aIGeneration: {
    create: jest.fn(),
  },
}

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Mock Redis
const mockRateLimit = jest.fn()
jest.mock('@/lib/redis', () => ({
  rateLimit: mockRateLimit,
}))

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default successful responses
    mockRateLimit.mockResolvedValue({ allowed: true, remaining: 5, resetTime: Date.now() + 3600000 })
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      planLimits: { monthlyGenerations: 50 },
      monthlyGenerations: 10,
    })
    mockPrisma.organization.update.mockResolvedValue({})
    mockPrisma.aIGeneration.create.mockResolvedValue({ id: 'gen-1' })
  })

  describe('generateContent', () => {
    const mockRequest = {
      type: 'EBOOK' as LeadMagnetType,
      topic: 'Digital Marketing',
      targetAudience: 'Small business owners',
      tone: 'professional' as const,
      length: 'medium' as const,
      industry: 'Technology',
      keywords: ['SEO', 'social media'],
      organizationId: 'org-1',
    }

    it('should generate content successfully', async () => {
      const OpenAI = require('openai')
      const mockOpenAI = new OpenAI()
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: `Title: The Ultimate Digital Marketing Guide

Content: This comprehensive guide covers all aspects of digital marketing...

Outline:
1. Introduction to Digital Marketing
2. SEO Fundamentals
3. Social Media Strategy

Keywords: SEO, social media, digital marketing`
          }
        }],
        usage: { total_tokens: 500 }
      })

      const result = await generateContent(mockRequest)

      expect(result).toEqual({
        title: 'The Ultimate Digital Marketing Guide',
        content: expect.stringContaining('This comprehensive guide covers'),
        outline: expect.arrayContaining(['Introduction to Digital Marketing']),
        suggestions: expect.any(Array),
        seoKeywords: expect.any(Array),
      })

      expect(mockPrisma.aIGeneration.create).toHaveBeenCalledWith({
        data: {
          type: 'CONTENT',
          prompt: JSON.stringify(mockRequest),
          result,
          tokens: 500,
          organizationId: 'org-1',
        },
      })

      expect(mockPrisma.organization.update).toHaveBeenCalledWith({
        where: { id: 'org-1' },
        data: {
          monthlyGenerations: {
            increment: 1,
          },
        },
      })
    })

    it('should handle rate limiting', async () => {
      mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: Date.now() + 3600000 })

      await expect(generateContent(mockRequest)).rejects.toThrow('Rate limit exceeded')
    })

    it('should handle monthly limit exceeded', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue({
        id: 'org-1',
        planLimits: { monthlyGenerations: 50 },
        monthlyGenerations: 50, // At limit
      })

      await expect(generateContent(mockRequest)).rejects.toThrow('Monthly generation limit exceeded')
    })

    it('should handle organization not found', async () => {
      mockPrisma.organization.findUnique.mockResolvedValue(null)

      await expect(generateContent(mockRequest)).rejects.toThrow('Organization not found')
    })

    it('should handle OpenAI API errors', async () => {
      const OpenAI = require('openai')
      const mockOpenAI = new OpenAI()
      
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'))

      await expect(generateContent(mockRequest)).rejects.toThrow('Failed to generate content')
    })

    it('should handle different content types', async () => {
      const OpenAI = require('openai')
      const mockOpenAI = new OpenAI()
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Generated checklist content...'
          }
        }],
        usage: { total_tokens: 300 }
      })

      const checklistRequest = {
        ...mockRequest,
        type: 'CHECKLIST' as LeadMagnetType,
      }

      const result = await generateContent(checklistRequest)

      expect(result).toBeDefined()
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'system',
              content: expect.stringContaining('actionable checklists'),
            }),
          ]),
        })
      )
    })
  })

  describe('generateImage', () => {
    const mockRequest = {
      prompt: 'A professional business illustration',
      style: 'professional' as const,
      color: 'blue',
      organizationId: 'org-1',
    }

    it('should generate image successfully', async () => {
      const OpenAI = require('openai')
      const mockOpenAI = new OpenAI()
      
      mockOpenAI.images.generate.mockResolvedValue({
        data: [{
          url: 'https://example.com/generated-image.png'
        }]
      })

      const result = await generateImage(mockRequest)

      expect(result).toBe('https://example.com/generated-image.png')
      expect(mockPrisma.aIGeneration.create).toHaveBeenCalledWith({
        data: {
          type: 'IMAGE',
          prompt: mockRequest.prompt,
          result: { 
            imageUrl: 'https://example.com/generated-image.png',
            style: 'professional'
          },
          organizationId: 'org-1',
        },
      })
    })

    it('should handle image generation rate limiting', async () => {
      mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: Date.now() + 3600000 })

      await expect(generateImage(mockRequest)).rejects.toThrow('Rate limit exceeded for image generation')
    })

    it('should handle DALL-E API errors', async () => {
      const OpenAI = require('openai')
      const mockOpenAI = new OpenAI()
      
      mockOpenAI.images.generate.mockRejectedValue(new Error('DALL-E API error'))

      await expect(generateImage(mockRequest)).rejects.toThrow('Failed to generate image')
    })
  })

  describe('optimizeContent', () => {
    it('should optimize content successfully', async () => {
      const OpenAI = require('openai')
      const mockOpenAI = new OpenAI()
      
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: 'Optimized content with better clarity and engagement...'
          }
        }]
      })

      const result = await optimizeContent(
        'Original content that needs improvement',
        'better conversion rates',
        'org-1'
      )

      expect(result).toBe('Optimized content with better clarity and engagement...')
      expect(mockPrisma.aIGeneration.create).toHaveBeenCalledWith({
        data: {
          type: 'OPTIMIZATION',
          prompt: 'Target: better conversion rates',
          result: {
            original: 'Original content that needs improvement',
            optimized: 'Optimized content with better clarity and engagement...',
          },
          organizationId: 'org-1',
        },
      })
    })

    it('should handle optimization rate limiting', async () => {
      mockRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetTime: Date.now() + 3600000 })

      await expect(optimizeContent('content', 'target', 'org-1')).rejects.toThrow('Rate limit exceeded for content optimization')
    })
  })
})