import { NextRequest } from 'next/server'
import { prisma, createTenantClient } from '@/lib/prisma'
import { updateSurveySchema } from '@/lib/validations'
import { 
  createProtectedHandler, 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  validateTenantAccess
} from '@/lib/api-helpers'

interface Context {
  params: { id: string }
  session: any
}

// GET /api/surveys/[id] - Get survey by ID
export const GET = createProtectedHandler(async (request, { params, session }: Context) => {
  const survey = await prisma.survey.findUnique({
    where: { id: params.id },
    include: {
      questions: {
        orderBy: { order: 'asc' },
      },
      user: {
        select: { name: true, email: true },
      },
      _count: {
        select: {
          responses: true,
          widgets: true,
        },
      },
      tags: true,
      analytics: {
        where: {
          periodStart: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: { periodStart: 'desc' },
      },
    },
  })
  
  if (!survey) {
    return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
  }
  
  // Validate tenant access
  validateTenantAccess(survey.organizationId, session.user.organizationId)
  
  return successResponse(survey)
})

// PUT /api/surveys/[id] - Update survey
export const PUT = createProtectedHandler(
  async (request, { params, session }: Context) => {
    const body = await request.json()
    const validatedData = updateSurveySchema.parse(body)
    
    // Check if survey exists and belongs to organization
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: params.id },
    })
    
    if (!existingSurvey) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
    }
    
    validateTenantAccess(existingSurvey.organizationId, session.user.organizationId)
    
    try {
      const updatedSurvey = await prisma.$transaction(async (tx) => {
        // Update survey
        const survey = await tx.survey.update({
          where: { id: params.id },
          data: {
            title: validatedData.title,
            description: validatedData.description,
            settings: validatedData.settings,
            theme: validatedData.theme,
            responseLimit: validatedData.responseLimit,
          },
        })
        
        // Update questions if provided
        if (validatedData.questions) {
          // Delete existing questions
          await tx.question.deleteMany({
            where: { surveyId: params.id },
          })
          
          // Create new questions
          if (validatedData.questions.length > 0) {
            await tx.question.createMany({
              data: validatedData.questions.map((question, index) => ({
                ...question,
                surveyId: params.id,
                order: question.order ?? index,
              })),
            })
          }
        }
        
        return survey
      })
      
      // Fetch updated survey with questions
      const surveyWithQuestions = await prisma.survey.findUnique({
        where: { id: updatedSurvey.id },
        include: {
          questions: {
            orderBy: { order: 'asc' },
          },
          user: {
            select: { name: true, email: true },
          },
          _count: {
            select: {
              questions: true,
              responses: true,
            },
          },
        },
      })
      
      return successResponse(surveyWithQuestions, { message: 'Survey updated successfully' })
    } catch (error) {
      console.error('Survey update error:', error)
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to update survey',
        500
      )
    }
  },
  { requiredRoles: ['OWNER', 'ADMIN', 'MEMBER'] }
)

// DELETE /api/surveys/[id] - Delete survey
export const DELETE = createProtectedHandler(
  async (request, { params, session }: Context) => {
    // Check if survey exists and belongs to organization
    const existingSurvey = await prisma.survey.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            responses: true,
          },
        },
      },
    })
    
    if (!existingSurvey) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
    }
    
    validateTenantAccess(existingSurvey.organizationId, session.user.organizationId)
    
    // Prevent deletion of surveys with responses (soft delete instead)
    if (existingSurvey._count.responses > 0) {
      await prisma.survey.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED' },
      })
      
      return successResponse(
        { archived: true },
        { message: 'Survey archived (contains responses)' }
      )
    }
    
    try {
      await prisma.survey.delete({
        where: { id: params.id },
      })
      
      return successResponse(
        { deleted: true },
        { message: 'Survey deleted successfully' }
      )
    } catch (error) {
      console.error('Survey deletion error:', error)
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to delete survey',
        500
      )
    }
  },
  { requiredRoles: ['OWNER', 'ADMIN', 'MEMBER'] }
)