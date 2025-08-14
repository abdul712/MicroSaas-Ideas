import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

// Generic validation middleware factory
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
  headers?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate headers
      if (schema.headers) {
        req.headers = schema.headers.parse(req.headers);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new ValidationError(
          `Validation failed: ${formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')}`,
          formattedErrors[0]?.field,
          formattedErrors
        );
      }
      
      next(error);
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Pagination
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Date range
  dateRange: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }).refine(data => {
    if (data.start_date && data.end_date) {
      return new Date(data.start_date) <= new Date(data.end_date);
    }
    return true;
  }, {
    message: 'End date must be after start date',
    path: ['end_date'],
  }),

  // Email validation
  email: z.string().email('Invalid email format').toLowerCase(),

  // Password validation
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),

  // Organization name
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_\.]+$/, 'Organization name contains invalid characters'),

  // User role
  userRole: z.enum(['admin', 'manager', 'analyst', 'viewer']),

  // Integration type
  integrationType: z.enum(['salesforce', 'hubspot', 'pipedrive', 'stripe', 'paypal', 'shopify', 'woocommerce']),

  // Metric type
  metricType: z.enum(['revenue', 'deals_count', 'pipeline_value', 'conversion_rate', 'avg_deal_size']),

  // Dashboard configuration
  dashboardConfig: z.object({
    layout: z.enum(['grid', 'flow']).default('grid'),
    widgets: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({
        x: z.number().min(0),
        y: z.number().min(0),
        w: z.number().min(1).max(12),
        h: z.number().min(1).max(12),
      }),
      config: z.record(z.unknown()).optional(),
    })).default([]),
    filters: z.record(z.unknown()).optional(),
    theme: z.string().optional(),
  }),
};

// Auth validation schemas
export const authSchemas = {
  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1, 'First name is required').max(50),
    lastName: z.string().min(1, 'Last name is required').max(50),
    organizationName: commonSchemas.organizationName,
    timezone: z.string().optional(),
  }),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),

  forgotPassword: z.object({
    email: commonSchemas.email,
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: commonSchemas.password,
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
};

// Analytics validation schemas
export const analyticsSchemas = {
  getMetrics: z.object({
    query: z.object({
      metric_types: z.string().optional(),
      ...commonSchemas.dateRange.shape,
      granularity: z.enum(['hour', 'day', 'week', 'month', 'quarter', 'year']).default('day'),
      dimensions: z.string().optional(),
      ...commonSchemas.pagination.shape,
    }),
  }),

  addMetric: z.object({
    body: z.object({
      metric_type: commonSchemas.metricType,
      value: z.number(),
      currency: z.string().length(3).default('USD'),
      dimensions: z.record(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
      timestamp: z.string().datetime().optional(),
    }),
  }),

  getKPIs: z.object({
    query: z.object({
      period: z.enum(['today', 'week', 'month', 'quarter', 'year']).default('month'),
      compare_previous: z.string().transform(Boolean).default('true'),
    }),
  }),

  generateForecast: z.object({
    body: z.object({
      forecast_type: z.enum(['revenue', 'deals', 'pipeline']),
      time_period: z.enum(['monthly', 'quarterly', 'yearly']),
      horizon_months: z.number().min(1).max(24).default(12),
      include_seasonality: z.boolean().default(true),
      include_holidays: z.boolean().default(true),
    }),
  }),
};

// Dashboard validation schemas
export const dashboardSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, 'Dashboard name is required').max(255),
      description: z.string().max(1000).optional(),
      config: commonSchemas.dashboardConfig,
      is_public: z.boolean().default(false),
      tags: z.array(z.string()).default([]),
    }),
  }),

  update: z.object({
    params: z.object({
      dashboard_id: commonSchemas.uuid,
    }),
    body: z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
      config: commonSchemas.dashboardConfig.optional(),
      is_public: z.boolean().optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),

  get: z.object({
    params: z.object({
      dashboard_id: commonSchemas.uuid,
    }),
  }),

  list: z.object({
    query: z.object({
      is_public: z.string().transform(Boolean).optional(),
      tags: z.string().optional(),
      search: z.string().optional(),
      ...commonSchemas.pagination.shape,
    }),
  }),

  share: z.object({
    params: z.object({
      dashboard_id: commonSchemas.uuid,
    }),
    body: z.object({
      shared_with: commonSchemas.uuid,
      permission: z.enum(['view', 'edit']).default('view'),
    }),
  }),
};

