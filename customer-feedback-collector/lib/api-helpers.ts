import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { rateLimiters, getClientIdentifier } from './rate-limit'
import { ZodError } from 'zod'

// Error codes
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TENANT_MISMATCH: 'TENANT_MISMATCH',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
} as const

// API Response helpers
export function successResponse(data: any, meta?: any) {
  return NextResponse.json({
    success: true,
    data,
    meta,
  })
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  )
}

// Authentication middleware
export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  return session
}

// Permission middleware
export function requireRole(allowedRoles: string[]) {
  return (session: any) => {
    if (!allowedRoles.includes(session.user.role)) {
      throw new Error('Forbidden')
    }
  }
}

// Rate limiting middleware
export async function withRateLimit(
  request: NextRequest,
  limiterName: keyof typeof rateLimiters = 'api'
) {
  const identifier = getClientIdentifier(request)
  const limiter = rateLimiters[limiterName]
  const result = await limiter.limit(identifier)
  
  if (!result.success) {
    throw new Error('Rate limit exceeded')
  }
  
  return result
}

// Request handler wrapper with error handling
export function createHandler(
  handler: (
    request: NextRequest,
    context: { params?: any }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: { params?: any }) => {
    try {
      return await handler(request, context)
    } catch (error) {
      console.error('API Error:', error)
      
      if (error instanceof ZodError) {
        return errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          400,
          error.errors
        )
      }
      
      if (error instanceof Error) {
        switch (error.message) {
          case 'Unauthorized':
            return errorResponse(
              ErrorCodes.UNAUTHORIZED,
              'Authentication required',
              401
            )
          case 'Forbidden':
            return errorResponse(
              ErrorCodes.FORBIDDEN,
              'Insufficient permissions',
              403
            )
          case 'Not found':
            return errorResponse(
              ErrorCodes.NOT_FOUND,
              'Resource not found',
              404
            )
          case 'Rate limit exceeded':
            return errorResponse(
              ErrorCodes.RATE_LIMIT_EXCEEDED,
              'Too many requests',
              429
            )
          default:
            return errorResponse(
              ErrorCodes.INTERNAL_ERROR,
              'Internal server error',
              500
            )
        }
      }
      
      return errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'Internal server error',
        500
      )
    }
  }
}

// Protected handler with auth and rate limiting
export function createProtectedHandler(
  handler: (
    request: NextRequest,
    context: { params?: any; session: any }
  ) => Promise<NextResponse>,
  options: {
    rateLimiter?: keyof typeof rateLimiters
    requiredRoles?: string[]
  } = {}
) {
  return createHandler(async (request, context) => {
    // Rate limiting
    const rateLimitResult = await withRateLimit(
      request,
      options.rateLimiter || 'api'
    )
    
    // Authentication
    const session = await requireAuth(request)
    
    // Authorization
    if (options.requiredRoles) {
      requireRole(options.requiredRoles)(session)
    }
    
    // Add rate limit headers
    const response = await handler(request, { ...context, session })
    
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
    
    return response
  })
}

// Pagination helpers
export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
  const offset = (page - 1) * limit
  
  return { page, limit, offset }
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

// Tenant isolation helper
export function validateTenantAccess(
  resourceOrganizationId: string,
  userOrganizationId: string
) {
  if (resourceOrganizationId !== userOrganizationId) {
    throw new Error('Forbidden')
  }
}

// Search and filter helpers
export function parseFilters(searchParams: URLSearchParams) {
  const filters: Record<string, any> = {}
  
  // Common filter patterns
  const status = searchParams.get('status')
  if (status) filters.status = status
  
  const search = searchParams.get('search')
  if (search) filters.search = search
  
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  if (dateFrom && dateTo) {
    filters.dateRange = {
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    }
  }
  
  return filters
}

// CORS headers for widget endpoints
export function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// Handle OPTIONS requests for CORS
export function handleCors() {
  const response = new NextResponse(null, { status: 200 })
  return addCorsHeaders(response)
}