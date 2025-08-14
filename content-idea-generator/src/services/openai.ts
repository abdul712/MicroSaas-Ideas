import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ContentIdeaRequest {
  niche: string
  keywords: string[]
  contentType: string
  toneOfVoice?: string
  targetAudience?: string
  competitors?: string[]
  trendData?: any[]
  count?: number
}

export interface ContentIdeaResponse {
  title: string
  description: string
  outline: string[]
  keywords: string[]
  primaryKeyword: string
  angle: string
  hookSuggestions: string[]
  ctaSuggestions: string[]
  estimatedReadTime: number
  targetWordCount: number
  difficultyScore: number
  seoScore: number
}

export class ContentIdeaGenerator {
  private buildPrompt(request: ContentIdeaRequest): string {
    const {
      niche,
      keywords,
      contentType,
      toneOfVoice = 'professional',
      targetAudience = 'general audience',
      competitors = [],
      trendData = [],
      count = 1
    } = request

    const trendContext = trendData.length > 0
      ? `\n\nCurrent trending topics: ${trendData.map(t => t.keyword).join(', ')}`
      : ''

    const competitorContext = competitors.length > 0
      ? `\n\nCompetitor analysis: Consider content gaps from these competitors: ${competitors.join(', ')}`
      : ''

    return `You are an expert content strategist and AI content idea generator. Generate ${count} high-quality, engaging content idea(s) for the following requirements:

**Niche:** ${niche}
**Target Keywords:** ${keywords.join(', ')}
**Content Type:** ${contentType}
**Tone of Voice:** ${toneOfVoice}
**Target Audience:** ${targetAudience}${trendContext}${competitorContext}

For each content idea, provide:

1. **Title:** An engaging, SEO-optimized title that includes the primary keyword
2. **Description:** A compelling 2-3 sentence description explaining what the content will cover
3. **Outline:** A detailed 5-7 point outline with subheadings
4. **Keywords:** A list of relevant SEO keywords (primary + secondary)
5. **Primary Keyword:** The main keyword to target
6. **Angle:** The unique perspective or approach that makes this content stand out
7. **Hook Suggestions:** 3 attention-grabbing opening hooks
8. **CTA Suggestions:** 3 call-to-action ideas for the content
9. **Estimated Read Time:** In minutes (for blog posts) or duration (for other content)
10. **Target Word Count:** Recommended word count
11. **Difficulty Score:** Content creation difficulty (1-100, where 100 is most difficult)
12. **SEO Score:** Potential SEO performance (1-100, where 100 is highest potential)

Ensure the content ideas are:
- Timely and relevant to current trends
- Actionable and valuable to the target audience
- Unique and not commonly covered
- Optimized for search engines
- Aligned with the specified tone and audience

Return the response as a valid JSON array of objects, where each object contains all the above fields.`
  }

  async generateIdeas(request: ContentIdeaRequest): Promise<ContentIdeaResponse[]> {
    try {
      const prompt = this.buildPrompt(request)
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const parsedResponse = JSON.parse(response)
      
      // Handle both single object and array responses
      const ideas = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.ideas || [parsedResponse]
      
      return ideas.map((idea: any) => ({
        title: idea.title || '',
        description: idea.description || '',
        outline: Array.isArray(idea.outline) ? idea.outline : [],
        keywords: Array.isArray(idea.keywords) ? idea.keywords : [],
        primaryKeyword: idea.primaryKeyword || idea.primary_keyword || '',
        angle: idea.angle || '',
        hookSuggestions: Array.isArray(idea.hookSuggestions) ? idea.hookSuggestions : idea.hook_suggestions || [],
        ctaSuggestions: Array.isArray(idea.ctaSuggestions) ? idea.ctaSuggestions : idea.cta_suggestions || [],
        estimatedReadTime: Number(idea.estimatedReadTime || idea.estimated_read_time || 5),
        targetWordCount: Number(idea.targetWordCount || idea.target_word_count || 1000),
        difficultyScore: Number(idea.difficultyScore || idea.difficulty_score || 50),
        seoScore: Number(idea.seoScore || idea.seo_score || 70),
      }))
    } catch (error) {
      console.error('Error generating content ideas:', error)
      throw new Error('Failed to generate content ideas')
    }
  }

  async improveIdea(idea: string, feedback: string): Promise<ContentIdeaResponse> {
    try {
      const prompt = `Improve the following content idea based on the user feedback:

**Original Idea:** ${idea}
**User Feedback:** ${feedback}

Please provide an improved version that addresses the feedback while maintaining the core concept. Return as JSON with the same structure as before.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const parsedResponse = JSON.parse(response)
      
      return {
        title: parsedResponse.title || '',
        description: parsedResponse.description || '',
        outline: Array.isArray(parsedResponse.outline) ? parsedResponse.outline : [],
        keywords: Array.isArray(parsedResponse.keywords) ? parsedResponse.keywords : [],
        primaryKeyword: parsedResponse.primaryKeyword || parsedResponse.primary_keyword || '',
        angle: parsedResponse.angle || '',
        hookSuggestions: Array.isArray(parsedResponse.hookSuggestions) ? parsedResponse.hookSuggestions : parsedResponse.hook_suggestions || [],
        ctaSuggestions: Array.isArray(parsedResponse.ctaSuggestions) ? parsedResponse.ctaSuggestions : parsedResponse.cta_suggestions || [],
        estimatedReadTime: Number(parsedResponse.estimatedReadTime || parsedResponse.estimated_read_time || 5),
        targetWordCount: Number(parsedResponse.targetWordCount || parsedResponse.target_word_count || 1000),
        difficultyScore: Number(parsedResponse.difficultyScore || parsedResponse.difficulty_score || 50),
        seoScore: Number(parsedResponse.seoScore || parsedResponse.seo_score || 70),
      }
    } catch (error) {
      console.error('Error improving content idea:', error)
      throw new Error('Failed to improve content idea')
    }
  }

  async generateVariations(originalIdea: string, count: number = 3): Promise<ContentIdeaResponse[]> {
    try {
      const prompt = `Create ${count} variations of the following content idea. Each variation should have a different angle or approach while targeting similar keywords:

**Original Idea:** ${originalIdea}

Return as JSON array with ${count} improved variations.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from OpenAI')
      }

      const parsedResponse = JSON.parse(response)
      const variations = Array.isArray(parsedResponse) ? parsedResponse : parsedResponse.variations || [parsedResponse]
      
      return variations.map((variation: any) => ({
        title: variation.title || '',
        description: variation.description || '',
        outline: Array.isArray(variation.outline) ? variation.outline : [],
        keywords: Array.isArray(variation.keywords) ? variation.keywords : [],
        primaryKeyword: variation.primaryKeyword || variation.primary_keyword || '',
        angle: variation.angle || '',
        hookSuggestions: Array.isArray(variation.hookSuggestions) ? variation.hookSuggestions : variation.hook_suggestions || [],
        ctaSuggestions: Array.isArray(variation.ctaSuggestions) ? variation.ctaSuggestions : variation.cta_suggestions || [],
        estimatedReadTime: Number(variation.estimatedReadTime || variation.estimated_read_time || 5),
        targetWordCount: Number(variation.targetWordCount || variation.target_word_count || 1000),
        difficultyScore: Number(variation.difficultyScore || variation.difficulty_score || 50),
        seoScore: Number(variation.seoScore || variation.seo_score || 70),
      }))
    } catch (error) {
      console.error('Error generating content variations:', error)
      throw new Error('Failed to generate content variations')
    }
  }
}

export const contentIdeaGenerator = new ContentIdeaGenerator()