import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { responseSchema } from '@/lib/validations'
import { 
  createHandler, 
  createProtectedHandler,
  successResponse, 
  errorResponse, 
  ErrorCodes,
  parsePagination,
  createPaginationMeta,
  parseFilters,
  addCorsHeaders,
  handleCors
} from '@/lib/api-helpers'
import { calculateNPS, calculateCSAT } from '@/lib/utils'

// OPTIONS - Handle CORS preflight
export const OPTIONS = handleCors

// GET /api/responses - List responses (protected)
export const GET = createProtectedHandler(async (request, { session }) => {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parsePagination(searchParams)
  const filters = parseFilters(searchParams)
  
  // Build where clause
  const where: any = {
    organizationId: session.user.organizationId,
  }
  
  if (filters.status) {
    where.status = filters.status
  }
  
  if (filters.search) {
    where.OR = [
      {
        survey: {
          title: { contains: filters.search, mode: 'insensitive' },
        },
      },
      {
        respondent: {
          email: { contains: filters.search, mode: 'insensitive' },
        },
      },
    ]
  }
  
  if (filters.dateRange) {
    where.createdAt = filters.dateRange
  }
  
  // Get surveyId filter if provided
  const surveyId = searchParams.get('surveyId')
  if (surveyId) {
    where.surveyId = surveyId
  }
  
  // Get responses with pagination
  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      where,
      include: {
        survey: {
          select: { title: true, slug: true },
        },
        respondent: {
          select: { email: true, name: true },
        },
        answers: {
          include: {
            question: {
              select: { title: true, type: true },
            },
          },
        },
        sentimentAnalysis: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.response.count({ where }),
  ])
  
  return successResponse(
    responses,
    createPaginationMeta(page, limit, total)
  )
})

