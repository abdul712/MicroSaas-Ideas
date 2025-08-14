import { Request, Response, NextFunction } from 'express';
import { AppError, createErrorResponse, isOperationalError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // If response was already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const requestId = req.headers['x-request-id'] as string;
  const userId = (req as any).user?.id;

  // Log the error
  logger.error('Request error:', {
    error: error.message,
    stack: error.stack,
    requestId,
    userId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle known operational errors
  if (error instanceof AppError) {
    const errorResponse = createErrorResponse(
      error,
      requestId,
      config.env === 'development'
    );

    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    let statusCode = 500;
    let message = 'Database error';
    let code = 'DATABASE_ERROR';

    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        message = 'A record with this information already exists';
        code = 'DUPLICATE_RECORD';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        code = 'RECORD_NOT_FOUND';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Cannot delete record due to related data';
        code = 'FOREIGN_KEY_CONSTRAINT';
        break;
      case 'P2014':
        statusCode = 400;
        message = 'Invalid ID provided';
        code = 'INVALID_ID';
        break;
    }

    const appError = new AppError(message, statusCode, code);
    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors (Zod, Joi, etc.)
  if (error.name === 'ZodError') {
    const zodError = error as any;
    const message = zodError.errors.map((err: any) => 
      `${err.path.join('.')}: ${err.message}`
    ).join(', ');

    const appError = new AppError(
      `Validation error: ${message}`,
      400,
      'VALIDATION_ERROR'
    );

    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(400).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const appError = new AppError(
      'Invalid authentication token',
      401,
      'INVALID_TOKEN'
    );

    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(401).json(errorResponse);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const appError = new AppError(
      'Authentication token has expired',
      401,
      'TOKEN_EXPIRED'
    );

    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(401).json(errorResponse);
    return;
  }

  // Handle multer errors (file uploads)
  if (error.name === 'MulterError') {
    const multerError = error as any;
    let message = 'File upload error';
    let code = 'UPLOAD_ERROR';

    switch (multerError.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File size exceeds the maximum limit';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded';
        code = 'TOO_MANY_FILES';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        code = 'UNEXPECTED_FILE';
        break;
    }

    const appError = new AppError(message, 400, code);
    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(400).json(errorResponse);
    return;
  }

  // Handle syntax errors (malformed JSON, etc.)
  if (error instanceof SyntaxError && 'body' in error) {
    const appError = new AppError(
      'Invalid JSON format',
      400,
      'INVALID_JSON'
    );

    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(400).json(errorResponse);
    return;
  }

  // Handle rate limit errors
  if (error.message === 'Too many requests') {
    const appError = new AppError(
      'Too many requests. Please try again later.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );

    const errorResponse = createErrorResponse(
      appError,
      requestId,
      config.env === 'development'
    );

    res.status(429).json(errorResponse);
    return;
  }

  // Log unexpected errors with more detail
  if (!isOperationalError(error)) {
    logger.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      requestId,
      userId,
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
    });

    // Send error to monitoring service (Sentry, etc.)
    if (config.monitoring.sentryDsn) {
      // Sentry.captureException(error);
    }
  }

  // Default error response
  const defaultError = new AppError(
    config.env === 'production' 
      ? 'An internal server error occurred' 
      : error.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );

  const errorResponse = createErrorResponse(
    defaultError,
    requestId,
    config.env === 'development'
  );

  res.status(500).json(errorResponse);
};

// Handle uncaught exceptions and unhandled rejections
export const setupGlobalErrorHandlers = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    
    // Graceful shutdown
    process.exit(1);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    
    // Convert to error and throw to trigger uncaughtException
    throw new Error(`Unhandled Rejection: ${reason}`);
  });
};

// Middleware to add request ID
export const addRequestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || 
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new AppError(
    `Route ${req.method} ${req.originalUrl} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );

  const requestId = req.headers['x-request-id'] as string;
  const errorResponse = createErrorResponse(
    error,
    requestId,
    config.env === 'development'
  );

  res.status(404).json(errorResponse);
};