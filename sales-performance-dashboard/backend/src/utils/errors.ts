import { StatusCodes } from 'http-status-codes'

// Base application error class
export class AppError extends Error {
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly code?: string
  public readonly context?: any

  constructor(
    message: string,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    code?: string,
    context?: any
  ) {
    super(message)
    
    this.name = this.constructor.name
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.code = code
    this.context = context

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor)
  }
}

// Authentication errors
export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed', context?: any) {
    super(message, StatusCodes.UNAUTHORIZED, true, 'AUTH_ERROR', context)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access', context?: any) {
    super(message, StatusCodes.UNAUTHORIZED, true, 'UNAUTHORIZED', context)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access forbidden', context?: any) {
    super(message, StatusCodes.FORBIDDEN, true, 'FORBIDDEN', context)
  }
}

export class TokenExpiredError extends AppError {
  constructor(message: string = 'Token has expired', context?: any) {
    super(message, StatusCodes.UNAUTHORIZED, true, 'TOKEN_EXPIRED', context)
  }
}

// Validation errors
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', context?: any) {
    super(message, StatusCodes.BAD_REQUEST, true, 'VALIDATION_ERROR', context)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', context?: any) {
    super(message, StatusCodes.BAD_REQUEST, true, 'BAD_REQUEST', context)
  }
}

// Resource errors
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: any) {
    super(`${resource} not found`, StatusCodes.NOT_FOUND, true, 'NOT_FOUND', context)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', context?: any) {
    super(message, StatusCodes.CONFLICT, true, 'CONFLICT', context)
  }
}

export class DuplicateResourceError extends AppError {
  constructor(resource: string = 'Resource', context?: any) {
    super(`${resource} already exists`, StatusCodes.CONFLICT, true, 'DUPLICATE_RESOURCE', context)
  }
}

// Rate limiting errors
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: any) {
    super(message, StatusCodes.TOO_MANY_REQUESTS, true, 'RATE_LIMIT_EXCEEDED', context)
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: any) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, true, 'DATABASE_ERROR', context)
  }
}

export class ConnectionError extends AppError {
  constructor(service: string = 'Service', context?: any) {
    super(`${service} connection failed`, StatusCodes.SERVICE_UNAVAILABLE, true, 'CONNECTION_ERROR', context)
  }
}

// Business logic errors
export class BusinessLogicError extends AppError {
  constructor(message: string = 'Business rule violation', context?: any) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, true, 'BUSINESS_LOGIC_ERROR', context)
  }
}

export class InsufficientPermissionsError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: any) {
    super(message, StatusCodes.FORBIDDEN, true, 'INSUFFICIENT_PERMISSIONS', context)
  }
}

export class QuotaExceededError extends AppError {
  constructor(quota: string = 'usage quota', context?: any) {
    super(`${quota} exceeded`, StatusCodes.PAYMENT_REQUIRED, true, 'QUOTA_EXCEEDED', context)
  }
}

// External service errors
export class ExternalServiceError extends AppError {
  constructor(service: string = 'External service', context?: any) {
    super(`${service} is unavailable`, StatusCodes.BAD_GATEWAY, true, 'EXTERNAL_SERVICE_ERROR', context)
  }
}

export class IntegrationError extends AppError {
  constructor(integration: string = 'Integration', context?: any) {
    super(`${integration} error`, StatusCodes.BAD_GATEWAY, true, 'INTEGRATION_ERROR', context)
  }
}

// File processing errors
export class FileProcessingError extends AppError {
  constructor(message: string = 'File processing failed', context?: any) {
    super(message, StatusCodes.UNPROCESSABLE_ENTITY, true, 'FILE_PROCESSING_ERROR', context)
  }
}

export class FileSizeError extends AppError {
  constructor(maxSize: string = '10MB', context?: any) {
    super(`File size exceeds maximum limit of ${maxSize}`, StatusCodes.PAYLOAD_TOO_LARGE, true, 'FILE_SIZE_ERROR', context)
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(allowedTypes: string[] = [], context?: any) {
    super(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`, StatusCodes.BAD_REQUEST, true, 'INVALID_FILE_TYPE', context)
  }
}

// Payment and subscription errors
export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed', context?: any) {
    super(message, StatusCodes.PAYMENT_REQUIRED, true, 'PAYMENT_ERROR', context)
  }
}

export class SubscriptionError extends AppError {
  constructor(message: string = 'Subscription error', context?: any) {
    super(message, StatusCodes.PAYMENT_REQUIRED, true, 'SUBSCRIPTION_ERROR', context)
  }
}

// Configuration errors
export class ConfigurationError extends AppError {
  constructor(message: string = 'Configuration error', context?: any) {
    super(message, StatusCodes.INTERNAL_SERVER_ERROR, false, 'CONFIGURATION_ERROR', context)
  }
}

export class EnvironmentError extends AppError {
  constructor(variable: string, context?: any) {
    super(`Environment variable ${variable} is not set`, StatusCodes.INTERNAL_SERVER_ERROR, false, 'ENVIRONMENT_ERROR', context)
  }
}

// Utility functions for error handling
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational
  }
  return false
}

export const createErrorResponse = (error: AppError) => {
  return {
    success: false,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      context: error.context
    })
  }
}

// Error factory for common scenarios
export const ErrorFactory = {
  // Authentication errors
  invalidCredentials: (context?: any) => 
    new AuthError('Invalid email or password', context),
  
  tokenRequired: (context?: any) => 
    new UnauthorizedError('Access token required', context),
  
  invalidToken: (context?: any) => 
    new AuthError('Invalid or malformed token', context),
  
  // Resource errors
  userNotFound: (context?: any) => 
    new NotFoundError('User', context),
  
  organizationNotFound: (context?: any) => 
    new NotFoundError('Organization', context),
  
  dashboardNotFound: (context?: any) => 
    new NotFoundError('Dashboard', context),
  
  // Validation errors
  invalidInput: (field: string, context?: any) => 
    new ValidationError(`Invalid ${field}`, context),
  
  requiredField: (field: string, context?: any) => 
    new ValidationError(`${field} is required`, context),
  
  // Business logic errors
  emailAlreadyExists: (context?: any) => 
    new ConflictError('Email address already exists', context),
  
  insufficientQuota: (resource: string, context?: any) => 
    new QuotaExceededError(`${resource} quota`, context),
  
  // External service errors
  crmConnectionFailed: (provider: string, context?: any) => 
    new IntegrationError(`${provider} CRM connection`, context),
  
  paymentProviderError: (provider: string, context?: any) => 
    new PaymentError(`${provider} payment processing`, context),
}

// Error classification for monitoring and alerting
export const getErrorSeverity = (error: AppError): 'low' | 'medium' | 'high' | 'critical' => {
  if (!error.isOperational) {
    return 'critical'
  }

  switch (error.statusCode) {
    case StatusCodes.INTERNAL_SERVER_ERROR:
    case StatusCodes.BAD_GATEWAY:
    case StatusCodes.SERVICE_UNAVAILABLE:
      return 'high'
    
    case StatusCodes.UNAUTHORIZED:
    case StatusCodes.FORBIDDEN:
    case StatusCodes.TOO_MANY_REQUESTS:
      return 'medium'
    
    default:
      return 'low'
  }
}

// Error metrics for monitoring
export const getErrorMetrics = (error: AppError) => {
  return {
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    severity: getErrorSeverity(error),
    isOperational: error.isOperational,
    timestamp: new Date().toISOString()
  }
}

export default AppError