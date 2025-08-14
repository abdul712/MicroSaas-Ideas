import OpenAI from 'openai'
import { Anthropic } from '@anthropic-ai/sdk'

// AI Service Configuration
export interface AIServiceConfig {
  provider: 'openai' | 'anthropic' | 'google'
  model: string
  maxTokens?: number
  temperature?: number
}

export interface CaptionGenerationRequest {
  prompt?: string
  imageAnalysis?: any
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'tiktok'
  brandVoice?: {
    tone: string
    personality: any
    sampleContent: string[]
  }
  targetAudience?: string
  industry?: string
  customInstructions?: string
}

export interface CaptionGenerationResponse {
  captions: {
    text: string
    hashtags: string[]
    emojis: string[]
    callToAction?: string
    score: number
  }[]
  aiProvider: string
  model: string
  tokensUsed: number
  generationTime: number
}

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Platform-specific configurations
const PLATFORM_CONFIGS = {
  instagram: {
    characterLimit: 2200,
    hashtagLimit: 30,
    bestPractices: [
      'Use engaging hooks in the first line',
      'Include relevant hashtags',
      'Ask questions to encourage engagement',
      'Use emojis strategically',
      'Include call-to-action',
    ],
    formats: ['single-post', 'carousel', 'story', 'reel'],
  },
  facebook: {
    characterLimit: 63206,
    hashtagLimit: 10,
    bestPractices: [
      'Keep posts conversational',
      'Use storytelling',
      'Include questions for engagement',
      'Add value with each post',
      'Use minimal hashtags',
    ],
    formats: ['post', 'story', 'video'],
  },
  twitter: {
    characterLimit: 280,
    hashtagLimit: 3,
    bestPractices: [
      'Be concise and punchy',
      'Use trending hashtags',
      'Include mentions when relevant',
      'Create thread-worthy content',
      'Use clear call-to-actions',
    ],
    formats: ['tweet', 'thread', 'reply'],
  },
  linkedin: {
    characterLimit: 3000,
    hashtagLimit: 5,
    bestPractices: [
      'Maintain professional tone',
      'Share industry insights',
      'Use professional hashtags',
      'Include business value',
      'Encourage professional discussions',
    ],
    formats: ['post', 'article', 'video'],
  },
  tiktok: {
    characterLimit: 2200,
    hashtagLimit: 20,
    bestPractices: [
      'Use trending sounds and hashtags',
      'Keep captions short and engaging',
      'Include challenges or trends',
      'Use generation-specific language',
      'Encourage participation',
    ],
    formats: ['video', 'story'],
  },
}

// Build comprehensive prompt for AI
function buildCaptionPrompt(request: CaptionGenerationRequest): string {
  const platform = PLATFORM_CONFIGS[request.platform]
  
  let prompt = `Generate engaging social media captions for ${request.platform.toUpperCase()}.

PLATFORM REQUIREMENTS:
- Character limit: ${platform.characterLimit}
- Hashtag limit: ${platform.hashtagLimit}
- Best practices: ${platform.bestPractices.join(', ')}

CONTENT CONTEXT:`

  if (request.prompt) {
    prompt += `\nUser Description: ${request.prompt}`
  }

  if (request.imageAnalysis) {
    prompt += `\nImage Analysis: ${JSON.stringify(request.imageAnalysis, null, 2)}`
  }

  if (request.brandVoice) {
    prompt += `\nBRAND VOICE:
- Tone: ${request.brandVoice.tone}
- Personality: ${JSON.stringify(request.brandVoice.personality)}
- Sample Content Examples: ${request.brandVoice.sampleContent.join(' | ')}`
  }

  if (request.targetAudience) {
    prompt += `\nTarget Audience: ${request.targetAudience}`
  }

  if (request.industry) {
    prompt += `\nIndustry: ${request.industry}`
  }

  if (request.customInstructions) {
    prompt += `\nCustom Instructions: ${request.customInstructions}`
  }

  prompt += `\n\nGENERATE 5 CAPTION VARIATIONS:
For each caption, provide:
1. Main caption text (within character limit)
2. Relevant hashtags (within hashtag limit)
3. Appropriate emojis
4. Call-to-action if suitable
5. Quality score (0-100)

Return as JSON with this exact structure:
{
  "captions": [
    {
      "text": "Caption text here",
      "hashtags": ["hashtag1", "hashtag2"],
      "emojis": ["😍", "🔥"],
      "callToAction": "Call to action text",
      "score": 85
    }
  ]
}

Ensure captions are:
- Platform-optimized and engaging
- Brand voice consistent
- Hashtag researched and relevant
- Emoji placement strategic
- Call-to-action compelling`

  return prompt
}

