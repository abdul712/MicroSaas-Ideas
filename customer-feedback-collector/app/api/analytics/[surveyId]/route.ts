import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyticsQuerySchema } from '@/lib/validations'
import { 
  createProtectedHandler, 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  validateTenantAccess
} from '@/lib/api-helpers'
import { calculateNPS, calculateCSAT, calculateAverage } from '@/lib/utils'

interface Context {
  params: { surveyId: string }
  session: any
}

// GET /api/analytics/[surveyId] - Get analytics for a survey
export const GET = createProtectedHandler(async (request, { params, session }: Context) => {
  const { searchParams } = new URL(request.url)
  
  // Parse query parameters
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const metrics = searchParams.get('metrics')?.split(',') || ['response_count']
  const groupBy = searchParams.get('groupBy') || 'day'
  
  // Validate survey exists and belongs to organization
  const survey = await prisma.survey.findUnique({
    where: { id: params.surveyId },
    include: {
      questions: true,
    },
  })
  
  if (!survey) {
    return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
  }
  
  validateTenantAccess(survey.organizationId, session.user.organizationId)
  
  // Set default date range if not provided
  const endDate = dateTo ? new Date(dateTo) : new Date()
  const startDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  
  try {
    // Get responses in date range
    const responses = await prisma.response.findMany({
      where: {
        surveyId: params.surveyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'COMPLETED',
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        sentimentAnalysis: true,
      },
    })
    
    // Calculate basic metrics
    const analytics = {
      summary: {
        totalResponses: responses.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        survey: {
          id: survey.id,
          title: survey.title,
          status: survey.status,
        },
      },
      metrics: {} as any,
      insights: {} as any,
      trends: [] as any[],
    }
    
    // Response count over time
    if (metrics.includes('response_count')) {
      analytics.metrics.responseCount = calculateResponseTrends(responses, groupBy, startDate, endDate)
    }
    
    // Completion rate (simplified - would need to track starts vs completions in real implementation)
    if (metrics.includes('completion_rate')) {
      analytics.metrics.completionRate = {
        current: 85, // Placeholder
        change: +5.2,
      }
    }
    
    // Average response time
    if (metrics.includes('average_time')) {
      const times = responses
        .filter(r => r.timeSpent)
        .map(r => r.timeSpent!)
      
      analytics.metrics.averageTime = {
        current: times.length > 0 ? Math.round(calculateAverage(times)) : 0,
        unit: 'seconds',
        change: -12.3, // Placeholder
      }
    }
    
    // NPS Score
    if (metrics.includes('nps_score')) {
      const npsAnswers = responses.flatMap(r => 
        r.answers
          .filter(a => a.question.type === 'NPS')
          .map(a => Number(a.numberValue))
          .filter(val => !isNaN(val))
      )
      
      analytics.metrics.npsScore = {
        current: npsAnswers.length > 0 ? calculateNPS(npsAnswers) : null,
        distribution: {
          promoters: npsAnswers.filter(score => score >= 9).length,
          passives: npsAnswers.filter(score => score >= 7 && score <= 8).length,
          detractors: npsAnswers.filter(score => score <= 6).length,
        },
        change: +3.4, // Placeholder
      }
    }
    
    // CSAT Score
    const ratingAnswers = responses.flatMap(r =>
      r.answers
        .filter(a => a.question.type === 'RATING')
        .map(a => Number(a.numberValue))
        .filter(val => !isNaN(val))
    )
    
    if (ratingAnswers.length > 0) {
      analytics.metrics.csatScore = {
        current: calculateCSAT(ratingAnswers, 5),
        average: calculateAverage(ratingAnswers).toFixed(1),
        change: +2.1, // Placeholder
      }
    }
    
    // Sentiment Analysis
    if (metrics.includes('sentiment_score')) {
      const sentiments = responses
        .flatMap(r => r.sentimentAnalysis)
        .filter(Boolean)
      
      if (sentiments.length > 0) {
        const avgSentiment = calculateAverage(sentiments.map(s => s.overallScore))
        const sentimentDistribution = {
          positive: sentiments.filter(s => s.sentiment === 'POSITIVE').length,
          neutral: sentiments.filter(s => s.sentiment === 'NEUTRAL').length,
          negative: sentiments.filter(s => s.sentiment === 'NEGATIVE').length,
          mixed: sentiments.filter(s => s.sentiment === 'MIXED').length,
        }
        
        analytics.metrics.sentimentScore = {
          current: avgSentiment,
          distribution: sentimentDistribution,
          confidence: calculateAverage(sentiments.map(s => s.confidence)),
        }
        
        // Top topics and keywords
        const allTopics = sentiments.flatMap(s => s.topics as string[])
        const allKeywords = sentiments.flatMap(s => s.keywords as string[])
        
        analytics.insights.topTopics = getTopItems(allTopics).slice(0, 10)
        analytics.insights.topKeywords = getTopItems(allKeywords).slice(0, 20)
      }
    }
    
    // Question-level analytics
    analytics.insights.questionAnalytics = survey.questions.map(question => {
      const answers = responses
        .flatMap(r => r.answers)
        .filter(a => a.questionId === question.id)
      
      return {
        questionId: question.id,
        title: question.title,
        type: question.type,
        responseCount: answers.length,
        analytics: calculateQuestionAnalytics(question, answers),
      }
    })
    
    // Source breakdown
    const sourceBreakdown = responses.reduce((acc, response) => {
      const source = response.source || 'direct'
      acc[source] = (acc[source] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    analytics.insights.sourceBreakdown = Object.entries(sourceBreakdown)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
    
    // Response rate trends (requires additional tracking in real implementation)
    analytics.trends = generateTrendData(responses, groupBy, startDate, endDate)
    
    return successResponse(analytics)
  } catch (error) {
    console.error('Analytics calculation error:', error)
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to calculate analytics',
      500
    )
  }
})

// Helper functions
function calculateResponseTrends(
  responses: any[], 
  groupBy: string, 
  startDate: Date, 
  endDate: Date
) {
  const intervals = generateDateIntervals(startDate, endDate, groupBy)
  
  return intervals.map(interval => {
    const count = responses.filter(r => {
      const responseDate = new Date(r.createdAt)
      return responseDate >= interval.start && responseDate < interval.end
    }).length
    
    return {
      period: interval.start.toISOString().split('T')[0],
      count,
    }
  })
}

function generateDateIntervals(startDate: Date, endDate: Date, groupBy: string) {
  const intervals = []
  let current = new Date(startDate)
  
  while (current < endDate) {
    const next = new Date(current)
    
    switch (groupBy) {
      case 'hour':
        next.setHours(next.getHours() + 1)
        break
      case 'day':
        next.setDate(next.getDate() + 1)
        break
      case 'week':
        next.setDate(next.getDate() + 7)
        break
      case 'month':
        next.setMonth(next.getMonth() + 1)
        break
      default:
        next.setDate(next.getDate() + 1)
    }
    
    intervals.push({
      start: new Date(current),
      end: next > endDate ? endDate : new Date(next),
    })
    
    current = next
  }
  
  return intervals
}

function calculateQuestionAnalytics(question: any, answers: any[]) {
  switch (question.type) {
    case 'MULTIPLE_CHOICE':
    case 'SINGLE_CHOICE':
      return calculateChoiceAnalytics(answers, question.options)
    case 'RATING':
    case 'SCALE':
      return calculateScaleAnalytics(answers)
    case 'NPS':
      return calculateNPSAnalytics(answers)
    case 'TEXT':
    case 'TEXTAREA':
      return calculateTextAnalytics(answers)
    default:
      return { responseCount: answers.length }
  }
}

function calculateChoiceAnalytics(answers: any[], options: string[]) {
  const choiceCounts: Record<string, number> = {}
  
  answers.forEach(answer => {
    const value = answer.textValue || answer.value
    if (Array.isArray(value)) {
      value.forEach((choice: string) => {
        choiceCounts[choice] = (choiceCounts[choice] || 0) + 1
      })
    } else if (value) {
      choiceCounts[value] = (choiceCounts[value] || 0) + 1
    }
  })
  
  return {
    distribution: Object.entries(choiceCounts).map(([choice, count]) => ({
      choice,
      count,
      percentage: answers.length > 0 ? Math.round((count / answers.length) * 100) : 0,
    })),
  }
}

function calculateScaleAnalytics(answers: any[]) {
  const values = answers
    .map(a => Number(a.numberValue))
    .filter(val => !isNaN(val))
  
  if (values.length === 0) return { average: 0, distribution: [] }
  
  const average = calculateAverage(values)
  const distribution: Record<number, number> = {}
  
  values.forEach(value => {
    distribution[value] = (distribution[value] || 0) + 1
  })
  
  return {
    average: Number(average.toFixed(1)),
    distribution: Object.entries(distribution)
      .map(([value, count]) => ({
        value: Number(value),
        count,
        percentage: Math.round((count / values.length) * 100),
      }))
      .sort((a, b) => a.value - b.value),
  }
}

function calculateNPSAnalytics(answers: any[]) {
  const scores = answers
    .map(a => Number(a.numberValue))
    .filter(val => !isNaN(val) && val >= 0 && val <= 10)
  
  if (scores.length === 0) return { nps: 0, distribution: {} }
  
  const promoters = scores.filter(score => score >= 9).length
  const passives = scores.filter(score => score >= 7 && score <= 8).length
  const detractors = scores.filter(score => score <= 6).length
  
  return {
    nps: calculateNPS(scores),
    distribution: {
      promoters: { count: promoters, percentage: Math.round((promoters / scores.length) * 100) },
      passives: { count: passives, percentage: Math.round((passives / scores.length) * 100) },
      detractors: { count: detractors, percentage: Math.round((detractors / scores.length) * 100) },
    },
  }
}

function calculateTextAnalytics(answers: any[]) {
  const textResponses = answers
    .filter(a => a.textValue && a.textValue.length > 0)
    .map(a => a.textValue)
  
  return {
    responseCount: textResponses.length,
    averageLength: textResponses.length > 0 
      ? Math.round(calculateAverage(textResponses.map(text => text.length)))
      : 0,
    wordCount: textResponses.reduce((total, text) => {
      return total + text.split(/\s+/).filter(word => word.length > 0).length
    }, 0),
  }
}

function getTopItems(items: string[]) {
  const counts: Record<string, number> = {}
  
  items.forEach(item => {
    if (item && typeof item === 'string') {
      counts[item] = (counts[item] || 0) + 1
    }
  })
  
  return Object.entries(counts)
    .map(([item, count]) => ({ item, count }))
    .sort((a, b) => b.count - a.count)
}

function generateTrendData(responses: any[], groupBy: string, startDate: Date, endDate: Date) {
  const intervals = generateDateIntervals(startDate, endDate, groupBy)
  
  return intervals.map(interval => {
    const periodResponses = responses.filter(r => {
      const responseDate = new Date(r.createdAt)
      return responseDate >= interval.start && responseDate < interval.end
    })
    
    // Calculate various metrics for this period
    const sentiments = periodResponses
      .flatMap(r => r.sentimentAnalysis)
      .filter(Boolean)
    
    return {
      period: interval.start.toISOString().split('T')[0],
      responseCount: periodResponses.length,
      avgSentiment: sentiments.length > 0 
        ? calculateAverage(sentiments.map(s => s.overallScore))
        : 0,
      completionRate: 85, // Placeholder
    }
  })
}