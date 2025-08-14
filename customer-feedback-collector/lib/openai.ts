import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SentimentAnalysisResult {
  overallScore: number // -1 to 1
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED'
  confidence: number // 0 to 1
  emotions: {
    joy: number
    anger: number
    fear: number
    sadness: number
    surprise: number
    disgust: number
  }
  topics: string[]
  keywords: string[]
  language: string
}

export interface ResponseSummary {
  keyInsights: string[]
  actionItems: string[]
  overallTheme: string
  urgency: 'LOW' | 'MEDIUM' | 'HIGH'
}

export async function analyzeSentiment(textResponses: string[]): Promise<SentimentAnalysisResult> {
  try {
    const combinedText = textResponses.join('\n\n')
    
    if (!combinedText.trim()) {
      return getDefaultSentiment()
    }

    const prompt = `
Analyze the following customer feedback text for sentiment, emotions, topics, and keywords.

Customer Feedback:
"${combinedText}"

Please provide a JSON response with the following structure:
{
  "overallScore": number between -1 and 1,
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
  "confidence": number between 0 and 1,
  "emotions": {
    "joy": number between 0 and 1,
    "anger": number between 0 and 1,
    "fear": number between 0 and 1,
    "sadness": number between 0 and 1,
    "surprise": number between 0 and 1,
    "disgust": number between 0 and 1
  },
  "topics": array of main topics/themes,
  "keywords": array of important keywords,
  "language": detected language code
}

Focus on accuracy and provide actionable insights.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert sentiment analysis AI. Return only valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      return getDefaultSentiment()
    }

    try {
      const parsed = JSON.parse(response)
      return validateSentimentResult(parsed)
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return getDefaultSentiment()
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    return getDefaultSentiment()
  }
}

export async function generateResponseSummary(responses: any[]): Promise<ResponseSummary> {
  try {
    const textResponses = responses
      .flatMap(r => r.answers)
      .filter(a => typeof a.textValue === 'string' && a.textValue.length > 10)
      .map(a => a.textValue)
      .slice(0, 50) // Limit to prevent token limits

    if (textResponses.length === 0) {
      return getDefaultSummary()
    }

    const prompt = `
Analyze the following customer feedback responses and provide actionable insights:

Customer Responses:
${textResponses.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

Please provide a JSON response with:
{
  "keyInsights": array of 3-5 most important insights,
  "actionItems": array of 3-5 specific actions to take,
  "overallTheme": brief description of main theme,
  "urgency": "LOW" | "MEDIUM" | "HIGH" based on tone and content
}

Focus on actionable business insights and priority issues.`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a business analyst AI focused on customer feedback analysis. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 800,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      return getDefaultSummary()
    }

    try {
      const parsed = JSON.parse(response)
      return validateSummaryResult(parsed)
    } catch (parseError) {
      console.error('Failed to parse summary response:', parseError)
      return getDefaultSummary()
    }
  } catch (error) {
    console.error('Summary generation error:', error)
    return getDefaultSummary()
  }
}

export async function categorizeResponse(text: string): Promise<string[]> {
  try {
    const prompt = `
Categorize this customer feedback into relevant categories:

Feedback: "${text}"

Common categories include:
- Product Quality
- Customer Service
- Pricing
- Features/Functionality
- User Experience
- Performance
- Bug Reports
- Feature Requests
- Compliments
- Complaints
- Suggestions

Return a JSON array of 1-3 most relevant categories for this feedback.
Example: ["Product Quality", "User Experience"]`

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a feedback categorization AI. Return only valid JSON arrays.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 100,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      return ['General Feedback']
    }

    try {
      const parsed = JSON.parse(response)
      return Array.isArray(parsed) ? parsed : ['General Feedback']
    } catch (parseError) {
      return ['General Feedback']
    }
  } catch (error) {
    console.error('Categorization error:', error)
    return ['General Feedback']
  }
}

// Helper functions
function getDefaultSentiment(): SentimentAnalysisResult {
  return {
    overallScore: 0,
    sentiment: 'NEUTRAL',
    confidence: 0.5,
    emotions: {
      joy: 0,
      anger: 0,
      fear: 0,
      sadness: 0,
      surprise: 0,
      disgust: 0,
    },
    topics: ['general feedback'],
    keywords: ['feedback'],
    language: 'en',
  }
}

function getDefaultSummary(): ResponseSummary {
  return {
    keyInsights: ['Insufficient data for analysis'],
    actionItems: ['Collect more feedback responses'],
    overallTheme: 'Limited feedback available',
    urgency: 'LOW',
  }
}

function validateSentimentResult(result: any): SentimentAnalysisResult {
  return {
    overallScore: Math.max(-1, Math.min(1, result.overallScore || 0)),
    sentiment: ['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED'].includes(result.sentiment) 
      ? result.sentiment 
      : 'NEUTRAL',
    confidence: Math.max(0, Math.min(1, result.confidence || 0.5)),
    emotions: {
      joy: Math.max(0, Math.min(1, result.emotions?.joy || 0)),
      anger: Math.max(0, Math.min(1, result.emotions?.anger || 0)),
      fear: Math.max(0, Math.min(1, result.emotions?.fear || 0)),
      sadness: Math.max(0, Math.min(1, result.emotions?.sadness || 0)),
      surprise: Math.max(0, Math.min(1, result.emotions?.surprise || 0)),
      disgust: Math.max(0, Math.min(1, result.emotions?.disgust || 0)),
    },
    topics: Array.isArray(result.topics) ? result.topics.slice(0, 10) : ['general'],
    keywords: Array.isArray(result.keywords) ? result.keywords.slice(0, 20) : ['feedback'],
    language: result.language || 'en',
  }
}

function validateSummaryResult(result: any): ResponseSummary {
  return {
    keyInsights: Array.isArray(result.keyInsights) 
      ? result.keyInsights.slice(0, 10) 
      : ['No insights available'],
    actionItems: Array.isArray(result.actionItems) 
      ? result.actionItems.slice(0, 10) 
      : ['Collect more feedback'],
    overallTheme: result.overallTheme || 'General feedback',
    urgency: ['LOW', 'MEDIUM', 'HIGH'].includes(result.urgency) 
      ? result.urgency 
      : 'LOW',
  }
}