// Integration validation schemas
export const integrationSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, 'Integration name is required').max(255),
      type: commonSchemas.integrationType,
      config: z.record(z.unknown()),
      sync_frequency: z.enum(['realtime', 'hourly', 'daily']).default('hourly'),
    }),
  }),

  update: z.object({
    params: z.object({
      integration_id: commonSchemas.uuid,
    }),
    body: z.object({
      name: z.string().min(1).max(255).optional(),
      config: z.record(z.unknown()).optional(),
      sync_frequency: z.enum(['realtime', 'hourly', 'daily']).optional(),
    }),
  }),

  get: z.object({
    params: z.object({
      integration_id: commonSchemas.uuid,
    }),
  }),

  sync: z.object({
    params: z.object({
      integration_id: commonSchemas.uuid,
    }),
  }),
};

// Team validation schemas
export const teamSchemas = {
  create: z.object({
    body: z.object({
      name: z.string().min(1, 'Team name is required').max(255),
      description: z.string().max(1000).optional(),
      manager_id: commonSchemas.uuid.optional(),
      target_revenue: z.number().positive().optional(),
      target_period: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
    }),
  }),

  update: z.object({
    params: z.object({
      team_id: commonSchemas.uuid,
    }),
    body: z.object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
      manager_id: commonSchemas.uuid.optional(),
      target_revenue: z.number().positive().optional(),
      target_period: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    }),
  }),

  addMember: z.object({
    params: z.object({
      team_id: commonSchemas.uuid,
    }),
    body: z.object({
      user_id: commonSchemas.uuid,
      role: z.enum(['manager', 'member']).default('member'),
      quota: z.number().positive().optional(),
      quota_period: z.enum(['monthly', 'quarterly', 'yearly']).default('monthly'),
    }),
  }),

  getPerformance: z.object({
    params: z.object({
      team_id: commonSchemas.uuid,
    }),
    query: z.object({
      period: z.enum(['week', 'month', 'quarter', 'year']).default('month'),
      ...commonSchemas.dateRange.shape,
    }),
  }),
};

// User validation schemas
export const userSchemas = {
  create: z.object({
    body: z.object({
      email: commonSchemas.email,
      firstName: z.string().min(1, 'First name is required').max(50),
      lastName: z.string().min(1, 'Last name is required').max(50),
      role: commonSchemas.userRole.default('viewer'),
      timezone: z.string().optional(),
    }),
  }),

  update: z.object({
    params: z.object({
      user_id: commonSchemas.uuid,
    }),
    body: z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      role: commonSchemas.userRole.optional(),
      timezone: z.string().optional(),
      preferences: z.record(z.unknown()).optional(),
    }),
  }),

  updateProfile: z.object({
    body: z.object({
      firstName: z.string().min(1).max(50).optional(),
      lastName: z.string().min(1).max(50).optional(),
      timezone: z.string().optional(),
      preferences: z.record(z.unknown()).optional(),
    }),
  }),
};

// Middleware to validate request and transform data
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Add common transformations
  if (req.body) {
    // Trim string values
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }

  if (req.query) {
    // Transform query string booleans
    Object.keys(req.query).forEach(key => {
      const value = req.query[key] as string;
      if (value === 'true' || value === 'false') {
        req.query[key] = value === 'true';
      }
    });
  }

  next();
};

// Custom validation functions
export const customValidators = {
  isStrongPassword: (password: string): boolean => {
    const minLength = 8;
    const hasLowerCase = /[a-z]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);
    
    return password.length >= minLength && 
           hasLowerCase && 
           hasUpperCase && 
           hasNumbers && 
           hasNonalphas;
  },

  isValidDateRange: (startDate: string, endDate: string): boolean => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    return start <= end && start <= now && end <= now;
  },

  isValidTimezone: (timezone: string): boolean => {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  },

  isValidJSON: (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      return true;
    } catch {
      return false;
    }
  },
};