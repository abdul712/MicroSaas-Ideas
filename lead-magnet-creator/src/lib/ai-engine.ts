import OpenAI from 'openai'
import { LeadMagnetType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { RateLimiter } from '@/lib/redis'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// AI generation types
export interface GenerationRequest {
  type: LeadMagnetType
  topic: string
  industry: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational'
  brandVoice?: string
  contentLength: 'short' | 'medium' | 'long'
  includeImages?: boolean
  organizationId: string
  userId: string
}

export interface GeneratedContent {
  title: string
  subtitle?: string
  content: ContentSection[]
  images?: GeneratedImage[]
  metadata: {
    wordCount: number
    readingTime: number
    qualityScore: number
    keywords: string[]
  }
}

export interface ContentSection {
  type: 'heading' | 'paragraph' | 'list' | 'checklist' | 'quote' | 'callout'
  content: string
  order: number
  metadata?: Record<string, any>
}

export interface GeneratedImage {
  url: string
  alt: string
  caption?: string
  style: string
}

// Content generation prompts
const CONTENT_PROMPTS = {
  [LeadMagnetType.EBOOK]: {
    system: "You are an expert content creator specializing in creating high-converting lead magnet eBooks. Create comprehensive, valuable content that addresses specific pain points and provides actionable solutions.",
    template: `Create a detailed eBook outline and content for:
Topic: {topic}
Industry: {industry}
Target Audience: {targetAudience}
Tone: {tone}
Length: {contentLength}

Structure the content with:
1. Compelling title and subtitle
2. Table of contents
3. Introduction that hooks the reader
4. 3-5 main chapters with actionable content
5. Conclusion with clear next steps
6. Call-to-action

Focus on providing immediate value and solving specific problems. Include practical tips, frameworks, and actionable advice.`
  },
  
  [LeadMagnetType.CHECKLIST]: {
    system: "You are an expert at creating practical, actionable checklists that help people achieve specific outcomes. Focus on step-by-step guidance and easy-to-follow processes.",
    template: `Create a comprehensive checklist for:
Topic: {topic}
Industry: {industry}
Target Audience: {targetAudience}
Tone: {tone}

Structure the checklist with:
1. Clear, compelling title
2. Brief introduction explaining the value
3. 15-25 actionable checklist items
4. Each item should be specific and measurable
5. Group related items into logical sections
6. Include pro tips or warnings where relevant
7. Conclusion with next steps

Make each checklist item actionable and specific. Use active voice and clear language.`
  },
  
  [LeadMagnetType.TEMPLATE]: {
    system: "You are an expert at creating practical templates and frameworks that businesses can immediately implement. Focus on fill-in-the-blank style content and clear instructions.",
    template: `Create a practical template for:
Topic: {topic}
Industry: {industry}
Target Audience: {targetAudience}
Tone: {tone}

Structure the template with:
1. Compelling title and subtitle
2. Instructions for use
3. Template sections with [FILL IN] placeholders
4. Examples or sample content
5. Tips for customization
6. Next steps after completion

Make the template immediately usable and valuable. Include clear instructions and examples.`
  },
  
  [LeadMagnetType.CALCULATOR]: {
    system: "You are an expert at creating interactive calculators that help users make informed decisions. Focus on clear formulas, inputs, and valuable insights.",
    template: `Create an interactive calculator for:
Topic: {topic}
Industry: {industry}
Target Audience: {targetAudience}
Tone: {tone}

Structure the calculator with:
1. Clear title and purpose
2. Input fields with descriptions
3. Calculation logic and formulas
4. Results interpretation
5. Recommendations based on results
6. Additional resources or next steps

Make the calculator practical and immediately useful. Include explanations for all inputs and outputs.`
  },
  
  [LeadMagnetType.INFOGRAPHIC]: {
    system: "You are an expert at creating data-driven infographics that communicate complex information visually. Focus on clear hierarchy and compelling statistics.",
    template: `Create an infographic concept for:
Topic: {topic}
Industry: {industry}
Target Audience: {targetAudience}
Tone: {tone}

Structure the infographic with:
1. Attention-grabbing headline
2. Key statistics and data points
3. Visual hierarchy with sections
4. Icons and visual elements descriptions
5. Call-to-action
6. Source citations

Focus on compelling statistics, clear visual flow, and actionable insights.`
  }
}

// Brand voice templates
const BRAND_VOICE_MODIFIERS = {
  professional: "Use formal language, industry terminology, and maintain a sophisticated tone. Focus on credibility and expertise.",
  casual: "Use conversational language, contractions, and a relaxed tone. Write like you're talking to a friend.",
  friendly: "Use warm, approachable language with personal touches. Be helpful and encouraging.",
  authoritative: "Use confident, decisive language. Position yourself as the expert and thought leader.",
  conversational: "Use natural, flowing language with questions and direct address. Engage the reader in dialogue."
}

export class AIContentEngine {
  // Main content generation method
  static async generateContent(request: GenerationRequest): Promise<GeneratedContent> {
    // Check rate limits
    const rateLimitKey = `ai_generation:${request.organizationId}`
    const rateLimit = await RateLimiter.checkLimit(rateLimitKey, 50, 3600) // 50 generations per hour
    
    if (!rateLimit.allowed) {
      throw new Error('Rate limit exceeded. Please try again later.')
    }

    try {
      // Generate main content
      const content = await this.generateMainContent(request)
      
      // Generate images if requested
      let images: GeneratedImage[] = []
      if (request.includeImages) {
        images = await this.generateImages(request, content.title)
      }

      // Calculate quality metrics
      const metadata = this.calculateContentMetrics(content)

      const result: GeneratedContent = {
        ...content,
        images,
        metadata
      }

      // Store generation record
      await this.recordGeneration(request, result)

      return result
    } catch (error) {
      console.error('AI generation error:', error)
      throw new Error('Failed to generate content. Please try again.')
    }
  }

  // Generate main content using GPT-4
  private static async generateMainContent(request: GenerationRequest): Promise<Omit<GeneratedContent, 'images' | 'metadata'>> {
    const prompt = this.buildPrompt(request)
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: CONTENT_PROMPTS[request.type].system
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: this.getMaxTokens(request.contentLength),
      response_format: { type: 'json_object' }
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No content generated')
    }

    try {
      const parsed = JSON.parse(response)
      return this.structureContent(parsed, request.type)
    } catch (error) {
      throw new Error('Failed to parse generated content')
    }
  }

  // Generate images using DALL-E
  private static async generateImages(request: GenerationRequest, title: string): Promise<GeneratedImage[]> {
    const imagePrompts = this.createImagePrompts(request, title)
    const images: GeneratedImage[] = []

    for (const prompt of imagePrompts.slice(0, 3)) { // Limit to 3 images
      try {
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: `Professional, high-quality illustration for business content: ${prompt}. Clean, modern style suitable for business documents. No text overlays.`,
          size: '1024x1024',
          quality: 'standard',
          style: 'natural'
        })

        const imageUrl = response.data[0]?.url
        if (imageUrl) {
          images.push({
            url: imageUrl,
            alt: prompt,
            style: 'professional'
          })
        }
      } catch (error) {
        console.error('Image generation error:', error)
        // Continue with other images if one fails
      }
    }

    return images
  }

  // Build the generation prompt
  private static buildPrompt(request: GenerationRequest): string {
    let prompt = CONTENT_PROMPTS[request.type].template
    
    // Replace placeholders
    prompt = prompt
      .replace('{topic}', request.topic)
      .replace('{industry}', request.industry)
      .replace('{targetAudience}', request.targetAudience)
      .replace('{tone}', request.tone)
      .replace('{contentLength}', request.contentLength)

    // Add brand voice modifier
    if (request.brandVoice) {
      prompt += `\n\nBrand Voice Guidelines: ${request.brandVoice}`
    } else {
      prompt += `\n\nTone Guidelines: ${BRAND_VOICE_MODIFIERS[request.tone]}`
    }

    // Add content length specifics
    const lengthGuides = {
      short: 'Keep content concise and focused. Aim for 1000-1500 words total.',
      medium: 'Provide comprehensive coverage. Aim for 2000-3000 words total.',
      long: 'Create in-depth, detailed content. Aim for 3000-5000 words total.'
    }
    prompt += `\n\nLength Requirements: ${lengthGuides[request.contentLength]}`

    // Add output format requirements
    prompt += `\n\nProvide the response in valid JSON format with the following structure:
{
  "title": "Main title",
  "subtitle": "Compelling subtitle",
  "content": [
    {
      "type": "heading|paragraph|list|checklist|quote|callout",
      "content": "Content text",
      "order": 1
    }
  ]
}`

    return prompt
  }

  // Structure the generated content
  private static structureContent(parsed: any, type: LeadMagnetType): Omit<GeneratedContent, 'images' | 'metadata'> {
    return {
      title: parsed.title || 'Untitled',
      subtitle: parsed.subtitle,
      content: Array.isArray(parsed.content) ? parsed.content.map((item: any, index: number) => ({
        type: item.type || 'paragraph',
        content: item.content || '',
        order: item.order || index + 1,
        metadata: item.metadata || {}
      })) : []
    }
  }

  // Create image generation prompts
  private static createImagePrompts(request: GenerationRequest, title: string): string[] {
    const basePrompts = {
      [LeadMagnetType.EBOOK]: [
        `${request.industry} professional working on ${request.topic}`,
        `Modern office environment related to ${request.topic}`,
        `Abstract concept representing ${request.topic} success`
      ],
      [LeadMagnetType.CHECKLIST]: [
        `Person checking off items on a list for ${request.topic}`,
        `Organized workspace with checklist and ${request.industry} elements`,
        `Success indicators for ${request.topic}`
      ],
      [LeadMagnetType.TEMPLATE]: [
        `Clean, organized template layout for ${request.topic}`,
        `Professional documents and planning materials`,
        `${request.industry} workflow visualization`
      ],
      [LeadMagnetType.CALCULATOR]: [
        `Calculator, charts, and financial planning tools`,
        `Data visualization and analytics dashboard`,
        `Professional analysis and measurement tools`
      ],
      [LeadMagnetType.INFOGRAPHIC]: [
        `Data visualization and statistics charts`,
        `Information graphics and diagrams`,
        `Modern infographic elements and icons`
      ]
    }

    return basePrompts[request.type] || basePrompts[LeadMagnetType.EBOOK]
  }

  // Calculate content quality metrics
  private static calculateContentMetrics(content: Omit<GeneratedContent, 'images' | 'metadata'>): GeneratedContent['metadata'] {
    const fullText = content.content.map(section => section.content).join(' ')
    const wordCount = fullText.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 250) // Average reading speed
    
    // Simple quality scoring based on content structure and length
    let qualityScore = 0.5 // Base score
    
    // Bonus for good structure
    if (content.content.length >= 3) qualityScore += 0.2
    if (content.subtitle) qualityScore += 0.1
    if (wordCount >= 500) qualityScore += 0.2
    
    // Extract simple keywords (this could be improved with NLP)
    const keywords = this.extractKeywords(fullText)
    
    return {
      wordCount,
      readingTime,
      qualityScore: Math.min(1.0, qualityScore),
      keywords
    }
  }

  // Extract keywords from content
  private static extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
    
    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  // Get max tokens based on content length
  private static getMaxTokens(length: string): number {
    const tokenLimits = {
      short: 2000,
      medium: 3000,
      long: 4000
    }
    return tokenLimits[length as keyof typeof tokenLimits] || 2000
  }

  // Record generation for tracking and analytics
  private static async recordGeneration(request: GenerationRequest, result: GeneratedContent): Promise<void> {
    try {
      await prisma.aIGeneration.create({
        data: {
          organizationId: request.organizationId,
          userId: request.userId,
          prompt: JSON.stringify(request),
          content: JSON.stringify(result),
          modelUsed: 'gpt-4-turbo-preview',
          tokensUsed: this.estimateTokens(result),
          qualityScore: result.metadata.qualityScore,
          type: request.type
        }
      })
    } catch (error) {
      console.error('Failed to record generation:', error)
      // Don't throw here as the generation was successful
    }
  }

  // Estimate tokens used (rough calculation)
  private static estimateTokens(result: GeneratedContent): number {
    const fullText = JSON.stringify(result)
    return Math.ceil(fullText.length / 4) // Rough estimate: 4 characters per token
  }
}

