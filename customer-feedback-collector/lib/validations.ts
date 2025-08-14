import { z } from 'zod'

// ============================================================================
// AUTH VALIDATIONS
// ============================================================================

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ============================================================================
// SURVEY VALIDATIONS
// ============================================================================

export const questionSchema = z.object({
  type: z.enum(['TEXT', 'TEXTAREA', 'EMAIL', 'URL', 'NUMBER', 'PHONE', 'DATE', 
                'MULTIPLE_CHOICE', 'SINGLE_CHOICE', 'RATING', 'NPS', 'SCALE', 
                'MATRIX', 'FILE_UPLOAD', 'SIGNATURE']),
  title: z.string().min(1, 'Question title is required').max(500),
  description: z.string().max(1000).optional(),
  placeholder: z.string().max(100).optional(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    pattern: z.string().optional(),
    message: z.string().optional(),
  }).optional(),
  logic: z.object({
    showIf: z.object({
      questionId: z.string(),
      condition: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
      value: z.union([z.string(), z.number(), z.boolean()]),
    }).optional(),
    skipTo: z.string().optional(),
  }).optional(),
  order: z.number().min(0),
})

export const surveySchema = z.object({
  title: z.string().min(1, 'Survey title is required').max(200),
  description: z.string().max(1000).optional(),
  settings: z.object({
    allowMultipleSubmissions: z.boolean().default(false),
    requireAuth: z.boolean().default(false),
    collectEmail: z.boolean().default(false),
    showProgressBar: z.boolean().default(true),
    randomizeQuestions: z.boolean().default(false),
    autoSave: z.boolean().default(true),
    thankYouMessage: z.string().max(500).optional(),
    redirectUrl: z.string().url().optional(),
  }).optional(),
  theme: z.object({
    primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    backgroundColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    textColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    buttonColor: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
    fontFamily: z.string().max(50).optional(),
    borderRadius: z.number().min(0).max(20).optional(),
  }).optional(),
  responseLimit: z.number().min(1).optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
})

export const updateSurveySchema = surveySchema.partial().extend({
  id: z.string().cuid(),
})

// ============================================================================
// RESPONSE VALIDATIONS
// ============================================================================

export const answerSchema = z.object({
  questionId: z.string().cuid(),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.object({}).passthrough(),
  ]),
})

export const responseSchema = z.object({
  surveyId: z.string().cuid(),
  respondentId: z.string().optional(),
  sessionId: z.string().optional(),
  answers: z.array(answerSchema).min(1, 'At least one answer is required'),
  metadata: z.object({
    userAgent: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    referrer: z.string().url().optional(),
    source: z.string().optional(),
  }).optional(),
})

// ============================================================================
// WIDGET VALIDATIONS
// ============================================================================

export const widgetSchema = z.object({
  surveyId: z.string().cuid(),
  name: z.string().min(1, 'Widget name is required').max(100),
  type: z.enum(['POPUP', 'SLIDE_IN', 'EMBEDDED', 'FLOATING_TAB', 'INLINE', 'MODAL']),
  settings: z.object({
    delay: z.number().min(0).max(60000).optional(), // milliseconds
    showOnPages: z.array(z.string()).optional(),
    hideOnPages: z.array(z.string()).optional(),
    showAfterScroll: z.number().min(0).max(100).optional(), // percentage
    showOnExit: z.boolean().default(false),
    frequency: z.enum(['always', 'once_per_session', 'once_per_visitor']).default('once_per_session'),
  }).optional(),
  appearance: z.object({
    position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).default('bottom-right'),
    size: z.enum(['small', 'medium', 'large']).default('medium'),
    showCloseButton: z.boolean().default(true),
    overlay: z.boolean().default(true),
    animation: z.enum(['fade', 'slide', 'bounce', 'none']).default('fade'),
    customCSS: z.string().max(5000).optional(),
  }).optional(),
  triggers: z.object({
    timeDelay: z.number().min(0).optional(),
    scrollPercent: z.number().min(0).max(100).optional(),
    exitIntent: z.boolean().default(false),
    pageVisits: z.number().min(1).optional(),
    inactivity: z.number().min(0).optional(),
  }).optional(),
  targeting: z.object({
    countries: z.array(z.string()).optional(),
    devices: z.array(z.enum(['desktop', 'mobile', 'tablet'])).optional(),
    browsers: z.array(z.string()).optional(),
    referrers: z.array(z.string()).optional(),
    urlPatterns: z.array(z.string()).optional(),
  }).optional(),
})

