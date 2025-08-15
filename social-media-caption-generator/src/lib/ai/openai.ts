import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OpenAIGenerationParams {
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
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
};

export async function generateCaption(params: OpenAIGenerationParams): Promise<AIResponse> {
  const {
    prompt,
    platform,
    brandVoice,
    imageAnalysis,
    maxTokens = 300,
    temperature = 0.7,
    model = 'gpt-4o-mini',
  } = params;

  const systemPrompt = buildSystemPrompt(platform, brandVoice);
  const userPrompt = buildUserPrompt(prompt, imageAnalysis);

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    const choice = completion.choices[0];
    const usage = completion.usage!;

    // Calculate cost
    const modelPricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o-mini'];
    const cost = (
      (usage.prompt_tokens / 1000) * modelPricing.input +
      (usage.completion_tokens / 1000) * modelPricing.output
    );

    return {
      content: choice.message.content || '',
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
      },
      cost,
      model,
      finishReason: choice.finish_reason || 'stop',
    };
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw new Error(`OpenAI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    throw new Error(`OpenAI embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function buildSystemPrompt(platform: string, brandVoice?: string): string {
  const platformSpecs = getPlatformSpecifications(platform);
  
  let prompt = `You are an expert social media caption writer specializing in ${platform}. 

PLATFORM SPECIFICATIONS:
${platformSpecs}

WRITING GUIDELINES:
- Write engaging, scroll-stopping captions that drive engagement
- Use emojis strategically (2-5 per caption)
- Include relevant hashtags (5-15 depending on platform)
- Create compelling hooks in the first line
- End with clear call-to-actions
- Maintain authenticity and avoid overly promotional language
- Consider trending topics and formats when appropriate`;

  if (brandVoice) {
    prompt += `\n\nBRAND VOICE:
${brandVoice}
Ensure the caption matches this brand voice consistently.`;
  }

  return prompt;
}

function buildUserPrompt(prompt: string, imageAnalysis?: any): string {
  let userPrompt = `Generate a compelling social media caption for: ${prompt}`;

  if (imageAnalysis) {
    userPrompt += `\n\nIMAGE CONTEXT:
- Objects detected: ${imageAnalysis.objects?.join(', ') || 'None'}
- Scene: ${imageAnalysis.scene || 'General'}
- Colors: ${imageAnalysis.colors?.join(', ') || 'Various'}
- Text in image: ${imageAnalysis.text || 'None'}
- Mood/Style: ${imageAnalysis.mood || 'Professional'}`;
  }

  userPrompt += `\n\nPlease provide ONLY the caption content with hashtags. Do not include explanations or meta-commentary.`;

  return userPrompt;
}

function getPlatformSpecifications(platform: string): string {
  const specs = {
    INSTAGRAM_FEED: `
- Character limit: 2,200 (first 125 characters visible)
- Hashtags: 5-15 recommended, can use up to 30
- Best practices: Strong first line, storytelling, community-building
- Emojis: 3-5 emojis work well
- Line breaks: Use for readability`,

    INSTAGRAM_STORIES: `
- Character limit: Keep under 100 for readability
- Style: Casual, conversational, urgent
- Hashtags: 2-5 hashtags max
- Emojis: 2-3 emojis
- Format: Short, punchy, immediate`,

    INSTAGRAM_REELS: `
- Character limit: 2,200 but keep first 50 words engaging
- Style: Trendy, entertaining, educational
- Hashtags: 3-7 focused hashtags
- Hook: Strong first 3 seconds capture
- Format: List-style or how-to works well`,

    FACEBOOK_POST: `
- Character limit: 63,206 but 40-80 words get best engagement
- Style: Conversational, community-focused
- Hashtags: 1-2 hashtags only
- Format: Question-based posts drive engagement
- Links: Can include external links`,

    TWITTER_POST: `
- Character limit: 280 characters total
- Style: Concise, witty, news-worthy
- Hashtags: 1-2 hashtags max
- Format: Thread-style for longer content
- Engagement: Questions and polls work well`,

    LINKEDIN_POST: `
- Character limit: 3,000 but 150-300 words optimal
- Style: Professional, insightful, educational
- Hashtags: 3-5 professional hashtags
- Format: Industry insights, leadership thoughts
- Engagement: Professional discussion starters`,

    TIKTOK_POST: `
- Character limit: 4,000 but keep under 150
- Style: Casual, trendy, entertaining
- Hashtags: 3-5 trending hashtags
- Format: Challenge-related, educational, funny
- Hook: Immediate attention grabber`,

    YOUTUBE_SHORT: `
- Character limit: Keep under 100 for mobile viewing
- Style: Educational, entertaining, tutorial
- Hashtags: 2-3 relevant hashtags
- Format: "How to", "Quick tip", numbered lists
- Hook: Promise value in first line`,

    PINTEREST_PIN: `
- Character limit: 500 but 100-200 optimal
- Style: Descriptive, keyword-rich, actionable
- Hashtags: Not used, focus on keywords
- Format: List-style, benefit-focused
- SEO: Include searchable keywords`,
  };

  return specs[platform as keyof typeof specs] || specs.INSTAGRAM_FEED;
}