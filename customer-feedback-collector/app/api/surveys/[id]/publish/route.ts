import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
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

// POST /api/surveys/[id]/publish - Publish a survey
export const POST = createProtectedHandler(
  async (request, { params, session }: Context) => {
    // Check if survey exists and belongs to organization
    const survey = await prisma.survey.findUnique({
      where: { id: params.id },
      include: {
        questions: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    })
    
    if (!survey) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
    }
    
    validateTenantAccess(survey.organizationId, session.user.organizationId)
    
    // Validation checks before publishing
    if (survey._count.questions === 0) {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Cannot publish survey without questions',
        400
      )
    }
    
    if (survey.status === 'PUBLISHED') {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Survey is already published',
        400
      )
    }
    
    try {
      const updatedSurvey = await prisma.survey.update({
        where: { id: params.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
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
      
      return successResponse(updatedSurvey, { message: 'Survey published successfully' })
    } catch (error) {
      console.error('Survey publish error:', error)
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to publish survey',
        500
      )
    }
  },
  { requiredRoles: ['OWNER', 'ADMIN', 'MEMBER'] }
)

// POST /api/surveys/[id]/unpublish - Unpublish a survey
export const DELETE = createProtectedHandler(
  async (request, { params, session }: Context) => {
    // Check if survey exists and belongs to organization
    const survey = await prisma.survey.findUnique({
      where: { id: params.id },
    })
    
    if (!survey) {
      return errorResponse(ErrorCodes.NOT_FOUND, 'Survey not found', 404)
    }
    
    validateTenantAccess(survey.organizationId, session.user.organizationId)
    
    if (survey.status !== 'PUBLISHED') {
      return errorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Survey is not published',
        400
      )
    }
    
    try {
      const updatedSurvey = await prisma.survey.update({
        where: { id: params.id },
        data: {
          status: 'PAUSED',
        },
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
      
      return successResponse(updatedSurvey, { message: 'Survey unpublished successfully' })
    } catch (error) {
      console.error('Survey unpublish error:', error)
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to unpublish survey',
        500
      )
    }
  },
  { requiredRoles: ['OWNER', 'ADMIN', 'MEMBER'] }
)