import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SocialPlatform, ContentType } from '@prisma/client';

// AI Provider Types
export type AIProvider = 'openai' | 'anthropic' | 'google';

export interface GenerationOptions {
  platform: SocialPlatform;
  contentType?: ContentType;
  brandVoice?: string;
  imageContext?: string;
  tone?: string;
  temperature?: number;
  maxTokens?: number;
  variationCount?: number;
}

export interface GenerationResult {
  captions: string[];
  hashtags: string[];
  provider: AIProvider;
  model: string;
  cost: number;
  processingTime: number;
  confidenceScore?: number;
}

// AI Clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Platform-specific constraints and optimization
const PLATFORM_CONFIG = {
  [SocialPlatform.INSTAGRAM]: {
    maxLength: 2200,
    optimalLength: 125,
    maxHashtags: 30,
    optimalHashtags: 11,
    style: 'visual-first, storytelling, community-focused',
    features: ['hashtags', 'mentions', 'emojis', 'line-breaks']
  },
  [SocialPlatform.FACEBOOK]: {
    maxLength: 63206,
    optimalLength: 40,
    maxHashtags: 5,
    optimalHashtags: 2,
    style: 'conversational, personal, community-building',
    features: ['questions', 'calls-to-action', 'storytelling']
  },
  [SocialPlatform.TWITTER]: {
    maxLength: 280,
    optimalLength: 71,
    maxHashtags: 2,
    optimalHashtags: 1,
    style: 'concise, witty, trending, real-time',
    features: ['hashtags', 'mentions', 'threads']
  },
  [SocialPlatform.LINKEDIN]: {
    maxLength: 3000,
    optimalLength: 150,
    maxHashtags: 5,
    optimalHashtags: 3,
    style: 'professional, insights-driven, industry-focused',
    features: ['industry-insights', 'professional-tone', 'thought-leadership']
  },
  [SocialPlatform.TIKTOK]: {
    maxLength: 2200,
    optimalLength: 100,
    maxHashtags: 20,
    optimalHashtags: 5,
    style: 'trendy, entertaining, youth-focused, viral',
    features: ['trending-sounds', 'challenges', 'viral-hashtags']
  }
} as const;

// Provider routing based on complexity and cost
function selectAIProvider(options: GenerationOptions): AIProvider {
  const { platform, contentType = ContentType.IMAGE, brandVoice } = options;
  
  // Complex brand voice training requires more sophisticated models
  if (brandVoice && brandVoice.length > 500) {
    return 'anthropic'; // Claude excels at following complex instructions
  }
  
  // Image analysis + caption generation works well with GPT-4V
  if (contentType === ContentType.IMAGE || options.imageContext) {
    return 'openai';
  }
  
  // Quick, simple captions can use Google Gemini (cost-effective)
  if (platform === SocialPlatform.TWITTER || platform === SocialPlatform.TIKTOK) {
    return 'google';
  }
  
  // Default to OpenAI for balanced performance
  return 'openai';
}

