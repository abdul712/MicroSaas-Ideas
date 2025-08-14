import { SocialPlatform, ContentType } from '@prisma/client';

// Platform-specific optimization engine
export interface PlatformConstraints {
  maxLength: number;
  optimalLength: number;
  maxHashtags: number;
  optimalHashtags: number;
  allowsEmojis: boolean;
  allowsMentions: boolean;
  allowsLineBreaks: boolean;
  requiresHashtags: boolean;
  style: string;
  features: string[];
}

export interface OptimizationResult {
  optimizedCaption: string;
  suggestedHashtags: string[];
  characterCount: number;
  hashtagCount: number;
  compliance: {
    lengthCompliant: boolean;
    hashtagCompliant: boolean;
    formatCompliant: boolean;
  };
  suggestions: string[];
  score: number; // 0-100 optimization score
}

// Platform configuration database
export const PLATFORM_CONSTRAINTS: Record<SocialPlatform, PlatformConstraints> = {
  [SocialPlatform.INSTAGRAM]: {
    maxLength: 2200,
    optimalLength: 125,
    maxHashtags: 30,
    optimalHashtags: 11,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: true,
    requiresHashtags: true,
    style: 'visual-storytelling, community-focused, aspirational',
    features: [
      'story-driven-captions',
      'user-generated-content',
      'behind-the-scenes',
      'lifestyle-integration',
      'call-to-action',
      'hashtag-communities'
    ]
  },
  [SocialPlatform.FACEBOOK]: {
    maxLength: 63206,
    optimalLength: 40,
    maxHashtags: 5,
    optimalHashtags: 2,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: true,
    requiresHashtags: false,
    style: 'conversational, personal, community-building',
    features: [
      'conversation-starters',
      'questions-engagement',
      'storytelling',
      'community-building',
      'emotional-connection',
      'event-promotion'
    ]
  },
  [SocialPlatform.TWITTER]: {
    maxLength: 280,
    optimalLength: 71,
    maxHashtags: 2,
    optimalHashtags: 1,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: true,
    requiresHashtags: false,
    style: 'concise, witty, real-time, news-focused',
    features: [
      'trending-topics',
      'real-time-commentary',
      'thread-worthy',
      'retweet-optimized',
      'news-hooks',
      'viral-potential'
    ]
  },
  [SocialPlatform.LINKEDIN]: {
    maxLength: 3000,
    optimalLength: 150,
    maxHashtags: 5,
    optimalHashtags: 3,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: true,
    requiresHashtags: false,
    style: 'professional, insights-driven, thought-leadership',
    features: [
      'industry-insights',
      'professional-development',
      'thought-leadership',
      'networking',
      'career-advice',
      'business-strategy'
    ]
  },
  [SocialPlatform.TIKTOK]: {
    maxLength: 2200,
    optimalLength: 100,
    maxHashtags: 20,
    optimalHashtags: 5,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: true,
    requiresHashtags: true,
    style: 'trendy, entertaining, authentic, viral',
    features: [
      'trending-sounds',
      'viral-challenges',
      'behind-the-scenes',
      'tutorials',
      'entertainment',
      'youth-culture'
    ]
  },
  [SocialPlatform.YOUTUBE]: {
    maxLength: 5000,
    optimalLength: 200,
    maxHashtags: 15,
    optimalHashtags: 8,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: true,
    requiresHashtags: false,
    style: 'descriptive, educational, engaging, searchable',
    features: [
      'video-description',
      'seo-optimized',
      'educational-content',
      'call-to-subscribe',
      'engagement-hooks',
      'series-promotion'
    ]
  },
  [SocialPlatform.PINTEREST]: {
    maxLength: 500,
    optimalLength: 200,
    maxHashtags: 20,
    optimalHashtags: 10,
    allowsEmojis: true,
    allowsMentions: true,
    allowsLineBreaks: false,
    requiresHashtags: true,
    style: 'descriptive, inspirational, search-optimized',
    features: [
      'seo-keywords',
      'inspirational',
      'how-to-content',
      'seasonal-relevance',
      'lifestyle-focused',
      'visual-description'
    ]
  }
};

// Content type specific adjustments
const CONTENT_TYPE_ADJUSTMENTS: Record<ContentType, Partial<PlatformConstraints>> = {
  [ContentType.IMAGE]: {
    optimalLength: 125, // Standard image post length
  },
  [ContentType.VIDEO]: {
    optimalLength: 150, // Videos benefit from more context
  },
  [ContentType.CAROUSEL]: {
    optimalLength: 100, // Carousel posts should be concise per slide
  },
  [ContentType.STORY]: {
    optimalLength: 50, // Stories are quick consumption
    maxHashtags: 5,
    optimalHashtags: 2
  },
  [ContentType.REEL]: {
    optimalLength: 75, // Reels are entertainment-focused
    requiresHashtags: true
  },
  [ContentType.TEXT]: {
    optimalLength: 200, // Text posts can be longer
  }
};

