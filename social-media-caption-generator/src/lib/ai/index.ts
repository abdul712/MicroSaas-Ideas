import { Platform, AIProvider } from '@prisma/client';
import * as OpenAI from './openai';
import * as Anthropic from './anthropic';
import * as Google from './google';

export interface GenerationRequest {
  prompt: string;
  platform: Platform;
  brandVoice?: {
    name: string;
    type: string;
    description?: string;
    examples: string[];
    keywords: string[];
    toneGuidelines?: string;
  };
  imageAnalysis?: {
    objects: string[];
    scene?: string;
    colors: string[];
    text?: string;
    faces?: number;
    mood?: string;
  };
  preferences?: {
    aiProvider?: AIProvider;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    enableFallback?: boolean;
  };
}

export interface GenerationResponse {
  success: boolean;
  caption?: string;
  hashtags?: string[];
  emojis?: string[];
  metadata: {
    aiProvider: AIProvider;
    model: string;
    cost: number;
    generationTime: number;
    qualityScore?: number;
    brandVoiceMatch?: number;
    fallbackUsed?: boolean;
  };
  error?: string;
}

// Cost-based provider selection for optimization
const PROVIDER_COSTS = {
  [AIProvider.GOOGLE]: 0.1,      // Lowest cost
  [AIProvider.ANTHROPIC]: 0.5,   // Medium cost, high quality
  [AIProvider.OPENAI]: 1.0,      // Highest cost, best features
};

// Model selection by provider and complexity
const MODEL_SELECTION = {
  [AIProvider.OPENAI]: {
    simple: 'gpt-4o-mini',
    complex: 'gpt-4o',
    creative: 'gpt-4',
  },
  [AIProvider.ANTHROPIC]: {
    simple: 'claude-3-haiku-20240307',
    complex: 'claude-3-5-sonnet-20241022',
    creative: 'claude-3-sonnet-20240229',
  },
  [AIProvider.GOOGLE]: {
    simple: 'gemini-1.5-flash',
    complex: 'gemini-1.5-pro',
    creative: 'gemini-pro',
  },
};