// POST /api/responses - Submit a response (public endpoint for widgets)
export const POST = createHandler(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = responseSchema.parse(body)
  
  // Verify survey exists and is published
  const survey = await prisma.survey.findUnique({
    where: { id: validatedData.surveyId },
    include: {
      questions: true,
      organization: true,
    },
  })
  
  if (!survey) {
    return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
  }
  
  if (survey.status !== 'PUBLISHED') {
    return errorResponse(
      ErrorCodes.VALIDATION_ERROR,
      'Survey is not accepting responses',
      400
    )
  }
  
  // Check response limit if set
  if (survey.responseLimit) {
    const responseCount = await prisma.response.count({
      where: { 
        surveyId: survey.id,
        status: 'COMPLETED',
      },
    })
    
    if (responseCount >= survey.responseLimit) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Survey has reached response limit',
        400
      )
    }
  }
  
  // Validate answers against questions
  const questionMap = new Map(survey.questions.map(q => [q.id, q]))
  
  for (const answer of validatedData.answers) {
    const question = questionMap.get(answer.questionId)
    if (!question) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid question ID: ${answer.questionId}`,
        400
      )
    }
    
    // Validate required questions
    if (question.required && (!answer.value || answer.value === '')) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        `Answer required for question: ${question.title}`,
        400
      )
    }
  }
  
  try {
    const response = await prisma.$transaction(async (tx) => {
      // Handle respondent
      let respondentId = validatedData.respondentId
      
      if (!respondentId && validatedData.metadata?.email) {
        // Find or create respondent
        const respondent = await tx.respondent.upsert({
          where: { email: validatedData.metadata.email },
          update: {},
          create: {
            email: validatedData.metadata.email,
            name: validatedData.metadata.name,
          },
        })
        respondentId = respondent.id
      }
      
      // Create response
      const newResponse = await tx.response.create({
        data: {
          surveyId: validatedData.surveyId,
          organizationId: survey.organizationId,
          respondentId,
          sessionId: validatedData.sessionId,
          status: 'COMPLETED',
          completedAt: new Date(),
          source: validatedData.metadata?.source,
          userAgent: validatedData.metadata?.userAgent,
          ipAddress: validatedData.metadata?.ipAddress,
          metadata: validatedData.metadata || {},
        },
      })
      
      // Create answers
      const answerData = validatedData.answers.map(answer => {
        const question = questionMap.get(answer.questionId)!
        return {
          responseId: newResponse.id,
          questionId: answer.questionId,
          value: answer.value,
          textValue: typeof answer.value === 'string' ? answer.value : null,
          numberValue: typeof answer.value === 'number' ? answer.value : null,
        }
      })
      
      await tx.answer.createMany({
        data: answerData,
      })
      
      return newResponse
    })
    
    // Calculate and store analytics (async)
    updateAnalytics(survey.id, response.id).catch(console.error)
    
    // Process AI analysis (async)
    if (process.env.ENABLE_AI_ANALYSIS === 'true') {
      processAIAnalysis(response.id, validatedData.answers).catch(console.error)
    }
    
    const responseWithAnswers = await prisma.response.findUnique({
      where: { id: response.id },
      include: {
        answers: {
          include: {
            question: {
              select: { title: true, type: true },
            },
          },
        },
      },
    })
    
    const result = successResponse(
      responseWithAnswers,
      { message: 'Response submitted successfully' }
    )
    
    return addCorsHeaders(result)
  } catch (error) {
    console.error('Response submission error:', error)
    return errorResponse(
      ErrorCodes.INTERNAL_ERROR,
      'Failed to submit response',
      500
    )
  }
})

// Background analytics update
async function updateAnalytics(surveyId: string, responseId: string) {
  try {
    // Get today's date range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Get survey responses for today
    const responses = await prisma.response.findMany({
      where: {
        surveyId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'COMPLETED',
      },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
      },
    })
    
    // Calculate metrics
    const responseCount = responses.length
    const completionRate = 100 // Simplified - would need to track starts vs completions
    
    // Calculate NPS if survey has NPS questions
    const npsAnswers = responses.flatMap(r => 
      r.answers
        .filter(a => a.question.type === 'NPS')
        .map(a => Number(a.numberValue))
        .filter(val => !isNaN(val))
    )
    
    const npsScore = npsAnswers.length > 0 ? calculateNPS(npsAnswers) : null
    
    // Calculate CSAT if survey has rating questions
    const ratingAnswers = responses.flatMap(r =>
      r.answers
        .filter(a => a.question.type === 'RATING')
        .map(a => Number(a.numberValue))
        .filter(val => !isNaN(val))
    )
    
    const csatScore = ratingAnswers.length > 0 ? calculateCSAT(ratingAnswers, 5) : null
    
    // Update analytics
    await prisma.analytics.upsert({
      where: {
        surveyId_metricType_periodStart: {
          surveyId,
          metricType: 'RESPONSE_RATE',
          periodStart: today,
        },
      },
      update: {
        metrics: {
          responseCount,
          completionRate,
          npsScore,
          csatScore,
        },
        periodEnd: tomorrow,
      },
      create: {
        surveyId,
        metricType: 'RESPONSE_RATE',
        metrics: {
          responseCount,
          completionRate,
          npsScore,
          csatScore,
        },
        periodStart: today,
        periodEnd: tomorrow,
        granularity: 'day',
      },
    })
  } catch (error) {
    console.error('Analytics update error:', error)
  }
}

// Background AI analysis
async function processAIAnalysis(responseId: string, answers: any[]) {
  try {
    // This would integrate with OpenAI API
    // For now, we'll create a placeholder analysis
    const textAnswers = answers
      .filter(answer => typeof answer.value === 'string' && answer.value.length > 10)
      .map(answer => answer.value as string)
    
    if (textAnswers.length === 0) return
    
    // Placeholder sentiment analysis
    const overallSentiment = Math.random() > 0.6 ? 'POSITIVE' : 
                             Math.random() > 0.3 ? 'NEUTRAL' : 'NEGATIVE'
    
    await prisma.sentimentAnalysis.create({
      data: {
        responseId,
        overallScore: Math.random() * 2 - 1, // -1 to 1
        sentiment: overallSentiment,
        confidence: Math.random() * 0.5 + 0.5, // 0.5 to 1
        topics: ['general feedback'],
        keywords: ['feedback', 'experience'],
        language: 'en',
      },
    })
  } catch (error) {
    console.error('AI analysis error:', error)
  }
}