import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateEmbedding } from '@/lib/ai/openai';
import { z } from 'zod';

const analyzeBrandVoiceSchema = z.object({
  content: z.string().min(50, 'Content must be at least 50 characters for analysis'),
  compareWith: z.array(z.string()).optional(), // Brand voice IDs to compare with
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = analyzeBrandVoiceSchema.parse(body);

    // Analyze the content using AI
    const contentAnalysis = await analyzeContentStyle(validatedData.content);

    // If brand voice IDs provided, compare similarity
    let brandVoiceComparisons = [];
    if (validatedData.compareWith && validatedData.compareWith.length > 0) {
      // Get brand voices user has access to
      const { prisma } = await import('@/lib/prisma');
      
      const brandVoices = await prisma.brandVoice.findMany({
        where: {
          id: { in: validatedData.compareWith },
          OR: [
            { userId: session.user.id },
            {
              organization: {
                members: {
                  some: {
                    userId: session.user.id,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
          examples: true,
          keywords: true,
          embeddings: true,
        },
      });

      // Calculate similarity scores
      for (const brandVoice of brandVoices) {
        const similarity = await calculateBrandVoiceSimilarity(
          validatedData.content,
          brandVoice
        );
        
        brandVoiceComparisons.push({
          brandVoiceId: brandVoice.id,
          brandVoiceName: brandVoice.name,
          brandVoiceType: brandVoice.type,
          similarityScore: similarity.score,
          matchingElements: similarity.matchingElements,
          suggestions: similarity.suggestions,
        });
      }

      // Sort by similarity score
      brandVoiceComparisons.sort((a, b) => b.similarityScore - a.similarityScore);
    }

    return NextResponse.json({
      success: true,
      data: {
        contentAnalysis,
        brandVoiceComparisons,
      },
    });

  } catch (error) {
    console.error('Brand voice analysis error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function analyzeContentStyle(content: string) {
  // Analyze tone and style characteristics
  const analysis = {
    toneAnalysis: analyzeTone(content),
    styleMetrics: analyzeStyle(content),
    keywordExtraction: extractKeywords(content),
    engagementElements: analyzeEngagementElements(content),
    readabilityScore: calculateReadabilityScore(content),
    platformSuitability: analyzePlatformSuitability(content),
  };

  return analysis;
}

function analyzeTone(content: string) {
  const toneIndicators = {
    professional: ['expertise', 'insights', 'strategic', 'analysis', 'research', 'data'],
    casual: ['hey', 'awesome', 'cool', 'totally', 'guys', 'folks'],
    friendly: ['thanks', 'appreciate', 'love', 'enjoy', 'happy', 'welcome'],
    authoritative: ['proven', 'expert', 'leading', 'authority', 'established', 'renowned'],
    humorous: ['lol', 'haha', 'funny', 'hilarious', 'joke', 'laugh'],
    inspirational: ['achieve', 'dream', 'inspire', 'motivate', 'believe', 'possible'],
    technical: ['implementation', 'optimize', 'algorithm', 'framework', 'integration'],
    conversational: ['you', 'your', 'we', 'us', 'let\'s', 'together'],
  };

  const contentLower = content.toLowerCase();
  const toneScores: Record<string, number> = {};

  for (const [tone, keywords] of Object.entries(toneIndicators)) {
    const matches = keywords.filter(keyword => 
      contentLower.includes(keyword)
    ).length;
    toneScores[tone] = matches / keywords.length;
  }

  // Find dominant tone
  const dominantTone = Object.entries(toneScores)
    .sort(([,a], [,b]) => b - a)[0];

  return {
    dominantTone: dominantTone[0],
    confidence: dominantTone[1],
    allScores: toneScores,
  };
}

function analyzeStyle(content: string) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  
  // Count various style elements
  const questionCount = (content.match(/\?/g) || []).length;
  const exclamationCount = (content.match(/!/g) || []).length;
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  const mentionCount = (content.match(/@\w+/g) || []).length;
  const urlCount = (content.match(/https?:\/\/[^\s]+/g) || []).length;

  const averageWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const averageCharsPerWord = words.length > 0 ? content.replace(/\s+/g, '').length / words.length : 0;

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    averageWordsPerSentence,
    averageCharsPerWord,
    questionCount,
    exclamationCount,
    emojiCount,
    hashtagCount,
    mentionCount,
    urlCount,
    hasCallToAction: /comment|share|follow|like|subscribe|click|visit|check|try/i.test(content),
    hasPersonalPronouns: /\b(i|we|you|my|our|your)\b/i.test(content),
  };
}

function extractKeywords(content: string) {
  // Simple keyword extraction (in production, use NLP libraries)
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'this', 'that', 'these', 'those', 'can', 'will', 'would', 'could', 'should',
  ]);

  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Count word frequency
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Return top keywords
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));
}

function analyzeEngagementElements(content: string) {
  const elements = {
    hasQuestion: /\?/.test(content),
    hasCallToAction: /comment|share|follow|like|subscribe|click|visit|check|try|swipe|tap/i.test(content),
    hasEmojis: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(content),
    hasHashtags: /#\w+/.test(content),
    hasUrgency: /now|today|limited|hurry|quick|fast|immediate/i.test(content),
    hasNumbers: /\d+/.test(content),
    hasPersonalization: /you|your/i.test(content),
    hasSocialProof: /customers|users|people|everyone|thousands|millions/i.test(content),
    hasStorytelling: /story|journey|experience|remember|imagine/i.test(content),
  };

  const score = Object.values(elements).filter(Boolean).length / Object.keys(elements).length;

  return {
    elements,
    engagementScore: score,
  };
}

function calculateReadabilityScore(content: string) {
  // Simplified Flesch Reading Ease calculation
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);

  if (sentences.length === 0 || words.length === 0) return 0;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  return Math.max(0, Math.min(100, fleschScore));
}

