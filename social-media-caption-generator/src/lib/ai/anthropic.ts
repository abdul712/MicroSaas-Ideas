import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AnthropicGenerationParams {
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
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost: number;
  model: string;
  stopReason: string;
}

// Token pricing per 1K tokens (as of 2024)
const PRICING = {
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
};

export async function generateCaption(params: AnthropicGenerationParams): Promise<AIResponse> {
  const {
    prompt,
    platform,
    brandVoice,
    imageAnalysis,
    maxTokens = 300,
    temperature = 0.7,
    model = 'claude-3-haiku-20240307',
  } = params;

  const systemPrompt = buildSystemPrompt(platform, brandVoice);
  const userPrompt = buildUserPrompt(prompt, imageAnalysis);

  try {
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = message.content[0];
    const usage = message.usage;

    // Calculate cost
    const modelPricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-3-haiku-20240307'];
    const cost = (
      (usage.input_tokens / 1000) * modelPricing.input +
      (usage.output_tokens / 1000) * modelPricing.output
    );

    return {
      content: content.type === 'text' ? content.text : '',
      usage: {
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        totalTokens: usage.input_tokens + usage.output_tokens,
      },
      cost,
      model,
      stopReason: message.stop_reason || 'end_turn',
    };
  } catch (error) {
    console.error('Anthropic generation error:', error);
    throw new Error(`Anthropic generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildSystemPrompt(platform: string, brandVoice?: string): string {
  const platformSpecs = getPlatformSpecifications(platform);
  
  let prompt = `You are an expert social media strategist and copywriter with deep knowledge of ${platform} best practices.

PLATFORM SPECIFICATIONS:
${platformSpecs}

CAPTION WRITING EXPERTISE:
- Craft compelling hooks that stop the scroll
- Use psychology-driven engagement techniques
- Incorporate trending formats and viral patterns
- Balance entertainment with value delivery
- Create authentic connections with audiences
- Optimize for algorithm preferences
- Drive meaningful engagement and conversions

QUALITY STANDARDS:
- Every word must earn its place
- Maintain consistent brand voice
- Include strategic hashtag placement
- End with clear, compelling CTAs
- Ensure mobile-first readability`;

  if (brandVoice) {
    prompt += `\n\nBRAND VOICE REQUIREMENTS:
${brandVoice}

Maintain this exact voice throughout the caption while adapting to platform conventions.`;
  }

  return prompt;
}

function buildUserPrompt(prompt: string, imageAnalysis?: any): string {
  let userPrompt = `Create an exceptional social media caption for: ${prompt}`;

  if (imageAnalysis) {
    userPrompt += `\n\nVISUAL CONTEXT ANALYSIS:
${JSON.stringify({
      objects: imageAnalysis.objects || [],
      scene: imageAnalysis.scene || 'general',
      mood: imageAnalysis.mood || 'professional',
      colors: imageAnalysis.colors || [],
      text: imageAnalysis.text || null,
      faces: imageAnalysis.faces || 0,
    }, null, 2)}

Use this visual context to create relevant, contextual caption content.`;
  }

  userPrompt += `\n\nDELIVERY REQUIREMENTS:
- Return ONLY the final caption text with integrated hashtags
- No explanations, meta-commentary, or formatting instructions
- Include strategic emojis naturally within the text
- Ensure hashtags feel organic, not forced
- Create scroll-stopping first line
- End with engaging call-to-action`;

  return userPrompt;
}

function getPlatformSpecifications(platform: string): string {
  const specs = {
    INSTAGRAM_FEED: `
INSTAGRAM FEED OPTIMIZATION:
- Character limit: 2,200 (first 125 characters are crucial)
- Optimal length: 138-150 characters for engagement
- Hashtag strategy: 5-15 hashtags, mix trending + niche
- Emoji usage: 3-5 emojis, placed strategically
- Line breaks: Use ••• or spacing for readability
- Hook requirement: Compelling first line before "more" cut-off
- Engagement drivers: Questions, calls-to-action, relatable content
- Best posting times: 11am-1pm, 7pm-9pm
- Algorithm factors: Saves, shares, comments > likes`,

    INSTAGRAM_STORIES: `
INSTAGRAM STORIES OPTIMIZATION:
- Viewing time: 3-7 seconds average
- Text limit: 100 characters for mobile readability
- Style: Conversational, urgent, FOMO-driven
- Hashtag limit: 10 max, 3-5 recommended
- Interactive elements: Polls, questions, stickers
- Call-to-action: Swipe up, DM, tap link in bio
- Authenticity: Behind-scenes, real-time content
- Visual hierarchy: Text placement avoiding face area`,

    INSTAGRAM_REELS: `
INSTAGRAM REELS OPTIMIZATION:
- Hook window: First 3 seconds critical
- Caption length: Keep engaging part in first 50 words
- Hashtag strategy: 3-7 hashtags, trending > niche
- Format preference: Lists, how-tos, before/after
- Music integration: Trending audio boosts reach
- Shareability: Educational, entertaining, relatable
- Loop potential: Content that encourages rewatching
- Trending participation: Challenges, trends, formats`,

    FACEBOOK_POST: `
FACEBOOK FEED OPTIMIZATION:
- Engagement sweet spot: 40-80 words
- Maximum: 63,206 characters available
- Hashtag usage: 1-2 maximum (different from Instagram)
- Community focus: Questions drive comments
- Link sharing: Native upload vs external links
- Emotional triggers: Nostalgia, family, community
- Peak times: 1pm-4pm weekdays
- Algorithm preference: Meaningful conversations`,

    TWITTER_POST: `
TWITTER/X OPTIMIZATION:
- Character limit: 280 total (including hashtags)
- Optimal engagement: 71-100 characters
- Hashtag limit: 1-2 maximum for best performance
- Real-time nature: News, trends, immediate reactions
- Thread potential: Break longer content into threads
- Retweet optimization: Quotable, shareable insights
- Engagement tactics: Polls, questions, controversial takes
- Timing: Breaking news, live events, trend participation`,

    LINKEDIN_POST: `
LINKEDIN OPTIMIZATION:
- Professional context: Business insights, career advice
- Optimal length: 150-300 words for best engagement
- Character limit: 3,000 available
- Hashtag strategy: 3-5 professional, industry-specific
- Authority building: Share expertise, lessons learned
- Network engagement: Tag relevant professionals
- Content types: Industry insights, personal stories, tips
- Professional tone: Thoughtful, educational, inspiring`,

    TIKTOK_POST: `
TIKTOK OPTIMIZATION:
- Hook requirement: Immediate attention within 3 seconds
- Character limit: 4,000, but keep under 150 for mobile
- Hashtag strategy: 3-5 trending + niche hashtags
- Trend participation: Sounds, challenges, formats
- Educational content: Quick tips, how-tos, facts
- Entertainment value: Humor, relatability, surprise
- Vertical format: Mobile-first viewing experience
- Community engagement: Duets, responses, trends`,

    YOUTUBE_SHORT: `
YOUTUBE SHORTS OPTIMIZATION:
- Mobile viewing: Vertical format optimization
- Hook timing: First 3-5 seconds crucial
- Caption length: Under 100 characters for visibility
- Hashtag usage: 2-3 relevant hashtags
- Educational angle: Quick tips, tutorials, facts
- Series potential: "Part 1 of...", continuing content
- Community posts: Engage with comments actively
- Searchability: Include relevant keywords naturally`,

    PINTEREST_PIN: `
PINTEREST OPTIMIZATION:
- SEO-first: Keyword-rich descriptions
- Character limit: 500, optimal 100-200
- No hashtags: Focus on searchable keywords
- Benefit-driven: Clear value proposition
- List format: Numbered lists perform well
- Seasonal content: Plan for holidays, trends
- Rich Pins: Business information integration
- Board strategy: Relevant board placement matters`,
  };

  return specs[platform as keyof typeof specs] || specs.INSTAGRAM_FEED;
}