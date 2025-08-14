import { NextRequest } from 'next/server'
import { prisma, createTenantClient } from '@/lib/prisma'
import { surveySchema } from '@/lib/validations'
import { 
  createProtectedHandler, 
  successResponse, 
  errorResponse, 
  ErrorCodes,
  parsePagination,
  createPaginationMeta,
  parseFilters
} from '@/lib/api-helpers'
import { generateSlug } from '@/lib/utils'

// GET /api/surveys - List surveys with pagination and filtering
export const GET = createProtectedHandler(async (request, { session }) => {
  const { searchParams } = new URL(request.url)
  const { page, limit, offset } = parsePagination(searchParams)
  const filters = parseFilters(searchParams)
  
  const tenantClient = createTenantClient(session.user.organizationId)
  
  // Build where clause
  const where: any = {}
  
  if (filters.status) {
    where.status = filters.status
  }
  
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ]
  }
  
  if (filters.dateRange) {
    where.createdAt = filters.dateRange
  }
  
  // Get surveys with pagination
  const [surveys, total] = await Promise.all([
    tenantClient.survey.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true },
        },
        _count: {
          select: {
            questions: true,
            responses: true,
          },
        },
        tags: true,
      },
      orderBy: { updatedAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.survey.count({
      where: {
        ...where,
        organizationId: session.user.organizationId,
      },
    }),
  ])
  
  return successResponse(
    surveys,
    createPaginationMeta(page, limit, total)
  )
})

// POST /api/surveys - Create a new survey
export const POST = createProtectedHandler(
  async (request, { session }) => {
    const body = await request.json()
    const validatedData = surveySchema.parse(body)
    
    const tenantClient = createTenantClient(session.user.organizationId)
    
    // Generate unique slug
    const baseSlug = generateSlug(validatedData.title)
    let slug = baseSlug
    let counter = 1
    
    while (await tenantClient.survey.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    try {
      const survey = await prisma.$transaction(async (tx) => {
        // Create survey
        const newSurvey = await tx.survey.create({
          data: {
            title: validatedData.title,
            description: validatedData.description,
            slug,
            settings: validatedData.settings || {},
            theme: validatedData.theme || {},
            organizationId: session.user.organizationId,
            userId: session.user.id,
          },
        })
        
        // Create questions
        if (validatedData.questions.length > 0) {
          await tx.question.createMany({
            data: validatedData.questions.map((question, index) => ({
              ...question,
              surveyId: newSurvey.id,
              order: question.order ?? index,
            })),
          })
        }
        
        return newSurvey
      })
      
      // Fetch survey with questions
      const surveyWithQuestions = await prisma.survey.findUnique({
        where: { id: survey.id },
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
      
      return successResponse(surveyWithQuestions, { message: 'Survey created successfully' })
    } catch (error) {
      console.error('Survey creation error:', error)
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to create survey',
        500
      )
    }
  },
  { requiredRoles: ['OWNER', 'ADMIN', 'MEMBER'] }
)