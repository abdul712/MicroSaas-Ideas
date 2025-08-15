import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { AppError, isOperationalError, createErrorResponse, getErrorSeverity } from '@/utils/errors'
import { logger } from '@/utils/logger'

// Error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  const severity = error instanceof AppError ? getErrorSeverity(error) : 'high'
  
  logger.error('Request error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    user: (req as any).user?.id,
    tenantId: (req as any).user?.tenantId,
    severity
  })

  // Handle operational errors
  if (error instanceof AppError) {
    const errorResponse = createErrorResponse(error)
    return res.status(error.statusCode).json(errorResponse)
  }

  // Handle validation errors from express-validator
  if (error.name === 'ValidationError') {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: (error as any).details || error.message
    })
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any
    
    switch (prismaError.code) {
      case 'P2002':
        return res.status(StatusCodes.CONFLICT).json({
          success: false,
          message: 'Unique constraint violation',
          code: 'DUPLICATE_ENTRY',
          field: prismaError.meta?.target
        })
        
      case 'P2025':
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Record not found',
          code: 'NOT_FOUND'
        })
        
      case 'P2003':
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Foreign key constraint failed',
          code: 'CONSTRAINT_ERROR'
        })
        
      default:
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: 'Database operation failed',
          code: 'DATABASE_ERROR'
        })
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Token expired',
      code: 'TOKEN_EXPIRED'
    })
  }

  // Handle multer file upload errors
  if (error.name === 'MulterError') {
    const multerError = error as any
    
    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(StatusCodes.PAYLOAD_TOO_LARGE).json({
          success: false,
          message: 'File too large',
          code: 'FILE_TOO_LARGE'
        })
        
      case 'LIMIT_FILE_COUNT':
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Too many files',
          code: 'TOO_MANY_FILES'
        })
        
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'Unexpected file field',
          code: 'UNEXPECTED_FILE'
        })
        
      default:
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'File upload error',
          code: 'UPLOAD_ERROR'
        })
    }
  }

  // Handle Redis connection errors
  if (error.message?.includes('Redis') || error.message?.includes('ECONNREFUSED')) {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      message: 'Cache service unavailable',
      code: 'CACHE_ERROR'
    })
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    })
  }

  // Handle timeout errors
  if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
    return res.status(StatusCodes.REQUEST_TIMEOUT).json({
      success: false,
      message: 'Request timeout',
      code: 'TIMEOUT'
    })
  }

  // Handle CORS errors
  if (error.message?.includes('CORS')) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'CORS policy violation',
      code: 'CORS_ERROR'
    })
  }

  // Handle memory/resource errors
  if (error.name === 'RangeError' || error.message?.includes('out of memory')) {
    return res.status(StatusCodes.INSUFFICIENT_STORAGE).json({
      success: false,
      message: 'Insufficient server resources',
      code: 'RESOURCE_ERROR'
    })
  }

  // Log unexpected errors with full context
  logger.error('Unexpected server error', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip
    },
    severity: 'critical'
  })

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Internal server error',
      code: 'INTERNAL_ERROR'
    })
  }

  // Development error response with full details
  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: error.message,
    code: 'INTERNAL_ERROR',
    stack: error.stack,
    name: error.name
  })
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'NOT_FOUND'
  })
}

// Global exception handler
export const globalExceptionHandler = () => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      severity: 'critical'
    })

    // Give the logger time to write the log
    setTimeout(() => {
      process.exit(1)
    }, 1000)
  })

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
      severity: 'critical'
    })

    // Convert to uncaught exception
    throw new Error(`Unhandled Promise Rejection: ${reason?.message || reason}`)
  })
}

export default errorHandler