export async function generateCaption(request: GenerationRequest): Promise<GenerationResponse> {
  const startTime = Date.now();
  
  try {
    // Determine AI provider and model
    const aiProvider = selectOptimalProvider(request);
    const model = selectOptimalModel(aiProvider, request);
    
    // Prepare generation parameters
    const params = {
      prompt: request.prompt,
      platform: request.platform,
      brandVoice: formatBrandVoice(request.brandVoice),
      imageAnalysis: request.imageAnalysis,
      maxTokens: request.preferences?.maxTokens || 300,
      temperature: request.preferences?.temperature || 0.7,
      model,
    };

    let response;
    let fallbackUsed = false;

    try {
      // Primary generation attempt
      response = await executeGeneration(aiProvider, params);
    } catch (error) {
      console.error(`Primary provider ${aiProvider} failed:`, error);
      
      if (request.preferences?.enableFallback !== false) {
        // Fallback to most reliable provider
        const fallbackProvider = AIProvider.ANTHROPIC;
        const fallbackModel = MODEL_SELECTION[fallbackProvider].simple;
        
        response = await executeGeneration(fallbackProvider, {
          ...params,
          model: fallbackModel,
        });
        
        fallbackUsed = true;
      } else {
        throw error;
      }
    }

    // Process response
    const processedCaption = processCaption(response.content);
    const qualityScore = calculateQualityScore(processedCaption, request);
    const brandVoiceMatch = calculateBrandVoiceMatch(processedCaption, request.brandVoice);

    return {
      success: true,
      caption: processedCaption.text,
      hashtags: processedCaption.hashtags,
      emojis: processedCaption.emojis,
      metadata: {
        aiProvider: fallbackUsed ? AIProvider.ANTHROPIC : aiProvider,
        model: response.model,
        cost: response.cost,
        generationTime: Date.now() - startTime,
        qualityScore,
        brandVoiceMatch,
        fallbackUsed,
      },
    };
  } catch (error) {
    console.error('Caption generation failed:', error);
    
    return {
      success: false,
      metadata: {
        aiProvider: request.preferences?.aiProvider || AIProvider.GOOGLE,
        model: 'unknown',
        cost: 0,
        generationTime: Date.now() - startTime,
        fallbackUsed: false,
      },
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

function selectOptimalProvider(request: GenerationRequest): AIProvider {
  // If user specifies provider, use it
  if (request.preferences?.aiProvider) {
    return request.preferences.aiProvider;
  }

  // Cost-based selection for most users
  const hasComplexRequirements = !!(
    request.brandVoice ||
    request.imageAnalysis ||
    request.preferences?.temperature !== undefined
  );

  if (hasComplexRequirements) {
    return AIProvider.ANTHROPIC; // Best balance of quality and cost
  } else {
    return AIProvider.GOOGLE; // Most cost-effective for simple requests
  }
}

function selectOptimalModel(provider: AIProvider, request: GenerationRequest): string {
  const complexity = determineComplexity(request);
  return MODEL_SELECTION[provider][complexity];
}

function determineComplexity(request: GenerationRequest): 'simple' | 'complex' | 'creative' {
  let complexityScore = 0;

  // Brand voice adds complexity
  if (request.brandVoice) complexityScore += 1;
  
  // Image analysis adds complexity
  if (request.imageAnalysis) complexityScore += 1;
  
  // Certain platforms require more creativity
  const creativePlatforms = [Platform.INSTAGRAM_REELS, Platform.TIKTOK_POST];
  if (creativePlatforms.includes(request.platform)) complexityScore += 1;
  
  // Custom preferences suggest advanced usage
  if (request.preferences?.temperature || request.preferences?.maxTokens) {
    complexityScore += 1;
  }

  if (complexityScore >= 3) return 'creative';
  if (complexityScore >= 1) return 'complex';
  return 'simple';
}

async function executeGeneration(provider: AIProvider, params: any) {
  switch (provider) {
    case AIProvider.OPENAI:
      return await OpenAI.generateCaption(params);
    case AIProvider.ANTHROPIC:
      return await Anthropic.generateCaption(params);
    case AIProvider.GOOGLE:
      return await Google.generateCaption(params);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function formatBrandVoice(brandVoice?: GenerationRequest['brandVoice']): string | undefined {
  if (!brandVoice) return undefined;

  return `
BRAND VOICE: ${brandVoice.name} (${brandVoice.type})

DESCRIPTION: ${brandVoice.description || 'Custom brand voice'}

TONE GUIDELINES: ${brandVoice.toneGuidelines || 'Maintain consistent voice and personality'}

EXAMPLE CONTENT:
${brandVoice.examples.map((example, i) => `${i + 1}. ${example}`).join('\n')}

KEY KEYWORDS: ${brandVoice.keywords.join(', ')}

Ensure the generated caption perfectly matches this brand voice while optimizing for platform engagement.
  `.trim();
}

function processCaption(rawCaption: string) {
  // Extract hashtags
  const hashtagRegex = /#[\w]+/g;
  const hashtags = rawCaption.match(hashtagRegex)?.map(tag => tag.slice(1)) || [];
  
  // Extract emojis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojis = rawCaption.match(emojiRegex) || [];
  
  // Clean caption text
  const text = rawCaption.trim();

  return {
    text,
    hashtags: [...new Set(hashtags)], // Remove duplicates
    emojis: [...new Set(emojis)], // Remove duplicates
  };
}

function calculateQualityScore(
  caption: { text: string; hashtags: string[]; emojis: string[] },
  request: GenerationRequest
): number {
  let score = 0.7; // Base score

  // Platform-specific optimizations
  const platformOptimal = checkPlatformOptimization(caption, request.platform);
  score += platformOptimal * 0.2;

  // Engagement elements
  if (caption.hashtags.length > 0) score += 0.1;
  if (caption.emojis.length > 0 && caption.emojis.length <= 5) score += 0.1;
  
  // Content quality indicators
  if (caption.text.includes('?')) score += 0.05; // Questions drive engagement
  if (caption.text.toLowerCase().includes('comment')) score += 0.05; // CTA present
  
  return Math.min(score, 1.0);
}

function calculateBrandVoiceMatch(
  caption: { text: string; hashtags: string[]; emojis: string[] },
  brandVoice?: GenerationRequest['brandVoice']
): number {
  if (!brandVoice) return 1.0;

  let matchScore = 0.7; // Base score

  // Keyword presence
  const keywordMatches = brandVoice.keywords.filter(keyword =>
    caption.text.toLowerCase().includes(keyword.toLowerCase())
  );
  matchScore += (keywordMatches.length / brandVoice.keywords.length) * 0.3;

  return Math.min(matchScore, 1.0);
}

function checkPlatformOptimization(
  caption: { text: string; hashtags: string[]; emojis: string[] },
  platform: Platform
): number {
  const length = caption.text.length;
  const hashtagCount = caption.hashtags.length;
  
  const platformRules = {
    [Platform.INSTAGRAM_FEED]: {
      optimalLength: [50, 300],
      hashtagRange: [5, 15],
    },
    [Platform.INSTAGRAM_STORIES]: {
      optimalLength: [20, 100],
      hashtagRange: [2, 5],
    },
    [Platform.TWITTER_POST]: {
      optimalLength: [71, 280],
      hashtagRange: [1, 2],
    },
    [Platform.LINKEDIN_POST]: {
      optimalLength: [150, 300],
      hashtagRange: [3, 5],
    },
    [Platform.TIKTOK_POST]: {
      optimalLength: [50, 150],
      hashtagRange: [3, 5],
    },
    [Platform.FACEBOOK_POST]: {
      optimalLength: [40, 80],
      hashtagRange: [1, 2],
    },
  };

  const rules = platformRules[platform] || platformRules[Platform.INSTAGRAM_FEED];
  
  let score = 0;
  
  // Length optimization
  if (length >= rules.optimalLength[0] && length <= rules.optimalLength[1]) {
    score += 0.5;
  } else {
    score += Math.max(0, 0.5 - Math.abs(length - rules.optimalLength[1]) / 100);
  }
  
  // Hashtag optimization
  if (hashtagCount >= rules.hashtagRange[0] && hashtagCount <= rules.hashtagRange[1]) {
    score += 0.5;
  } else {
    score += Math.max(0, 0.5 - Math.abs(hashtagCount - rules.hashtagRange[1]) / 5);
  }
  
  return Math.min(score, 1.0);
}

// Utility function for cost estimation
export function estimateGenerationCost(request: GenerationRequest): number {
  const provider = selectOptimalProvider(request);
  const baseMultiplier = PROVIDER_COSTS[provider];
  
  // Complexity multiplier
  const complexity = determineComplexity(request);
  const complexityMultipliers = {
    simple: 1.0,
    complex: 1.5,
    creative: 2.0,
  };
  
  return baseMultiplier * complexityMultipliers[complexity];
}