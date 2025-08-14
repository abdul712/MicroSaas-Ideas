import OpenAI from 'openai'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const EmailGenerationInput = z.object({
  type: z.enum(['follow_up', 'welcome', 'nurture', 'promotion', 'reminder', 'thank_you']),
  recipientName: z.string().optional(),
  company: z.string().optional(),
  context: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent', 'formal']).default('professional'),
  industry: z.string().optional(),
  previousInteraction: z.string().optional(),
  callToAction: z.string().optional(),
  customVariables: z.record(z.string()).optional(),
})

const EmailGenerationOutput = z.object({
  subject: z.string(),
  htmlContent: z.string(),
  textContent: z.string(),
  variables: z.array(z.string()),
  personalizedElements: z.array(z.string()),
})

type EmailGenerationInput = z.infer<typeof EmailGenerationInput>
type EmailGenerationOutput = z.infer<typeof EmailGenerationOutput>

export class AIEmailGenerator {
  private static instance: AIEmailGenerator
  
  private constructor() {}

  public static getInstance(): AIEmailGenerator {
    if (!AIEmailGenerator.instance) {
      AIEmailGenerator.instance = new AIEmailGenerator()
    }
    return AIEmailGenerator.instance
  }

  async generateEmailContent(input: EmailGenerationInput): Promise<EmailGenerationOutput> {
    try {
      const validatedInput = EmailGenerationInput.parse(input)
      
      const prompt = this.buildPrompt(validatedInput)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert email copywriter specializing in automated follow-up sequences. 
            Your task is to create personalized, engaging emails that drive conversions and maintain relationships.
            
            Guidelines:
            - Use personalization variables like {{firstName}}, {{company}}, {{industry}}
            - Keep emails concise but valuable (150-300 words)
            - Include clear call-to-action
            - Match the specified tone
            - Avoid spam triggers
            - Make emails mobile-friendly
            
            Return your response as a JSON object with:
            - subject: Email subject line
            - htmlContent: Full HTML email content
            - textContent: Plain text version
            - variables: Array of variables used (e.g., ["firstName", "company"])
            - personalizedElements: Array of personalized elements added`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return EmailGenerationOutput.parse(result)

    } catch (error) {
      console.error('AI Email Generation Error:', error)
      throw new Error('Failed to generate email content')
    }
  }

  async generateSubjectLineVariations(
    baseSubject: string, 
    count: number = 5
  ): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating compelling email subject lines that drive high open rates.
            Create variations that are:
            - Attention-grabbing but not spammy
            - Different in approach (urgency, curiosity, benefit-focused)
            - Personalized when possible
            - Under 50 characters when possible`
          },
          {
            role: 'user',
            content: `Create ${count} different subject line variations for: "${baseSubject}"`
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      })

      const content = response.choices[0].message.content || ''
      return content.split('\n').filter(line => line.trim()).slice(0, count)

    } catch (error) {
      console.error('Subject Line Generation Error:', error)
      throw new Error('Failed to generate subject line variations')
    }
  }

  async optimizeEmailContent(
    content: string, 
    metrics: { openRate: number; clickRate: number; replyRate: number }
  ): Promise<{
    optimizedContent: string
    improvements: string[]
    predictedImprovements: {
      openRate: number
      clickRate: number
      replyRate: number
    }
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an email optimization expert. Analyze email content and current performance metrics to suggest improvements.
            
            Focus on:
            - Subject line optimization for open rates
            - Content structure for click rates  
            - Personalization for reply rates
            - CTA placement and wording
            - Email deliverability factors`
          },
          {
            role: 'user',
            content: `Optimize this email content:
            
            Current metrics:
            - Open Rate: ${metrics.openRate}%
            - Click Rate: ${metrics.clickRate}%
            - Reply Rate: ${metrics.replyRate}%
            
            Email Content:
            ${content}
            
            Provide optimized version with specific improvements and predicted impact.`
          }
        ],
        temperature: 0.5,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        optimizedContent: result.optimizedContent || content,
        improvements: result.improvements || [],
        predictedImprovements: {
          openRate: result.predictedImprovements?.openRate || metrics.openRate,
          clickRate: result.predictedImprovements?.clickRate || metrics.clickRate,
          replyRate: result.predictedImprovements?.replyRate || metrics.replyRate,
        }
      }

    } catch (error) {
      console.error('Email Optimization Error:', error)
      throw new Error('Failed to optimize email content')
    }
  }

  async generateSequence(
    sequenceType: string,
    steps: number,
    context: {
      industry?: string
      audience?: string
      goal?: string
      tone?: string
    }
  ): Promise<Array<{
    stepNumber: number
    delayDays: number
    subject: string
    content: string
    purpose: string
  }>> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating email sequence flows that nurture leads and drive conversions.
            Create a sequence that progressively builds value and guides recipients toward the desired action.`
          },
          {
            role: 'user',
            content: `Create a ${steps}-step email sequence for:
            
            Type: ${sequenceType}
            Industry: ${context.industry || 'general business'}
            Audience: ${context.audience || 'potential customers'}
            Goal: ${context.goal || 'conversion'}
            Tone: ${context.tone || 'professional'}
            
            For each step, include:
            - Step number
            - Delay in days from previous email
            - Subject line
            - Email content
            - Purpose/goal of this email
            
            Return as JSON array.`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      return result.sequence || []

    } catch (error) {
      console.error('Sequence Generation Error:', error)
      throw new Error('Failed to generate email sequence')
    }
  }

  private buildPrompt(input: EmailGenerationInput): string {
    let prompt = `Create a ${input.type} email`
    
    if (input.recipientName) prompt += ` for ${input.recipientName}`
    if (input.company) prompt += ` from ${input.company}`
    if (input.industry) prompt += ` in the ${input.industry} industry`
    
    prompt += `\n\nTone: ${input.tone}`
    
    if (input.context) prompt += `\n\nContext: ${input.context}`
    if (input.previousInteraction) prompt += `\n\nPrevious interaction: ${input.previousInteraction}`
    if (input.callToAction) prompt += `\n\nDesired call-to-action: ${input.callToAction}`
    
    if (input.customVariables) {
      prompt += `\n\nCustom variables to include: ${Object.keys(input.customVariables).join(', ')}`
    }
    
    return prompt
  }

  async analyzeEmailSentiment(content: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative'
    confidence: number
    suggestions: string[]
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Analyze the sentiment of email content and provide suggestions for improvement.
            Consider:
            - Overall tone and emotional impact
            - Likelihood to engage recipient
            - Potential negative reactions
            - Professional appropriateness`
          },
          {
            role: 'user',
            content: `Analyze the sentiment of this email content and provide improvement suggestions:
            
            ${content}`
          }
        ],
        temperature: 0.3,
        max_tokens: 800,
        response_format: { type: "json_object" }
      })

      const result = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        sentiment: result.sentiment || 'neutral',
        confidence: result.confidence || 0.5,
        suggestions: result.suggestions || []
      }

    } catch (error) {
      console.error('Sentiment Analysis Error:', error)
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        suggestions: ['Unable to analyze sentiment']
      }
    }
  }
}

export const aiEmailGenerator = AIEmailGenerator.getInstance()