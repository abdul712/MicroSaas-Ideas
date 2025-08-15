import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TranscriptionSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface TranscriptionResponse {
  text: string
  segments?: TranscriptionSegment[]
  language: string
  duration: number
}

export interface ShowNotesGenerationOptions {
  transcript: string
  episodeTitle?: string
  podcastName?: string
  duration?: number
  template?: 'interview' | 'solo' | 'panel' | 'educational' | 'comedy' | 'custom'
  includeTimestamps?: boolean
  includeSocialContent?: boolean
  includeKeywords?: boolean
  targetLength?: 'short' | 'medium' | 'long'
  seoFocus?: boolean
}

export interface GeneratedShowNotes {
  summary: string
  keyPoints: string[]
  timestamps: Array<{
    time: string
    description: string
    speaker?: string
  }>
  quotes: Array<{
    text: string
    speaker?: string
    timestamp?: string
  }>
  linksAndResources: Array<{
    title: string
    url?: string
    description: string
  }>
  socialContent: {
    twitter: string[]
    linkedin: string
    instagram: string
    facebook: string
  }
  seoMetadata: {
    title: string
    description: string
    keywords: string[]
    tags: string[]
  }
}

export class OpenAIService {
  private static instance: OpenAIService
  private client: OpenAI

  private constructor() {
    this.client = openai
  }

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService()
    }
    return OpenAIService.instance
  }

  async transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: ['segment'],
        language: 'en', // Can be made dynamic based on detection
      })

      return {
        text: transcription.text,
        segments: transcription.segments as TranscriptionSegment[],
        language: transcription.language || 'en',
        duration: transcription.duration || 0,
      }
    } catch (error) {
      console.error('OpenAI transcription error:', error)
      throw new Error('Failed to transcribe audio')
    }
  }

  async generateShowNotes(options: ShowNotesGenerationOptions): Promise<GeneratedShowNotes> {
    try {
      const systemPrompt = this.buildSystemPrompt(options)
      const userPrompt = this.buildUserPrompt(options)

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new Error('No content generated')
      }

      return JSON.parse(content) as GeneratedShowNotes
    } catch (error) {
      console.error('Show notes generation error:', error)
      throw new Error('Failed to generate show notes')
    }
  }

  private buildSystemPrompt(options: ShowNotesGenerationOptions): string {
    const templateInstructions = this.getTemplateInstructions(options.template)
    const lengthInstructions = this.getLengthInstructions(options.targetLength)

    return `You are an expert podcast show notes generator. Your task is to create comprehensive, engaging, and SEO-optimized show notes from podcast transcripts.

${templateInstructions}

${lengthInstructions}

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "summary": "A compelling episode summary",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "timestamps": [{"time": "MM:SS", "description": "What happens at this time", "speaker": "Speaker name if available"}],
  "quotes": [{"text": "Notable quote", "speaker": "Speaker name", "timestamp": "MM:SS"}],
  "linksAndResources": [{"title": "Resource title", "url": "URL if mentioned", "description": "Description"}],
  "socialContent": {
    "twitter": ["Tweet 1", "Tweet 2", ...],
    "linkedin": "LinkedIn post",
    "instagram": "Instagram caption",
    "facebook": "Facebook post"
  },
  "seoMetadata": {
    "title": "SEO-optimized title",
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2", ...],
    "tags": ["tag1", "tag2", ...]
  }
}

Guidelines:
- Make content engaging and valuable to readers
- Include timestamps for key moments and topic changes
- Extract memorable quotes and insights
- Create platform-specific social media content
- Optimize for SEO with relevant keywords
- Maintain consistent tone matching the podcast style`
  }

  private buildUserPrompt(options: ShowNotesGenerationOptions): string {
    let prompt = `Create comprehensive show notes for this podcast episode.

TRANSCRIPT:
${options.transcript}

`

    if (options.episodeTitle) {
      prompt += `EPISODE TITLE: ${options.episodeTitle}\n`
    }

    if (options.podcastName) {
      prompt += `PODCAST NAME: ${options.podcastName}\n`
    }

    if (options.duration) {
      prompt += `EPISODE DURATION: ${Math.floor(options.duration / 60)} minutes\n`
    }

    prompt += `\nPlease generate show notes following the specified format and guidelines.`

    return prompt
  }

  private getTemplateInstructions(template?: string): string {
    switch (template) {
      case 'interview':
        return `This is an interview-style podcast. Focus on:
- Guest introduction and background
- Key questions and answers
- Guest's expertise and insights
- Contact information and social links
- Follow-up resources mentioned`

      case 'solo':
        return `This is a solo podcast episode. Focus on:
- Host's main message and teaching points
- Personal stories and examples
- Actionable advice and takeaways
- Resources and tools mentioned
- Clear structure with main topics`

      case 'panel':
        return `This is a panel discussion. Focus on:
- All participants and their expertise
- Different perspectives on topics
- Debates and differing opinions
- Consensus points and agreements
- Individual contact information`

      case 'educational':
        return `This is an educational podcast. Focus on:
- Learning objectives and outcomes
- Step-by-step explanations
- Key concepts and definitions
- Practical applications
- Additional learning resources`

      case 'comedy':
        return `This is a comedy podcast. Focus on:
- Funniest moments and jokes
- Running gags and callbacks
- Guest comedians if featured
- Lighthearted tone in descriptions
- Memorable comedic quotes`

      default:
        return `Create versatile show notes that work for any podcast format. Focus on the most engaging and valuable content from the episode.`
    }
  }

  private getLengthInstructions(targetLength?: string): string {
    switch (targetLength) {
      case 'short':
        return `Keep show notes concise:
- Summary: 2-3 sentences
- Key points: 3-5 bullets
- Timestamps: 5-8 key moments
- Quotes: 2-3 best quotes
- Social content: Brief and punchy`

      case 'long':
        return `Create comprehensive show notes:
- Summary: Detailed 5-7 sentences
- Key points: 8-12 detailed bullets
- Timestamps: 15-20 moments throughout
- Quotes: 5-8 memorable quotes
- Social content: Multiple options per platform`

      default: // medium
        return `Create balanced show notes:
- Summary: 3-4 sentences
- Key points: 5-8 bullets
- Timestamps: 8-12 key moments
- Quotes: 3-5 notable quotes
- Social content: 2-3 options per platform`
    }
  }

  async enhanceWithSEO(content: string, keywords: string[] = []): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an SEO expert. Enhance the provided content for better search engine optimization while maintaining natural readability. If keywords are provided, incorporate them naturally.`
          },
          {
            role: 'user',
            content: `Enhance this content for SEO${keywords.length > 0 ? ` using these keywords: ${keywords.join(', ')}` : ''}:

${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })

      return completion.choices[0]?.message?.content || content
    } catch (error) {
      console.error('SEO enhancement error:', error)
      return content // Return original content if enhancement fails
    }
  }
}