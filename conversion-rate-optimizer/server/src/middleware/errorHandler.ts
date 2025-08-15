import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    error = handlePrismaError(err);
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    error = handlePrismaValidationError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }

  // Cast errors
  if (err.name === 'CastError') {
    error = handleCastError(err);
  }

  // Duplicate key errors
  if ((err as any).code === 11000) {
    error = handleDuplicateFieldsError(err);
  }

  sendErrorResponse(error, req, res);
};

const handlePrismaError = (err: Prisma.PrismaClientKnownRequestError): AppError => {
  let message = 'Database error';
  let statusCode = 500;
  let code = 'DATABASE_ERROR';

  switch (err.code) {
    case 'P2002':
      // Unique constraint violation
      const target = (err.meta?.target as string[]) || [];
      message = `Duplicate value for ${target.join(', ')}`;
      statusCode = 409;
      code = 'DUPLICATE_VALUE';
      break;
    case 'P2025':
      // Record not found
      message = 'Record not found';
      statusCode = 404;
      code = 'RECORD_NOT_FOUND';
      break;
    case 'P2003':
      // Foreign key constraint violation
      message = 'Invalid reference to related record';
      statusCode = 400;
      code = 'INVALID_REFERENCE';
      break;
    case 'P2021':
      // Table does not exist
      message = 'Database table not found';
      statusCode = 500;
      code = 'TABLE_NOT_FOUND';
      break;
    case 'P2022':
      // Column does not exist
      message = 'Database column not found';
      statusCode = 500;
      code = 'COLUMN_NOT_FOUND';
      break;
    default:
      message = err.message || 'Database error occurred';
  }

  return {
    name: 'PrismaError',
    message,
    statusCode,
    code,
    isOperational: true,
  };
};

const handlePrismaValidationError = (err: Prisma.PrismaClientValidationError): AppError => {
  return {
    name: 'ValidationError',
    message: 'Invalid data provided',
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    isOperational: true,
  };
};

const handleJWTError = (): AppError => {
  return {
    name: 'JsonWebTokenError',
    message: 'Invalid authentication token',
    statusCode: 401,
    code: 'INVALID_TOKEN',
    isOperational: true,
  };
};

const handleJWTExpiredError = (): AppError => {
  return {
    name: 'TokenExpiredError',
    message: 'Authentication token has expired',
    statusCode: 401,
    code: 'TOKEN_EXPIRED',
    isOperational: true,
  };
};

const handleValidationError = (err: any): AppError => {
  const errors = Object.values(err.errors).map((val: any) => val.message);
  return {
    name: 'ValidationError',
    message: `Invalid input data: ${errors.join(', ')}`,
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    isOperational: true,
  };
};

const handleCastError = (err: any): AppError => {
  return {
    name: 'CastError',
    message: `Invalid ${err.path}: ${err.value}`,
    statusCode: 400,
    code: 'INVALID_DATA_TYPE',
    isOperational: true,
  };
};

const handleDuplicateFieldsError = (err: any): AppError => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  return {
    name: 'DuplicateFieldError',
    message: `Duplicate field value: ${value}. Please use another value!`,
    statusCode: 409,
    code: 'DUPLICATE_FIELD',
    isOperational: true,
  };
};

const sendErrorResponse = (err: AppError, req: Request, res: Response) => {
  const { statusCode = 500, message, code } = err;

  // Development error response
  if (process.env.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status: 'error',
      error: err,
      message,
      code,
      stack: err.stack,
    });
  }

  // Production error response
  if (err.isOperational) {
    // Operational, trusted error: send message to client
    return res.status(statusCode).json({
      status: 'error',
      message,
      code,
    });
  }

  // Programming or other unknown error: don't leak error details
  return res.status(500).json({
    status: 'error',
    message: 'Something went wrong!',
    code: 'INTERNAL_SERVER_ERROR',
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Create operational error
export const createError = (
  message: string,
  statusCode: number = 500,
  code?: string
): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.isOperational = true;
  return error;
};