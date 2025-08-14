import OpenAI from 'openai'
import { prisma } from './prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface AnalysisResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  confidence: number
  topics: string[]
  keywords: string[]
  emotions: Record<string, number>
  intent?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  suggestions: string[]
}

export async function analyzeFeedback(feedbackId: string): Promise<void> {
  try {
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        project: true,
        customer: true,
      },
    })

    if (!feedback) {
      throw new Error('Feedback not found')
    }

    // Skip analysis if already exists
    const existingAnalysis = await prisma.feedbackAnalysis.findUnique({
      where: { feedbackId },
    })

    if (existingAnalysis) {
      return
    }

    const analysis = await performAIAnalysis(feedback.content, feedback.type)

    // Save analysis to database
    await prisma.feedbackAnalysis.create({
      data: {
        feedbackId,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        topics: analysis.topics,
        keywords: analysis.keywords,
        emotions: analysis.emotions,
        intent: analysis.intent,
        priority: analysis.priority,
        suggestions: analysis.suggestions,
      },
    })

    // Update feedback with quick sentiment
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        sentiment: analysis.sentiment,
        category: analysis.topics[0] || null,
        tags: analysis.keywords,
      },
    })

    // Update usage metrics for AI analysis
    await prisma.usageMetric.upsert({
      where: {
        orgId_metric_period: {
          orgId: feedback.project.orgId,
          metric: 'AI_ANALYSIS',
          period: new Date().toISOString().slice(0, 7),
        },
      },
      update: {
        value: { increment: 1 },
      },
      create: {
        orgId: feedback.project.orgId,
        metric: 'AI_ANALYSIS',
        value: 1,
        period: new Date().toISOString().slice(0, 7),
      },
    })
  } catch (error) {
    console.error('AI analysis error:', error)
    throw error
  }
}

async function performAIAnalysis(content: string, type: string): Promise<AnalysisResult> {
  try {
    const prompt = `
Analyze the following customer feedback and provide a comprehensive analysis:

Feedback Type: ${type}
Content: "${content}"

Please provide:
1. Sentiment (POSITIVE, NEGATIVE, or NEUTRAL)
2. Confidence score (0-1)
3. Main topics (up to 5 key themes)
4. Keywords (up to 10 important words)
5. Emotions detected (joy, anger, sadness, fear, surprise, disgust - scores 0-1)
6. Customer intent (what they want to achieve)
7. Priority level (LOW, MEDIUM, HIGH, CRITICAL)
8. Actionable suggestions (up to 3)

Return as JSON with this structure:
{
  "sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
  "confidence": 0.95,
  "topics": ["topic1", "topic2"],
  "keywords": ["keyword1", "keyword2"],
  "emotions": {
    "joy": 0.8,
    "anger": 0.1,
    "sadness": 0.0,
    "fear": 0.0,
    "surprise": 0.1,
    "disgust": 0.0
  },
  "intent": "what customer wants",
  "priority": "MEDIUM",
  "suggestions": ["suggestion1", "suggestion2"]
}
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert customer feedback analyst. Analyze feedback accurately and provide actionable insights in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const result = response.choices[0]?.message?.content
    if (!result) {
      throw new Error('No analysis result from OpenAI')
    }

    // Parse and validate the JSON response
    const analysis = JSON.parse(result) as AnalysisResult

    // Validate the structure
    if (!analysis.sentiment || !analysis.confidence || !analysis.topics) {
      throw new Error('Invalid analysis structure')
    }

    // Ensure confidence is between 0 and 1
    analysis.confidence = Math.max(0, Math.min(1, analysis.confidence))

    // Ensure arrays exist
    analysis.topics = analysis.topics || []
    analysis.keywords = analysis.keywords || []
    analysis.suggestions = analysis.suggestions || []

    // Ensure emotions object exists
    analysis.emotions = analysis.emotions || {}

    return analysis
  } catch (error) {
    console.error('OpenAI analysis error:', error)
    
    // Fallback analysis if AI fails
    return {
      sentiment: 'NEUTRAL',
      confidence: 0.5,
      topics: ['general feedback'],
      keywords: extractKeywords(content),
      emotions: {
        joy: 0.33,
        anger: 0.33,
        sadness: 0.33,
        fear: 0,
        surprise: 0,
        disgust: 0,
      },
      intent: 'provide feedback',
      priority: 'MEDIUM',
      suggestions: ['Review and respond to feedback'],
    }
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction as fallback
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'were', 'they', 'them', 'their', 'there', 'where', 'when', 'what', 'which', 'would', 'could', 'should'].includes(word))

  // Count word frequency
  const wordCount: Record<string, number> = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  // Return top 5 most frequent words
  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

export async function getProjectAnalytics(projectId: string) {
  try {
    const [
      totalFeedback,
      sentimentStats,
      typeStats,
      recentFeedback,
      topTopics,
    ] = await Promise.all([
      prisma.feedback.count({ where: { projectId } }),
      
      prisma.feedback.groupBy({
        by: ['sentiment'],
        where: { projectId },
        _count: { sentiment: true },
      }),

      prisma.feedback.groupBy({
        by: ['type'],
        where: { projectId },
        _count: { type: true },
      }),

      prisma.feedback.findMany({
        where: { projectId },
        include: { analysis: true, customer: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      prisma.feedbackAnalysis.findMany({
        where: { feedback: { projectId } },
        select: { topics: true },
        take: 100,
      }),
    ])

    // Calculate topic frequency
    const topicCount: Record<string, number> = {}
    topTopics.forEach(analysis => {
      analysis.topics.forEach(topic => {
        topicCount[topic] = (topicCount[topic] || 0) + 1
      })
    })

    const sortedTopics = Object.entries(topicCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))

    return {
      totalFeedback,
      sentimentStats,
      typeStats,
      recentFeedback,
      topTopics: sortedTopics,
    }
  } catch (error) {
    console.error('Analytics error:', error)
    throw error
  }
}