import OpenAI from 'openai'
import { LeadMagnetType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/redis'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ContentGenerationRequest {
  type: LeadMagnetType
  topic: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'friendly' | 'authoritative'
  length: 'short' | 'medium' | 'long'
  industry?: string
  keywords?: string[]
  organizationId: string
}

export interface GeneratedContent {
  title: string
  content: string
  outline: string[]
  suggestions: string[]
  seoKeywords: string[]
}

export interface ImageGenerationRequest {
  prompt: string
  style: 'professional' | 'modern' | 'minimalist' | 'creative'
  color: string
  organizationId: string
}

// Content generation templates
const contentTemplates = {
  EBOOK: {
    system: "You are an expert content creator specializing in educational ebooks. Create compelling, actionable content that provides real value to readers.",
    prompt: (req: ContentGenerationRequest) => `
Create a comprehensive ebook about "${req.topic}" for ${req.targetAudience}.

Requirements:
- Tone: ${req.tone}
- Length: ${req.length}
- Industry: ${req.industry || 'general'}
- Include actionable tips and strategies
- Make it immediately valuable

Provide:
1. A compelling title
2. Full content with sections and subsections
3. Chapter outline
4. Key takeaways
5. SEO keywords
`,
  },
  CHECKLIST: {
    system: "You are an expert at creating actionable checklists that help people achieve specific goals efficiently.",
    prompt: (req: ContentGenerationRequest) => `
Create a detailed checklist about "${req.topic}" for ${req.targetAudience}.

Requirements:
- Tone: ${req.tone}
- Include 10-20 actionable items
- Make each item specific and measurable
- Industry: ${req.industry || 'general'}

Provide:
1. A clear, benefit-driven title
2. Organized checklist with categories
3. Brief explanations for complex items
4. Success criteria
5. SEO keywords
`,
  },
  TEMPLATE: {
    system: "You are an expert at creating practical templates that save time and improve results.",
    prompt: (req: ContentGenerationRequest) => `
Create a useful template for "${req.topic}" targeting ${req.targetAudience}.

Requirements:
- Tone: ${req.tone}
- Include fill-in-the-blank sections
- Provide examples and guidance
- Industry: ${req.industry || 'general'}

Provide:
1. An attractive title
2. Complete template with instructions
3. Usage guidelines
4. Customization tips
5. SEO keywords
`,
  },
  CALCULATOR: {
    system: "You are an expert at creating calculation tools that provide valuable insights.",
    prompt: (req: ContentGenerationRequest) => `
Design a calculator concept for "${req.topic}" for ${req.targetAudience}.

Requirements:
- Tone: ${req.tone}
- Define input fields and formulas
- Explain the methodology
- Industry: ${req.industry || 'general'}

Provide:
1. Calculator title and description
2. Input fields specification
3. Calculation logic
4. Results interpretation guide
5. SEO keywords
`,
  },
  INFOGRAPHIC: {
    system: "You are an expert at creating infographic content that visualizes complex information clearly.",
    prompt: (req: ContentGenerationRequest) => `
Create infographic content about "${req.topic}" for ${req.targetAudience}.

Requirements:
- Tone: ${req.tone}
- Visual-friendly content structure
- Key statistics and data points
- Industry: ${req.industry || 'general'}

Provide:
1. Compelling headline
2. Structured content for visual layout
3. Key statistics and numbers
4. Visual hierarchy suggestions
5. SEO keywords
`,
  },
}