// Content optimization utilities
export class ContentOptimizer {
  // Optimize content for conversions
  static async optimizeForConversions(content: GeneratedContent, industry: string): Promise<GeneratedContent> {
    // Add conversion-focused elements
    const optimizedContent = { ...content }
    
    // Add urgency and value propositions
    const calloutSections = this.generateCallouts(industry)
    optimizedContent.content.push(...calloutSections)
    
    return optimizedContent
  }

  // Generate conversion-focused callouts
  private static generateCallouts(industry: string): ContentSection[] {
    const callouts = [
      {
        type: 'callout' as const,
        content: '💡 Pro Tip: Implement this strategy within the next 24 hours for maximum impact.',
        order: 999
      },
      {
        type: 'callout' as const,
        content: '⚡ Quick Win: This single change could improve your results by 25% or more.',
        order: 1000
      }
    ]
    
    return callouts
  }
}

// Content personalization
export class ContentPersonalizer {
  // Personalize content based on user data
  static async personalizeContent(
    content: GeneratedContent,
    userProfile: { industry: string; role: string; experience: string }
  ): Promise<GeneratedContent> {
    // Clone the content
    const personalizedContent = JSON.parse(JSON.stringify(content))
    
    // Add role-specific insights
    const roleSpecificContent = this.generateRoleSpecificContent(userProfile)
    personalizedContent.content.unshift(...roleSpecificContent)
    
    return personalizedContent
  }

  private static generateRoleSpecificContent(profile: { industry: string; role: string; experience: string }): ContentSection[] {
    return [
      {
        type: 'callout',
        content: `Tailored for ${profile.role}s in ${profile.industry} with ${profile.experience} experience.`,
        order: 0
      }
    ]
  }
}