// Trending hashtag database (simplified - in production this would be dynamic)
const TRENDING_HASHTAGS = {
  [SocialPlatform.INSTAGRAM]: [
    '#love', '#instagood', '#photooftheday', '#fashion', '#beautiful', 
    '#happy', '#cute', '#tbt', '#like4like', '#followme', '#picoftheday', 
    '#follow', '#me', '#selfie', '#summer', '#art', '#instadaily', '#friends',
    '#repost', '#nature', '#girl', '#fun', '#style', '#smile', '#food',
    '#instalike', '#family', '#photo', '#life', '#likeforlike'
  ],
  [SocialPlatform.FACEBOOK]: [
    '#love', '#life', '#happy', '#friends', '#family', '#motivation', 
    '#inspiration', '#blessed', '#grateful', '#memories', '#moments',
    '#community', '#support', '#care', '#kindness'
  ],
  [SocialPlatform.TWITTER]: [
    '#breakingnews', '#trending', '#mondaymotivation', '#throwbackthursday',
    '#fridayfeeling', '#weekendvibes', '#tech', '#innovation', '#startup',
    '#business', '#leadership', '#success', '#growth', '#mindset'
  ],
  [SocialPlatform.LINKEDIN]: [
    '#leadership', '#business', '#career', '#professional', '#networking',
    '#innovation', '#technology', '#growth', '#success', '#motivation',
    '#strategy', '#marketing', '#sales', '#entrepreneurship', '#productivity'
  ],
  [SocialPlatform.TIKTOK]: [
    '#fyp', '#foryou', '#viral', '#trending', '#dance', '#comedy', '#funny',
    '#challenge', '#duet', '#reaction', '#tutorial', '#lifestyle', '#fashion',
    '#beauty', '#food', '#travel', '#music', '#art', '#pets', '#fitness'
  ],
  [SocialPlatform.YOUTUBE]: [
    '#youtube', '#subscribe', '#video', '#vlog', '#tutorial', '#review',
    '#gaming', '#music', '#comedy', '#educational', '#howto', '#tips',
    '#guide', '#entertainment', '#lifestyle'
  ],
  [SocialPlatform.PINTEREST]: [
    '#diy', '#recipe', '#fashion', '#home', '#decor', '#wedding', '#fitness',
    '#beauty', '#travel', '#inspiration', '#quotes', '#art', '#photography',
    '#design', '#lifestyle', '#food', '#garden', '#crafts', '#style'
  ]
};

// Main optimization function
export function optimizeCaption(
  caption: string,
  platform: SocialPlatform,
  contentType: ContentType = ContentType.IMAGE,
  options: {
    includeHashtags?: boolean;
    brandHashtags?: string[];
    targetAudience?: string;
    industry?: string;
  } = {}
): OptimizationResult {
  
  const constraints = getAdjustedConstraints(platform, contentType);
  const originalLength = caption.length;
  
  // Step 1: Format optimization
  let optimizedCaption = formatForPlatform(caption, constraints);
  
  // Step 2: Length optimization
  optimizedCaption = optimizeLength(optimizedCaption, constraints);
  
  // Step 3: Extract and optimize hashtags
  const { caption: captionWithoutHashtags, hashtags: extractedHashtags } = 
    extractHashtags(optimizedCaption);
  
  // Step 4: Generate suggested hashtags
  const suggestedHashtags = generateHashtags(
    captionWithoutHashtags,
    platform,
    extractedHashtags,
    options.brandHashtags || [],
    options.industry
  );
  
  // Step 5: Compliance check
  const compliance = checkCompliance(
    optimizedCaption,
    suggestedHashtags,
    constraints
  );
  
  // Step 6: Generate suggestions
  const suggestions = generateSuggestions(
    optimizedCaption,
    suggestedHashtags,
    constraints,
    compliance
  );
  
  // Step 7: Calculate optimization score
  const score = calculateOptimizationScore(
    optimizedCaption,
    suggestedHashtags,
    constraints,
    compliance
  );
  
  return {
    optimizedCaption,
    suggestedHashtags: suggestedHashtags.slice(0, constraints.optimalHashtags),
    characterCount: optimizedCaption.length,
    hashtagCount: suggestedHashtags.length,
    compliance,
    suggestions,
    score
  };
}