export async function generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
  // Rate limiting check
  const rateLimitKey = `content_generation:${request.organizationId}`
  const { allowed } = await rateLimit(rateLimitKey, 10, 3600) // 10 per hour
  
  if (!allowed) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  // Check organization limits
  const organization = await prisma.organization.findUnique({
    where: { id: request.organizationId },
    select: { planLimits: true, monthlyGenerations: true },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  const limits = organization.planLimits as any
  if (organization.monthlyGenerations >= limits.monthlyGenerations) {
    throw new Error('Monthly generation limit exceeded')
  }

  try {
    const template = contentTemplates[request.type]
    if (!template) {
      throw new Error(`Unsupported content type: ${request.type}`)
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: template.system,
        },
        {
          role: 'user',
          content: template.prompt(request),
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('Failed to generate content')
    }

    // Parse the structured response
    const generated = parseGeneratedContent(content, request.type)

    // Log the generation
    await prisma.aIGeneration.create({
      data: {
        type: 'CONTENT',
        prompt: JSON.stringify(request),
        result: generated,
        tokens: completion.usage?.total_tokens,
        organizationId: request.organizationId,
      },
    })

    // Update usage counter
    await prisma.organization.update({
      where: { id: request.organizationId },
      data: {
        monthlyGenerations: {
          increment: 1,
        },
      },
    })

    return generated
  } catch (error) {
    console.error('Content generation error:', error)
    throw new Error('Failed to generate content')
  }
}

export async function generateImage(request: ImageGenerationRequest): Promise<string> {
  const rateLimitKey = `image_generation:${request.organizationId}`
  const { allowed } = await rateLimit(rateLimitKey, 5, 3600) // 5 per hour
  
  if (!allowed) {
    throw new Error('Rate limit exceeded for image generation')
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a ${request.style} style image for: ${request.prompt}. Use ${request.color} color scheme. Professional quality, suitable for business use.`,
      size: '1024x1024',
      quality: 'standard',
      n: 1,
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('Failed to generate image')
    }

    // Log the generation
    await prisma.aIGeneration.create({
      data: {
        type: 'IMAGE',
        prompt: request.prompt,
        result: { imageUrl, style: request.style },
        organizationId: request.organizationId,
      },
    })

    return imageUrl
  } catch (error) {
    console.error('Image generation error:', error)
    throw new Error('Failed to generate image')
  }
}

export async function optimizeContent(content: string, target: string, organizationId: string): Promise<string> {
  const rateLimitKey = `optimization:${organizationId}`
  const { allowed } = await rateLimit(rateLimitKey, 20, 3600) // 20 per hour
  
  if (!allowed) {
    throw new Error('Rate limit exceeded for content optimization')
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content optimizer. Improve content for better clarity, engagement, and conversion.',
        },
        {
          role: 'user',
          content: `Optimize this content for ${target}:\n\n${content}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500,
    })

    const optimized = completion.choices[0]?.message?.content
    if (!optimized) {
      throw new Error('Failed to optimize content')
    }

    // Log the optimization
    await prisma.aIGeneration.create({
      data: {
        type: 'OPTIMIZATION',
        prompt: `Target: ${target}`,
        result: { original: content, optimized },
        organizationId,
      },
    })

    return optimized
  } catch (error) {
    console.error('Content optimization error:', error)
    throw new Error('Failed to optimize content')
  }
}

function parseGeneratedContent(content: string, type: LeadMagnetType): GeneratedContent {
  // Basic parsing - in production, you'd want more sophisticated parsing
  const lines = content.split('\n').filter(line => line.trim())
  
  const title = lines.find(line => line.includes('Title:') || line.includes('title:'))?.replace(/Title:/i, '').trim() || 'Generated Content'
  
  const contentSection = content.split('Content:')[1]?.split('Outline:')[0]?.trim() || content
  
  const outline = lines
    .filter(line => line.match(/^\d+\./) || line.match(/^-/))
    .map(line => line.replace(/^\d+\.|-/, '').trim())
    .slice(0, 10)
  
  const suggestions = [
    'Add visual elements to enhance engagement',
    'Include call-to-action buttons',
    'Consider adding social proof',
    'Optimize for mobile devices',
  ]
  
  const seoKeywords = lines
    .find(line => line.toLowerCase().includes('keyword'))
    ?.split(':')[1]
    ?.split(',')
    .map(k => k.trim()) || []

  return {
    title,
    content: contentSection,
    outline,
    suggestions,
    seoKeywords,
  }
}