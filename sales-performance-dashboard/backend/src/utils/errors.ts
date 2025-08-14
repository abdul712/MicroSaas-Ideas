/**
 * Custom error classes and error handling utilities
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly value?: any;

  constructor(
    message: string,
    field?: string,
    value?: any
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
    this.value = value;
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed', code: string = 'AUTH_FAILED') {
    super(message, 401, code);
  }
}

export class AuthorizationError extends AppError {
  public readonly requiredPermission?: string;

  constructor(
    message: string = 'Insufficient permissions',
    requiredPermission?: string
  ) {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
    this.requiredPermission = requiredPermission;
  }
}

export class NotFoundError extends AppError {
  public readonly resource?: string;

  constructor(message: string = 'Resource not found', resource?: string) {
    super(message, 404, 'NOT_FOUND');
    this.resource = resource;
  }
}

export class ConflictError extends AppError {
  public readonly conflictingField?: string;

  constructor(
    message: string = 'Resource conflict',
    conflictingField?: string
  ) {
    super(message, 409, 'CONFLICT');
    this.conflictingField = conflictingField;
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class IntegrationError extends AppError {
  public readonly provider?: string;
  public readonly providerError?: any;

  constructor(
    message: string,
    provider?: string,
    providerError?: any
  ) {
    super(message, 502, 'INTEGRATION_ERROR');
    this.provider = provider;
    this.providerError = providerError;
  }
}

export class DatabaseError extends AppError {
  public readonly operation?: string;
  public readonly table?: string;

  constructor(
    message: string,
    operation?: string,
    table?: string
  ) {
    super(message, 500, 'DATABASE_ERROR');
    this.operation = operation;
    this.table = table;
  }
}

export class SubscriptionError extends AppError {
  public readonly subscriptionStatus?: string;
  public readonly feature?: string;

  constructor(
    message: string,
    subscriptionStatus?: string,
    feature?: string
  ) {
    super(message, 402, 'SUBSCRIPTION_ERROR');
    this.subscriptionStatus = subscriptionStatus;
    this.feature = feature;
  }
}

// Error response interface
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    stack?: string;
  };
}

// Common error messages
export const ErrorMessages = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  TOKEN_MISSING: 'Authentication token is required',
  SESSION_EXPIRED: 'Session has expired',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  INSUFFICIENT_ROLE: 'Your role does not allow this action',
  ORGANIZATION_ACCESS_DENIED: 'Access to this organization is denied',
  
  // Validation
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_PASSWORD: 'Password must be at least 8 characters long',
  REQUIRED_FIELD: 'This field is required',
  INVALID_FORMAT: 'Invalid format provided',
  INVALID_DATE_RANGE: 'Invalid date range provided',
  
  // Resources
  USER_NOT_FOUND: 'User not found',
  ORGANIZATION_NOT_FOUND: 'Organization not found',
  DASHBOARD_NOT_FOUND: 'Dashboard not found',
  INTEGRATION_NOT_FOUND: 'Integration not found',
  TEAM_NOT_FOUND: 'Team not found',
  
  // Conflicts
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',
  ORGANIZATION_NAME_EXISTS: 'An organization with this name already exists',
  INTEGRATION_ALREADY_EXISTS: 'This integration already exists',
  
  // Subscription
  SUBSCRIPTION_INACTIVE: 'Your subscription is inactive',
  FEATURE_NOT_AVAILABLE: 'This feature is not available in your plan',
  USAGE_LIMIT_EXCEEDED: 'You have exceeded your usage limit',
  
  // Integration
  INTEGRATION_AUTH_FAILED: 'Failed to authenticate with integration provider',
  INTEGRATION_SYNC_FAILED: 'Data synchronization failed',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook verification failed',
  
  // General
  INTERNAL_SERVER_ERROR: 'An internal server error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  BAD_REQUEST: 'Invalid request',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later',
  
  // File uploads
  FILE_TOO_LARGE: 'File size exceeds the maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
} as const;

// Error code mappings
export const ErrorCodes = {
  // HTTP Status Code Mappings
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
} as const;

// Utility functions
export const createErrorResponse = (
  error: AppError,
  requestId?: string,
  includeStack: boolean = false
): ErrorResponse => {
  return {
    error: {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      requestId,
      ...(includeStack && { stack: error.stack }),
    },
  };
};

export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

// Predefined error factories
export const createValidationError = (field: string, message?: string): ValidationError => {
  return new ValidationError(
    message || `Invalid value for field: ${field}`,
    field
  );
};

export const createNotFoundError = (resource: string, id?: string): NotFoundError => {
  const message = id 
    ? `${resource} with ID ${id} not found`
    : `${resource} not found`;
  return new NotFoundError(message, resource);
};

export const createConflictError = (resource: string, field: string): ConflictError => {
  return new ConflictError(
    `${resource} with this ${field} already exists`,
    field
  );
};

export const createAuthError = (message?: string): AuthenticationError => {
  return new AuthenticationError(message);
};

export const createAuthzError = (permission?: string): AuthorizationError => {
  return new AuthorizationError(
    permission 
      ? `Permission required: ${permission}`
      : ErrorMessages.INSUFFICIENT_PERMISSIONS,
    permission
  );
};

export const createRateLimitError = (retryAfter?: number): RateLimitError => {
  return new RateLimitError(ErrorMessages.RATE_LIMIT_EXCEEDED, retryAfter);
};

export const createSubscriptionError = (
  feature?: string,
  status?: string
): SubscriptionError => {
  const message = feature 
    ? `Feature '${feature}' is not available in your current plan`
    : ErrorMessages.SUBSCRIPTION_INACTIVE;
  return new SubscriptionError(message, status, feature);
};

export const createIntegrationError = (
  provider: string,
  message?: string,
  providerError?: any
): IntegrationError => {
  return new IntegrationError(
    message || `Integration error with ${provider}`,
    provider,
    providerError
  );
};

// Error handling helpers
export const handleDatabaseError = (error: any, operation?: string, table?: string): DatabaseError => {
  let message = 'Database operation failed';
  
  if (error.code === 'P2002') {
    // Unique constraint violation
    message = 'A record with this information already exists';
  } else if (error.code === 'P2025') {
    // Record not found
    message = 'Record not found';
  } else if (error.code === 'P2003') {
    // Foreign key constraint violation
    message = 'Cannot delete record due to related data';
  }
  
  return new DatabaseError(message, operation, table);
};

export const handleAsyncError = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Type guards
export const isAppError = (error: any): error is AppError => {
  return error instanceof AppError;
};

export const isValidationError = (error: any): error is ValidationError => {
  return error instanceof ValidationError;
};

export const isAuthenticationError = (error: any): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

export const isAuthorizationError = (error: any): error is AuthorizationError => {
  return error instanceof AuthorizationError;
};

export const isNotFoundError = (error: any): error is NotFoundError => {
  return error instanceof NotFoundError;
};

export const isConflictError = (error: any): error is ConflictError => {
  return error instanceof ConflictError;
};

export const isRateLimitError = (error: any): error is RateLimitError => {
  return error instanceof RateLimitError;
};

export const isIntegrationError = (error: any): error is IntegrationError => {
  return error instanceof IntegrationError;
};

export const isDatabaseError = (error: any): error is DatabaseError => {
  return error instanceof DatabaseError;
};