// Helper functions
function getAdjustedConstraints(
  platform: SocialPlatform, 
  contentType: ContentType
): PlatformConstraints {
  const baseConstraints = PLATFORM_CONSTRAINTS[platform];
  const adjustments = CONTENT_TYPE_ADJUSTMENTS[contentType];
  
  return {
    ...baseConstraints,
    ...adjustments
  };
}

function formatForPlatform(caption: string, constraints: PlatformConstraints): string {
  let formatted = caption.trim();
  
  // Handle line breaks
  if (!constraints.allowsLineBreaks) {
    formatted = formatted.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
  }
  
  // Clean up excessive spacing
  formatted = formatted.replace(/\s+/g, ' ');
  
  // Handle emojis (remove if not allowed)
  if (!constraints.allowsEmojis) {
    formatted = formatted.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
  }
  
  return formatted.trim();
}

function optimizeLength(caption: string, constraints: PlatformConstraints): string {
  if (caption.length <= constraints.optimalLength) {
    return caption;
  }
  
  if (caption.length <= constraints.maxLength) {
    return caption; // Within limits, no need to truncate
  }
  
  // Smart truncation - try to break at sentence boundaries
  const sentences = caption.split(/[.!?]+/).filter(s => s.trim());
  let optimized = '';
  
  for (const sentence of sentences) {
    const testLength = (optimized + sentence + '. ').length;
    if (testLength <= constraints.maxLength - 20) { // Leave room for hashtags
      optimized += sentence + '. ';
    } else {
      break;
    }
  }
  
  return optimized.trim();
}

function extractHashtags(caption: string): { caption: string; hashtags: string[] } {
  const hashtagRegex = /#[\w\d_]+/g;
  const hashtags = caption.match(hashtagRegex) || [];
  const captionWithoutHashtags = caption.replace(hashtagRegex, '').replace(/\s+/g, ' ').trim();
  
  return {
    caption: captionWithoutHashtags,
    hashtags: hashtags.map(h => h.toLowerCase())
  };
}

function generateHashtags(
  caption: string,
  platform: SocialPlatform,
  existingHashtags: string[],
  brandHashtags: string[],
  industry?: string
): string[] {
  const trending = TRENDING_HASHTAGS[platform] || [];
  const suggested = new Set<string>();
  
  // Add existing hashtags (cleaned)
  existingHashtags.forEach(tag => suggested.add(tag));
  
  // Add brand hashtags
  brandHashtags.forEach(tag => {
    if (!tag.startsWith('#')) tag = '#' + tag;
    suggested.add(tag.toLowerCase());
  });
  
  // Keyword extraction for content-relevant hashtags
  const keywords = extractKeywords(caption);
  keywords.forEach(keyword => {
    suggested.add('#' + keyword.toLowerCase());
  });
  
  // Add trending hashtags relevant to platform
  const relevantTrending = selectRelevantTrending(caption, trending, industry);
  relevantTrending.forEach(tag => suggested.add(tag));
  
  // Industry-specific hashtags
  if (industry) {
    const industryHashtags = getIndustryHashtags(industry);
    industryHashtags.forEach(tag => suggested.add(tag));
  }
  
  return Array.from(suggested);
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production, use NLP libraries
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 5); // Top 5 keywords
}

function selectRelevantTrending(
  caption: string,
  trending: string[],
  industry?: string
): string[] {
  // Simple relevance scoring - in production, use semantic similarity
  const captionWords = new Set(caption.toLowerCase().split(/\s+/));
  const relevant: string[] = [];
  
  for (const tag of trending) {
    const tagWord = tag.replace('#', '');
    if (captionWords.has(tagWord) || caption.toLowerCase().includes(tagWord)) {
      relevant.push(tag);
    }
  }
  
  return relevant.slice(0, 5); // Top 5 relevant trending
}

function getIndustryHashtags(industry: string): string[] {
  const industryMap: Record<string, string[]> = {
    'fitness': ['#fitness', '#workout', '#health', '#gym', '#wellness', '#motivation'],
    'food': ['#food', '#recipe', '#cooking', '#delicious', '#foodie', '#chef'],
    'travel': ['#travel', '#adventure', '#wanderlust', '#explore', '#vacation'],
    'fashion': ['#fashion', '#style', '#outfit', '#ootd', '#trendy', '#design'],
    'tech': ['#tech', '#innovation', '#digital', '#technology', '#startup', '#ai'],
    'business': ['#business', '#entrepreneur', '#success', '#growth', '#strategy'],
    'beauty': ['#beauty', '#skincare', '#makeup', '#selfcare', '#cosmetics'],
    'education': ['#education', '#learning', '#knowledge', '#teaching', '#skills']
  };
  
  return industryMap[industry.toLowerCase()] || [];
}

