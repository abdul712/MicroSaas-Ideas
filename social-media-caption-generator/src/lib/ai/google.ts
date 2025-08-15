import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error('Missing GOOGLE_AI_API_KEY environment variable');
}

export const googleAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

export interface GoogleGenerationParams {
  prompt: string;
  platform: string;
  brandVoice?: string;
  imageAnalysis?: any;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: number;
  model: string;
  finishReason: string;
}

// Token pricing per 1K tokens (as of 2024)
const PRICING = {
  'gemini-pro': { input: 0.0005, output: 0.0015 },
  'gemini-pro-vision': { input: 0.0005, output: 0.0015 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.00375 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
};

export async function generateCaption(params: GoogleGenerationParams): Promise<AIResponse> {
  const {
    prompt,
    platform,
    brandVoice,
    imageAnalysis,
    maxTokens = 300,
    temperature = 0.7,
    model = 'gemini-1.5-flash',
  } = params;

  const systemPrompt = buildSystemPrompt(platform, brandVoice);
  const userPrompt = buildUserPrompt(prompt, imageAnalysis);
  
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

  try {
    const genModel = googleAI.getGenerativeModel({ 
      model,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await genModel.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    // Estimate token usage (Google doesn't provide exact counts)
    const estimatedPromptTokens = Math.ceil(fullPrompt.length / 4);
    const estimatedCompletionTokens = Math.ceil(content.length / 4);
    const totalTokens = estimatedPromptTokens + estimatedCompletionTokens;

    // Calculate cost
    const modelPricing = PRICING[model as keyof typeof PRICING] || PRICING['gemini-1.5-flash'];
    const cost = (
      (estimatedPromptTokens / 1000) * modelPricing.input +
      (estimatedCompletionTokens / 1000) * modelPricing.output
    );

    return {
      content,
      usage: {
        promptTokens: estimatedPromptTokens,
        completionTokens: estimatedCompletionTokens,
        totalTokens,
      },
      cost,
      model,
      finishReason: response.candidates?.[0]?.finishReason || 'STOP',
    };
  } catch (error) {
    console.error('Google AI generation error:', error);
    throw new Error(`Google AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildSystemPrompt(platform: string, brandVoice?: string): string {
  const platformSpecs = getPlatformSpecifications(platform);
  
  let prompt = `You are an elite social media content strategist with expertise in ${platform} and viral content creation.

PLATFORM MASTERY:
${platformSpecs}

CONTENT CREATION EXCELLENCE:
- Psychology-driven engagement strategies
- Viral content pattern recognition
- Algorithm optimization techniques
- Community building through content
- Trend integration and adaptation
- Multi-generational audience appeal
- Cultural sensitivity and inclusivity

PERFORMANCE OPTIMIZATION:
- Hook writing for maximum retention
- Emotional trigger utilization
- Social proof integration
- Scarcity and urgency techniques
- Community conversation starters
- Shareable content creation`;

  if (brandVoice) {
    prompt += `\n\nBRAND VOICE ALIGNMENT:
${brandVoice}

Maintain perfect brand voice consistency while maximizing platform-specific engagement potential.`;
  }

  return prompt;
}

function buildUserPrompt(prompt: string, imageAnalysis?: any): string {
  let userPrompt = `Generate a high-performing social media caption for: ${prompt}`;

  if (imageAnalysis) {
    userPrompt += `\n\nIMAGE INTELLIGENCE:
Visual Elements: ${imageAnalysis.objects?.join(', ') || 'Various elements'}
Scene Context: ${imageAnalysis.scene || 'Professional setting'}
Color Palette: ${imageAnalysis.colors?.join(', ') || 'Multiple colors'}
Text Elements: ${imageAnalysis.text || 'No text overlay'}
Human Presence: ${imageAnalysis.faces ? `${imageAnalysis.faces} person(s)` : 'No people visible'}
Emotional Tone: ${imageAnalysis.mood || 'Neutral/Professional'}

Leverage these visual elements to create contextually relevant and engaging caption content.`;
  }

  userPrompt += `\n\nOUTPUT REQUIREMENTS:
- Deliver only the final caption with integrated hashtags
- No meta-commentary or explanations
- Strategic emoji placement (2-5 emojis)
- Organic hashtag integration
- Compelling opening hook
- Clear call-to-action ending
- Mobile-optimized formatting
- Engagement-driving language`;

  return userPrompt;
}

function getPlatformSpecifications(platform: string): string {
  const specs = {
    INSTAGRAM_FEED: `
INSTAGRAM FEED MASTERY:
- Character dynamics: 2,200 limit, 125 preview characters are critical
- Engagement optimization: 138-150 characters drive highest interaction
- Hashtag science: 5-15 hashtags, strategic trending/niche mix
- Emoji psychology: 3-5 emojis increase engagement by 48%
- Visual formatting: Line breaks with ••• or spacing improve readability
- Hook psychology: First line determines 80% of engagement
- Algorithm signals: Saves > Shares > Comments > Likes for reach
- Community building: Questions increase comments by 4x
- Optimal timing: 11am-1pm and 7pm-9pm for maximum visibility`,

    INSTAGRAM_STORIES: `
INSTAGRAM STORIES PSYCHOLOGY:
- Attention span: 3-7 seconds average viewing time
- Cognitive load: 100 characters maximum for mobile comprehension
- Urgency triggers: FOMO, limited time, exclusive content
- Interactive engagement: Polls boost completion rates by 67%
- Hashtag limits: 10 maximum, 3-5 optimal for discovery
- Authenticity premium: Behind-scenes content gets 2.3x engagement
- Visual hierarchy: Avoid text over faces, use top/bottom thirds
- Call-to-action: "Swipe up" equivalent drives highest conversion`,

    INSTAGRAM_REELS: `
INSTAGRAM REELS ALGORITHM:
- Hook window: 3-second rule determines 90% of completion rate
- Retention optimization: Keep engaging content in first 50 words
- Hashtag strategy: 3-7 hashtags, trending outweighs niche 3:1
- Format preference: How-to content gets 2.5x more saves
- Audio leverage: Trending sounds boost reach by 200%
- Loop mechanics: Content encouraging rewatches increases distribution
- Educational angle: Tutorial content has highest save rates
- Shareability factors: Relatable, surprising, or useful content`,

    FACEBOOK_POST: `
FACEBOOK ALGORITHM OPTIMIZATION:
- Engagement sweet spot: 40-80 words maximize interaction
- Character ceiling: 63,206 available but shorter performs better
- Hashtag strategy: 1-2 maximum (Instagram strategy backfires here)
- Community focus: Questions generate 5x more comments
- Link strategy: Native uploads outperform external links
- Emotional resonance: Nostalgia and family content performs best
- Timing optimization: 1pm-4pm weekdays for business content
- Meaningful conversations: Algorithm prioritizes lengthy discussions`,

    TWITTER_POST: `
TWITTER/X ENGAGEMENT SCIENCE:
- Character optimization: 71-100 characters get highest engagement
- Hashtag efficiency: 1-2 hashtags maximum for best performance
- Real-time advantage: Breaking news and trends boost visibility 10x
- Thread potential: Multi-tweet content increases follower growth
- Shareability metrics: Quotable insights drive retweets
- Engagement tactics: Controversial opinions increase interaction 300%
- Visual impact: Images increase engagement by 150%
- Timing strategy: Real-time events and live participation crucial`,

    LINKEDIN_POST: `
LINKEDIN PROFESSIONAL ALGORITHM:
- Authority building: Industry expertise content gets 2x engagement
- Optimal length: 150-300 words balance readability with depth
- Hashtag strategy: 3-5 professional hashtags for industry reach
- Network effects: Tagging relevant professionals increases visibility
- Content types: Personal stories outperform pure business content
- Thought leadership: Contrarian opinions drive discussion
- Professional development: Career advice content gets highest saves
- Community engagement: Industry-specific discussions boost authority`,

    TIKTOK_POST: `
TIKTOK VIRAL MECHANICS:
- Hook science: 3-second rule determines completion rate
- Trend participation: Using trending sounds increases reach 500%
- Educational content: Quick tips and facts drive saves
- Entertainment value: Humor and surprise crucial for shares
- Hashtag mix: Trending + niche combination for discovery
- Community response: Duets and responses build engagement
- Vertical optimization: Mobile-first content design essential
- Algorithm factors: Completion rate > likes for distribution`,

    YOUTUBE_SHORT: `
YOUTUBE SHORTS OPTIMIZATION:
- Mobile-first: Vertical format designed for phone viewing
- Hook timing: 3-5 seconds to capture and retain attention
- Educational angle: How-to content performs best in short format
- Series potential: Multi-part content increases subscriber growth
- Searchability: YouTube search algorithm applies to Shorts
- Community engagement: Comments crucial for distribution
- Thumbnail importance: First frame acts as thumbnail
- Keyword integration: Natural keyword inclusion for discovery`,

    PINTEREST_PIN: `
PINTEREST SEO OPTIMIZATION:
- Search-first: Pinterest functions as visual search engine
- Keyword density: Description should be naturally keyword-rich
- Character optimization: 100-200 characters for best performance
- No hashtags: Search keywords more important than hashtags
- Benefit clarity: Clear value proposition essential
- List format: Numbered and bulleted lists perform exceptionally
- Seasonal strategy: Plan content 2-3 months ahead for trends
- Rich Pins: Business information increases saves by 30%`,
  };

  return specs[platform as keyof typeof specs] || specs.INSTAGRAM_FEED;
}