import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
})

// Content generation schemas
const contentGenerationSchema = z.object({
  type: z.enum(['ebook', 'checklist', 'template', 'calculator', 'infographic']),
  topic: z.string().min(1),
  industry: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'authoritative', 'conversational']).default('professional'),
  targetAudience: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  wordCount: z.number().min(100).max(5000).optional(),
  brandVoice: z.string().optional(),
})

const imageGenerationSchema = z.object({
  prompt: z.string().min(1),
  style: z.enum(['photorealistic', 'illustration', 'minimalist', 'corporate', 'creative']).default('professional'),
  aspectRatio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4']).default('16:9'),
  colors: z.array(z.string()).optional(),
})

export type ContentGenerationParams = z.infer<typeof contentGenerationSchema>
export type ImageGenerationParams = z.infer<typeof imageGenerationSchema>

// Content generation functions
export const generateLeadMagnetContent = async (params: ContentGenerationParams) => {
  try {
    const validatedParams = contentGenerationSchema.parse(params)
    
    const systemPrompt = getSystemPromptForType(validatedParams.type)
    const userPrompt = buildContentPrompt(validatedParams)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content generated')
    }

    return {
      content: parseContentResponse(content, validatedParams.type),
      usage: completion.usage,
      model: completion.model,
    }
  } catch (error) {
    console.error('Content generation error:', error)
    throw new Error('Failed to generate content')
  }
}

export const generateLeadMagnetImage = async (params: ImageGenerationParams) => {
  try {
    const validatedParams = imageGenerationSchema.parse(params)
    
    const enhancedPrompt = buildImagePrompt(validatedParams)

    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      size: getDallESize(validatedParams.aspectRatio),
      quality: 'hd',
      n: 1,
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('No image generated')
    }

    return {
      url: imageUrl,
      prompt: enhancedPrompt,
      revisedPrompt: response.data[0]?.revised_prompt,
    }
  } catch (error) {
    console.error('Image generation error:', error)
    throw new Error('Failed to generate image')
  }
}

// Optimization and improvement functions
export const optimizeLeadMagnetContent = async (content: string, type: string, feedback?: string) => {
  try {
    const systemPrompt = `You are a lead generation expert specializing in optimizing ${type} content for maximum conversion. Focus on improving clarity, value proposition, and actionability.`
    
    let userPrompt = `Please optimize the following ${type} content for better lead generation performance:\n\n${content}`
    
    if (feedback) {
      userPrompt += `\n\nSpecific feedback to address: ${feedback}`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    })

    const optimizedContent = completion.choices[0]?.message?.content
    if (!optimizedContent) {
      throw new Error('No optimized content generated')
    }

    return {
      content: optimizedContent,
      usage: completion.usage,
    }
  } catch (error) {
    console.error('Content optimization error:', error)
    throw new Error('Failed to optimize content')
  }
}

export const generateContentIdeas = async (industry: string, contentType: string, count: number = 5) => {
  try {
    const systemPrompt = `You are a marketing strategist specializing in lead generation. Generate compelling ${contentType} ideas for the ${industry} industry.`
    
    const userPrompt = `Generate ${count} high-converting ${contentType} ideas for businesses in the ${industry} industry. Each idea should:
    1. Address a specific pain point
    2. Offer clear value
    3. Be actionable
    4. Appeal to the target audience

    Format as a JSON array with objects containing: title, description, targetAudience, valueProposition`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No ideas generated')
    }

    try {
      return JSON.parse(response)
    } catch {
      // Fallback if JSON parsing fails
      return parseIdeasFromText(response)
    }
  } catch (error) {
    console.error('Idea generation error:', error)
    throw new Error('Failed to generate ideas')
  }
}

// Helper functions
function getSystemPromptForType(type: string): string {
  const prompts = {
    ebook: `You are an expert content creator specializing in educational eBooks for lead generation. Create comprehensive, valuable content that establishes authority and builds trust with potential leads.`,
    checklist: `You are a productivity expert creating actionable checklists for lead generation. Focus on step-by-step processes that deliver immediate value and results.`,
    template: `You are a business consultant creating practical templates for lead generation. Design reusable frameworks that save time and provide clear structure.`,
    calculator: `You are a data analyst creating interactive calculators for lead generation. Focus on providing valuable insights and personalized results.`,
    infographic: `You are a visual communication expert creating infographic content for lead generation. Focus on data-driven insights and compelling visual narratives.`,
  }
  
  return prompts[type as keyof typeof prompts] || prompts.ebook
}