function checkCompliance(
  caption: string,
  hashtags: string[],
  constraints: PlatformConstraints
): OptimizationResult['compliance'] {
  const totalLength = caption.length + hashtags.join(' ').length;
  
  return {
    lengthCompliant: totalLength <= constraints.maxLength,
    hashtagCompliant: hashtags.length <= constraints.maxHashtags,
    formatCompliant: true // Add more specific format checks as needed
  };
}

function generateSuggestions(
  caption: string,
  hashtags: string[],
  constraints: PlatformConstraints,
  compliance: OptimizationResult['compliance']
): string[] {
  const suggestions: string[] = [];
  
  if (!compliance.lengthCompliant) {
    suggestions.push(`Consider shortening your caption. Current: ${caption.length}, Max: ${constraints.maxLength}`);
  }
  
  if (caption.length < constraints.optimalLength * 0.5) {
    suggestions.push('Your caption might be too short. Consider adding more context or a call-to-action.');
  }
  
  if (hashtags.length < constraints.optimalHashtags && constraints.requiresHashtags) {
    suggestions.push(`Add more hashtags for better discoverability. Optimal: ${constraints.optimalHashtags}`);
  }
  
  if (hashtags.length > constraints.optimalHashtags) {
    suggestions.push(`Consider using fewer hashtags for better engagement. Optimal: ${constraints.optimalHashtags}`);
  }
  
  // Platform-specific suggestions
  if (constraints.features.includes('call-to-action') && !hasCallToAction(caption)) {
    suggestions.push('Consider adding a call-to-action to increase engagement.');
  }
  
  if (constraints.features.includes('questions-engagement') && !hasQuestion(caption)) {
    suggestions.push('Try ending with a question to encourage comments.');
  }
  
  return suggestions;
}

function calculateOptimizationScore(
  caption: string,
  hashtags: string[],
  constraints: PlatformConstraints,
  compliance: OptimizationResult['compliance']
): number {
  let score = 0;
  
  // Length optimization (30 points)
  const lengthRatio = caption.length / constraints.optimalLength;
  if (lengthRatio >= 0.5 && lengthRatio <= 1.2) {
    score += 30;
  } else if (lengthRatio >= 0.3 && lengthRatio <= 1.5) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Hashtag optimization (25 points)
  const hashtagRatio = hashtags.length / constraints.optimalHashtags;
  if (hashtagRatio >= 0.8 && hashtagRatio <= 1.2) {
    score += 25;
  } else if (hashtagRatio >= 0.5 && hashtagRatio <= 1.5) {
    score += 15;
  } else {
    score += 5;
  }
  
  // Compliance (25 points)
  if (compliance.lengthCompliant && compliance.hashtagCompliant && compliance.formatCompliant) {
    score += 25;
  } else {
    const complianceCount = [compliance.lengthCompliant, compliance.hashtagCompliant, compliance.formatCompliant]
      .filter(Boolean).length;
    score += (complianceCount / 3) * 25;
  }
  
  // Engagement features (20 points)
  let engagementScore = 0;
  if (hasCallToAction(caption)) engagementScore += 5;
  if (hasQuestion(caption)) engagementScore += 5;
  if (hasEmojis(caption)) engagementScore += 3;
  if (hasMentions(caption)) engagementScore += 2;
  if (hasHashtags(caption)) engagementScore += 5;
  
  score += Math.min(engagementScore, 20);
  
  return Math.round(Math.min(score, 100));
}

// Utility functions for engagement detection
function hasCallToAction(caption: string): boolean {
  const ctas = ['click', 'visit', 'check', 'follow', 'subscribe', 'like', 'comment', 'share', 'tag', 'try', 'buy', 'shop', 'learn', 'discover', 'explore'];
  const lowerCaption = caption.toLowerCase();
  return ctas.some(cta => lowerCaption.includes(cta));
}

function hasQuestion(caption: string): boolean {
  return caption.includes('?') || 
    /\b(what|how|why|when|where|which|who|do you|have you|are you|will you|would you|can you)\b/i.test(caption);
}

function hasEmojis(caption: string): boolean {
  return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(caption);
}

function hasMentions(caption: string): boolean {
  return /@\w+/.test(caption);
}

function hasHashtags(caption: string): boolean {
  return /#\w+/.test(caption);
}