// Generate captions using OpenAI
async function generateWithOpenAI(
  request: CaptionGenerationRequest,
  config: AIServiceConfig
): Promise<CaptionGenerationResponse> {
  const startTime = Date.now()
  
  const prompt = buildCaptionPrompt(request)
  
  const completion = await openai.chat.completions.create({
    model: config.model || 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert social media manager and copywriter specializing in creating engaging, platform-optimized content that drives engagement and conversions. Always return valid JSON format.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
    response_format: { type: 'json_object' },
  })

  const generationTime = Date.now() - startTime
  const response = completion.choices[0]?.message?.content

  if (!response) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsedResponse = JSON.parse(response)
    
    return {
      captions: parsedResponse.captions || [],
      aiProvider: 'openai',
      model: config.model || 'gpt-4-turbo-preview',
      tokensUsed: completion.usage?.total_tokens || 0,
      generationTime,
    }
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error}`)
  }
}

// Generate captions using Anthropic Claude
async function generateWithAnthropic(
  request: CaptionGenerationRequest,
  config: AIServiceConfig
): Promise<CaptionGenerationResponse> {
  const startTime = Date.now()
  
  const prompt = buildCaptionPrompt(request)
  
  const message = await anthropic.messages.create({
    model: config.model || 'claude-3-5-sonnet-20241022',
    max_tokens: config.maxTokens || 2000,
    temperature: config.temperature || 0.7,
    messages: [
      {
        role: 'user',
        content: `${prompt}\n\nIMPORTANT: Return only valid JSON, no additional text or explanations.`,
      },
    ],
  })

  const generationTime = Date.now() - startTime
  const response = message.content[0]

  if (response.type !== 'text') {
    throw new Error('Invalid response type from Anthropic')
  }

  try {
    const parsedResponse = JSON.parse(response.text)
    
    return {
      captions: parsedResponse.captions || [],
      aiProvider: 'anthropic',
      model: config.model || 'claude-3-5-sonnet-20241022',
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      generationTime,
    }
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${error}`)
  }
}

// Main caption generation function
export async function generateCaptions(
  request: CaptionGenerationRequest,
  config: AIServiceConfig = { provider: 'openai', model: 'gpt-4-turbo-preview' }
): Promise<CaptionGenerationResponse> {
  try {
    switch (config.provider) {
      case 'openai':
        return await generateWithOpenAI(request, config)
      case 'anthropic':
        return await generateWithAnthropic(request, config)
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`)
    }
  } catch (error) {
    console.error('Caption generation error:', error)
    throw error
  }
}

// Helper function to estimate cost
export function estimateGenerationCost(
  tokensUsed: number,
  provider: string,
  model: string
): number {
  const pricing = {
    openai: {
      'gpt-4-turbo-preview': { input: 0.01, output: 0.03 }, // per 1K tokens
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    },
    anthropic: {
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    },
  }

  const modelPricing = pricing[provider as keyof typeof pricing]?.[model]
  if (!modelPricing) return 0

  // Estimate roughly 75% input, 25% output tokens
  const inputTokens = Math.floor(tokensUsed * 0.75)
  const outputTokens = Math.floor(tokensUsed * 0.25)

  return (
    (inputTokens / 1000) * modelPricing.input +
    (outputTokens / 1000) * modelPricing.output
  )
}

// Helper function to get optimal AI model based on complexity
export function getOptimalAIConfig(
  complexity: 'simple' | 'medium' | 'complex',
  prioritizeCost: boolean = false
): AIServiceConfig {
  if (prioritizeCost) {
    return {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
    }
  }

  switch (complexity) {
    case 'simple':
      return {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
      }
    case 'medium':
      return {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
      }
    case 'complex':
      return {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
      }
    default:
      return {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
      }
  }
}