function countSyllables(word: string): number {
  // Simple syllable counting
  const vowels = 'aeiouy';
  let syllableCount = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i].toLowerCase());
    if (isVowel && !previousWasVowel) {
      syllableCount++;
    }
    previousWasVowel = isVowel;
  }

  // Handle silent e
  if (word.endsWith('e') && syllableCount > 1) {
    syllableCount--;
  }

  return Math.max(1, syllableCount);
}

function analyzePlatformSuitability(content: string) {
  const length = content.length;
  const wordCount = content.split(/\s+/).length;
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;

  const platformScores = {
    INSTAGRAM_FEED: calculatePlatformScore(length, hashtagCount, emojiCount, { min: 50, max: 300, optimalHashtags: 10, optimalEmojis: 3 }),
    INSTAGRAM_STORIES: calculatePlatformScore(length, hashtagCount, emojiCount, { min: 20, max: 100, optimalHashtags: 3, optimalEmojis: 2 }),
    TWITTER_POST: calculatePlatformScore(length, hashtagCount, emojiCount, { min: 50, max: 280, optimalHashtags: 2, optimalEmojis: 1 }),
    LINKEDIN_POST: calculatePlatformScore(wordCount * 5, hashtagCount, emojiCount, { min: 150, max: 300, optimalHashtags: 4, optimalEmojis: 1 }),
    TIKTOK_POST: calculatePlatformScore(length, hashtagCount, emojiCount, { min: 50, max: 150, optimalHashtags: 4, optimalEmojis: 2 }),
    FACEBOOK_POST: calculatePlatformScore(wordCount * 5, hashtagCount, emojiCount, { min: 40, max: 80, optimalHashtags: 1, optimalEmojis: 2 }),
  };

  return platformScores;
}

function calculatePlatformScore(length: number, hashtags: number, emojis: number, rules: any): number {
  let score = 0.5; // Base score

  // Length score
  if (length >= rules.min && length <= rules.max) {
    score += 0.3;
  } else {
    const penalty = Math.abs(length - rules.max) / rules.max;
    score += 0.3 * Math.max(0, 1 - penalty);
  }

  // Hashtag score
  const hashtagDiff = Math.abs(hashtags - rules.optimalHashtags);
  score += 0.1 * Math.max(0, 1 - hashtagDiff / rules.optimalHashtags);

  // Emoji score
  const emojiDiff = Math.abs(emojis - rules.optimalEmojis);
  score += 0.1 * Math.max(0, 1 - emojiDiff / Math.max(1, rules.optimalEmojis));

  return Math.min(1, score);
}

async function calculateBrandVoiceSimilarity(content: string, brandVoice: any) {
  try {
    // Generate embedding for the content
    const contentEmbedding = await generateEmbedding(content);
    
    // Parse brand voice embeddings if available
    let similarity = 0;
    if (brandVoice.embeddings) {
      const brandEmbedding = JSON.parse(brandVoice.embeddings);
      similarity = calculateCosineSimilarity(contentEmbedding, brandEmbedding);
    }

    // Analyze matching elements
    const matchingElements = [];
    const suggestions = [];

    // Check keyword matches
    const contentLower = content.toLowerCase();
    const matchingKeywords = brandVoice.keywords.filter((keyword: string) =>
      contentLower.includes(keyword.toLowerCase())
    );

    if (matchingKeywords.length > 0) {
      matchingElements.push(`Keywords: ${matchingKeywords.join(', ')}`);
    } else {
      suggestions.push(`Consider including brand keywords: ${brandVoice.keywords.slice(0, 3).join(', ')}`);
    }

    // Check example similarity
    const exampleSimilarities = brandVoice.examples.map((example: string) => {
      const commonWords = findCommonWords(content, example);
      return commonWords.length;
    });

    const maxExampleSimilarity = Math.max(...exampleSimilarities);
    if (maxExampleSimilarity > 2) {
      matchingElements.push(`Similar phrasing to brand examples`);
    } else {
      suggestions.push(`Review brand voice examples for style consistency`);
    }

    return {
      score: similarity * 0.7 + (matchingKeywords.length / brandVoice.keywords.length) * 0.3,
      matchingElements,
      suggestions,
    };

  } catch (error) {
    console.error('Similarity calculation error:', error);
    return {
      score: 0,
      matchingElements: [],
      suggestions: ['Unable to calculate similarity - please try again'],
    };
  }
}

function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function findCommonWords(text1: string, text2: string): string[] {
  const words1 = text1.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  
  return words1.filter(word => words2.includes(word));
}