export const updateWidgetSchema = widgetSchema.partial().extend({
  id: z.string().cuid(),
})

// ============================================================================
// ORGANIZATION VALIDATIONS
// ============================================================================

export const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  domain: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/, 'Invalid domain format').optional(),
  settings: z.object({
    timezone: z.string().optional(),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).default('MM/DD/YYYY'),
    language: z.string().default('en'),
    allowGuestResponses: z.boolean().default(true),
    dataRetentionDays: z.number().min(30).max(2555).default(365), // 7 years max
    enableAuditLogs: z.boolean().default(true),
    twoFactorRequired: z.boolean().default(false),
  }).optional(),
})

export const updateOrganizationSchema = organizationSchema.partial().extend({
  id: z.string().cuid(),
})

// ============================================================================
// USER VALIDATIONS
// ============================================================================

export const updateUserSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  image: z.string().url().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']).optional(),
})

export const inviteUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
  message: z.string().max(500).optional(),
})

// ============================================================================
// INTEGRATION VALIDATIONS
// ============================================================================

export const integrationSchema = z.object({
  type: z.enum(['WEBHOOK', 'SLACK', 'ZAPIER', 'HUBSPOT', 'SALESFORCE', 'MAILCHIMP', 'GOOGLE_SHEETS', 'NOTION']),
  name: z.string().min(1, 'Integration name is required').max(100),
  config: z.object({
    webhookUrl: z.string().url().optional(),
    apiKey: z.string().optional(),
    events: z.array(z.enum(['response_created', 'response_updated', 'survey_published', 'survey_closed'])).optional(),
    filters: z.object({
      surveyIds: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
    }).optional(),
  }),
})

// ============================================================================
// ANALYTICS VALIDATIONS
// ============================================================================

export const analyticsQuerySchema = z.object({
  surveyId: z.string().cuid(),
  dateRange: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
  metrics: z.array(z.enum(['response_count', 'completion_rate', 'average_time', 'nps_score', 'sentiment_score'])),
  groupBy: z.enum(['day', 'week', 'month', 'question', 'source']).optional(),
  filters: z.object({
    source: z.string().optional(),
    completed: z.boolean().optional(),
    sentiment: z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL', 'MIXED']).optional(),
  }).optional(),
})

// ============================================================================
// EXPORT VALIDATIONS
// ============================================================================

export const exportSchema = z.object({
  type: z.enum(['RESPONSES', 'ANALYTICS', 'CONTACTS', 'SURVEYS']),
  format: z.enum(['CSV', 'JSON', 'PDF', 'XLSX']),
  filters: z.object({
    surveyIds: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.string().datetime(),
      to: z.string().datetime(),
    }).optional(),
    status: z.enum(['COMPLETED', 'IN_PROGRESS', 'ABANDONED']).optional(),
    includePersonalData: z.boolean().default(false),
  }).optional(),
})

// ============================================================================
// API RESPONSE SCHEMAS
// ============================================================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    totalPages: z.number().optional(),
  }).optional(),
})

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type SurveyInput = z.infer<typeof surveySchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type ResponseInput = z.infer<typeof responseSchema>
export type WidgetInput = z.infer<typeof widgetSchema>
export type OrganizationInput = z.infer<typeof organizationSchema>
export type IntegrationInput = z.infer<typeof integrationSchema>
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
export type ExportInput = z.infer<typeof exportSchema>