// Main caption generation function
export async function generateCaptions(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now();
  const provider = selectAIProvider(options);
  const config = PLATFORM_CONFIG[options.platform];
  
  try {
    let result: GenerationResult;
    
    switch (provider) {
      case 'openai':
        result = await generateWithOpenAI(options, config);
        break;
      case 'anthropic':
        result = await generateWithAnthropic(options, config);
        break;
      case 'google':
        result = await generateWithGoogle(options, config);
        break;
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
    
    result.processingTime = Date.now() - startTime;
    return result;
    
  } catch (error) {
    console.error(`AI generation failed with ${provider}:`, error);
    
    // Fallback to OpenAI if other providers fail
    if (provider !== 'openai') {
      try {
        const fallbackResult = await generateWithOpenAI(options, config);
        fallbackResult.processingTime = Date.now() - startTime;
        return fallbackResult;
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
      }
    }
    
    throw new Error(`Caption generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// OpenAI Generation
async function generateWithOpenAI(
  options: GenerationOptions, 
  config: typeof PLATFORM_CONFIG[SocialPlatform]
): Promise<GenerationResult> {
  const prompt = buildPrompt(options, config);
  const variationCount = options.variationCount || 3;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4-1106-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert social media caption writer specializing in ${options.platform} content. Create engaging, platform-optimized captions that drive engagement.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: options.temperature || 0.7,
    max_tokens: options.maxTokens || 300,
    n: variationCount
  });
  
  const captions = response.choices.map(choice => 
    choice.message?.content?.trim() || ''
  ).filter(Boolean);
  
  const hashtags = extractHashtags(captions);
  
  return {
    captions,
    hashtags,
    provider: 'openai',
    model: 'gpt-4-1106-preview',
    cost: calculateOpenAICost(response.usage?.total_tokens || 0),
    processingTime: 0, // Will be set by caller
    confidenceScore: 0.85
  };
}

// Anthropic Generation
async function generateWithAnthropic(
  options: GenerationOptions, 
  config: typeof PLATFORM_CONFIG[SocialPlatform]
): Promise<GenerationResult> {
  const prompt = buildPrompt(options, config);
  const variationCount = options.variationCount || 3;
  
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: options.maxTokens || 300,
    temperature: options.temperature || 0.7,
    messages: [
      {
        role: 'user',
        content: `Create ${variationCount} variations of social media captions for ${options.platform}.

${prompt}

Format your response as a JSON array of caption strings.`
      }
    ]
  });
  
  let captions: string[] = [];
  try {
    const content = response.content[0];
    if (content.type === 'text') {
      captions = JSON.parse(content.text);
    }
  } catch (error) {
    // Fallback to simple text parsing
    const content = response.content[0];
    if (content.type === 'text') {
      captions = content.text.split('\n').filter(line => line.trim()).slice(0, variationCount);
    }
  }
  
  const hashtags = extractHashtags(captions);
  
  return {
    captions,
    hashtags,
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    cost: calculateAnthropicCost(response.usage?.input_tokens || 0, response.usage?.output_tokens || 0),
    processingTime: 0,
    confidenceScore: 0.9
  };
}

// Google Gemini Generation
async function generateWithGoogle(
  options: GenerationOptions, 
  config: typeof PLATFORM_CONFIG[SocialPlatform]
): Promise<GenerationResult> {
  const model = googleAI.getGenerativeModel({ model: 'gemini-pro' });
  const prompt = buildPrompt(options, config);
  const variationCount = options.variationCount || 3;
  
  const result = await model.generateContent(`
    Create ${variationCount} engaging social media captions for ${options.platform}.
    
    ${prompt}
    
    Return only the captions, one per line, without numbering.
  `);
  
  const response = await result.response;
  const text = response.text();
  const captions = text.split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, variationCount);
  
  const hashtags = extractHashtags(captions);
  
  return {
    captions,
    hashtags,
    provider: 'google',
    model: 'gemini-pro',
    cost: calculateGoogleCost(text.length),
    processingTime: 0,
    confidenceScore: 0.8
  };
}

// Prompt building with platform optimization
function buildPrompt(
  options: GenerationOptions, 
  config: typeof PLATFORM_CONFIG[SocialPlatform]
): string {
  let prompt = `Platform: ${options.platform}\n`;
  prompt += `Optimal length: ${config.optimalLength} characters (max: ${config.maxLength})\n`;
  prompt += `Style: ${config.style}\n`;
  prompt += `Features: ${config.features.join(', ')}\n\n`;
  
  if (options.imageContext) {
    prompt += `Image context: ${options.imageContext}\n`;
  }
  
  if (options.brandVoice) {
    prompt += `Brand voice: ${options.brandVoice}\n`;
  }
  
  if (options.tone) {
    prompt += `Tone: ${options.tone}\n`;
  }
  
  prompt += `\nGenerate captions that:\n`;
  prompt += `- Are optimized for ${options.platform}\n`;
  prompt += `- Stay within ${config.optimalLength} characters when possible\n`;
  prompt += `- Include ${config.optimalHashtags} relevant hashtags\n`;
  prompt += `- Drive engagement and encourage interaction\n`;
  prompt += `- Match the specified brand voice and tone\n`;
  
  return prompt;
}

// Utility functions
function extractHashtags(captions: string[]): string[] {
  const hashtags = new Set<string>();
  
  captions.forEach(caption => {
    const matches = caption.match(/#[\w\d_]+/g);
    if (matches) {
      matches.forEach(hashtag => hashtags.add(hashtag.toLowerCase()));
    }
  });
  
  return Array.from(hashtags);
}

function calculateOpenAICost(tokens: number): number {
  // GPT-4 pricing: $0.03/1k input tokens, $0.06/1k output tokens
  // Simplified calculation assuming 50/50 split
  return (tokens / 1000) * 0.045;
}

function calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
  // Claude pricing: $0.015/1k input tokens, $0.075/1k output tokens
  return (inputTokens / 1000) * 0.015 + (outputTokens / 1000) * 0.075;
}

function calculateGoogleCost(textLength: number): number {
  // Gemini pricing: $0.00025/1k characters (approximate)
  return (textLength / 1000) * 0.00025;
}

// Brand voice analysis and matching
export async function analyzeBrandVoice(examples: string[]): Promise<string[]> {
  if (examples.length === 0) return [];
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: 'Analyze the provided text examples and extract key characteristics of the writing style, tone, and voice. Return a JSON array of descriptive keywords.'
        },
        {
          role: 'user',
          content: `Analyze these brand voice examples:\n\n${examples.join('\n\n')}\n\nReturn characteristics as a JSON array.`
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    });
    
    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Brand voice analysis failed:', error);
  }
  
  return [];
}

// Image analysis for context-aware captions
export async function analyzeImageForContext(imageUrl: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image in detail for social media caption generation. Focus on mood, objects, colors, setting, and potential story elements.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Image analysis failed:', error);
    return '';
  }
}