function buildContentPrompt(params: ContentGenerationParams): string {
  let prompt = `Create a high-converting ${params.type} on the topic: "${params.topic}"`
  
  if (params.industry) {
    prompt += ` for the ${params.industry} industry`
  }
  
  if (params.targetAudience) {
    prompt += ` targeting ${params.targetAudience}`
  }
  
  prompt += `\n\nRequirements:
  - Tone: ${params.tone}
  - Format: Structured for easy reading and implementation
  - Value: Provide actionable insights and practical tips`
  
  if (params.keyPoints && params.keyPoints.length > 0) {
    prompt += `\n- Key points to cover: ${params.keyPoints.join(', ')}`
  }
  
  if (params.wordCount) {
    prompt += `\n- Word count: approximately ${params.wordCount} words`
  }
  
  if (params.brandVoice) {
    prompt += `\n- Brand voice: ${params.brandVoice}`
  }
  
  prompt += `\n\nThe content should be valuable enough that people would willingly exchange their email address for it.`
  
  return prompt
}

function buildImagePrompt(params: ImageGenerationParams): string {
  let prompt = params.prompt
  
  // Add style modifiers
  const styleModifiers = {
    photorealistic: 'photorealistic, professional photography',
    illustration: 'digital illustration, clean design',
    minimalist: 'minimalist design, clean lines, simple composition',
    corporate: 'corporate style, professional, business-focused',
    creative: 'creative design, artistic, innovative',
  }
  
  prompt += `, ${styleModifiers[params.style]}`
  
  if (params.colors && params.colors.length > 0) {
    prompt += `, color palette: ${params.colors.join(', ')}`
  }
  
  prompt += ', high quality, suitable for marketing materials'
  
  return prompt
}

function getDallESize(aspectRatio: string): '1024x1024' | '1792x1024' | '1024x1792' {
  const sizeMap = {
    '1:1': '1024x1024' as const,
    '16:9': '1792x1024' as const,
    '9:16': '1024x1792' as const,
    '4:3': '1792x1024' as const,
    '3:4': '1024x1792' as const,
  }
  
  return sizeMap[aspectRatio as keyof typeof sizeMap] || '1024x1024'
}

function parseContentResponse(content: string, type: string) {
  try {
    // Try to parse as JSON first
    return JSON.parse(content)
  } catch {
    // Fallback to structured text parsing
    return {
      title: extractTitle(content),
      content: content,
      sections: extractSections(content),
      type,
    }
  }
}

function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m) || content.match(/^(.+)$/m)
  return titleMatch ? titleMatch[1].trim() : 'Lead Magnet'
}

function extractSections(content: string): string[] {
  const sections = content.split(/\n#{2,}\s+/g)
  return sections.filter(section => section.trim().length > 0)
}

function parseIdeasFromText(text: string): any[] {
  // Simple fallback parser for when JSON parsing fails
  const lines = text.split('\n').filter(line => line.trim())
  const ideas = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (line.match(/^\d+\./) || line.match(/^-\s/)) {
      ideas.push({
        title: line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, ''),
        description: 'AI-generated lead magnet idea',
        targetAudience: 'Business professionals',
        valueProposition: 'Provides valuable insights and actionable advice',
      })
    }
  }
  
  return ideas.slice(0, 5) // Limit to 5 ideas
}

// Rate limiting and usage tracking
export const trackUsage = async (userId: string, organizationId: string, type: 'content' | 'image', tokens?: number) => {
  try {
    const { prisma } = await import('@/lib/prisma')
    
    await prisma.aIGeneration.create({
      data: {
        type,
        prompt: '', // Will be filled by caller
        parameters: {},
        result: {},
        status: 'completed',
        tokensUsed: tokens || 0,
        userId,
        organizationId,
      },
    })
  } catch (error) {
    console.error('Usage tracking error:', error)
  }
}

export default openai