import { z } from 'zod'
import type { TrackingEvent } from '@/types/tracking'

// Base event schema
const baseEventSchema = z.object({
  type: z.string(),
  timestamp: z.number(),
  page_view_id: z.string().optional(),
  session_id: z.string().optional(),
  url: z.string().url().optional(),
})

// Click event schema
const clickEventSchema = baseEventSchema.extend({
  type: z.literal('click'),
  x: z.number().min(0).max(10000),
  y: z.number().min(0).max(50000),
  client_x: z.number().min(0).max(10000),
  client_y: z.number().min(0).max(10000),
  element_selector: z.string().max(500),
  element_path: z.string().max(1000).optional(),
  element_tag: z.string().max(50),
  element_text: z.string().max(500).optional(),
  element_attributes: z.record(z.string()).optional(),
  viewport_width: z.number().min(100).max(5000),
  viewport_height: z.number().min(100).max(5000),
})

// Mouse move event schema
const mouseMoveEventSchema = baseEventSchema.extend({
  type: z.literal('mouse_move'),
  x: z.number().min(0).max(10000),
  y: z.number().min(0).max(50000),
  client_x: z.number().min(0).max(10000),
  client_y: z.number().min(0).max(10000),
})

// Scroll event schema
const scrollEventSchema = baseEventSchema.extend({
  type: z.literal('scroll'),
  scroll_x: z.number().min(0).max(50000),
  scroll_y: z.number().min(0).max(500000),
  scroll_depth: z.number().min(0).max(100),
  viewport_width: z.number().min(100).max(5000),
  viewport_height: z.number().min(100).max(5000),
})

// Page view event schema
const pageViewEventSchema = baseEventSchema.extend({
  type: z.literal('page_view'),
  page_view_id: z.string(),
  session_id: z.string(),
  url: z.string().url(),
  title: z.string().max(500).optional(),
  referrer: z.string().url().or(z.literal('')).optional(),
  viewport_width: z.number().min(100).max(5000),
  viewport_height: z.number().min(100).max(5000),
  document_width: z.number().min(0).max(50000),
  document_height: z.number().min(0).max(500000),
  user_agent: z.string().max(1000).optional(),
  language: z.string().max(10).optional(),
  timezone: z.string().max(100).optional(),
})

// Custom event schema
const customEventSchema = baseEventSchema.extend({
  type: z.literal('custom'),
  event_name: z.string().max(100),
  properties: z.record(z.any()).optional(),
})

// Focus/blur event schema
const focusEventSchema = baseEventSchema.extend({
  type: z.enum(['focus', 'blur']),
  element_selector: z.string().max(500),
  element_path: z.string().max(1000).optional(),
  element_tag: z.string().max(50),
})

// Form submit event schema
const formSubmitEventSchema = baseEventSchema.extend({
  type: z.literal('form_submit'),
  element_selector: z.string().max(500),
  element_path: z.string().max(1000).optional(),
  form_action: z.string().max(500).optional(),
  form_method: z.string().max(10).optional(),
})

// Resize event schema
const resizeEventSchema = baseEventSchema.extend({
  type: z.literal('resize'),
  viewport_width: z.number().min(100).max(5000),
  viewport_height: z.number().min(100).max(5000),
})

// Page lifecycle event schema
const pageLifecycleEventSchema = baseEventSchema.extend({
  type: z.enum(['page_hide', 'page_show', 'visibility_change']),
  hidden: z.boolean().optional(),
})

// Union of all event schemas
const trackingEventSchema = z.discriminatedUnion('type', [
  clickEventSchema,
  mouseMoveEventSchema,
  scrollEventSchema,
  pageViewEventSchema,
  customEventSchema,
  focusEventSchema,
  formSubmitEventSchema,
  resizeEventSchema,
  pageLifecycleEventSchema,
])

export function validateTrackingEvent(event: any): TrackingEvent | null {
  try {
    // Basic validation
    if (!event || typeof event !== 'object') {
      throw new Error('Event must be an object')
    }

    if (!event.type || typeof event.type !== 'string') {
      throw new Error('Event type is required')
    }

    if (!event.timestamp || typeof event.timestamp !== 'number') {
      throw new Error('Event timestamp is required')
    }

    // Check timestamp is reasonable (not too old or in future)
    const now = Date.now()
    const eventTime = event.timestamp
    if (eventTime < now - 86400000 || eventTime > now + 3600000) { // 1 day old or 1 hour in future
      throw new Error('Event timestamp is out of acceptable range')
    }

    // Validate against schema
    const validatedEvent = trackingEventSchema.parse(event)

    // Additional sanitization
    return sanitizeEvent(validatedEvent)

  } catch (error) {
    console.warn('Event validation failed:', error)
    return null
  }
}

function sanitizeEvent(event: TrackingEvent): TrackingEvent {
  // Remove potentially sensitive information
  if ('element_text' in event && event.element_text) {
    // Remove common sensitive patterns
    const sensitivePatterns = [
      /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/, // Credit card numbers
      /\b\d{3}[\s\-]?\d{2}[\s\-]?\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{4}\b/, // Phone numbers
    ]

    for (const pattern of sensitivePatterns) {
      if (pattern.test(event.element_text)) {
        event.element_text = '[SENSITIVE_DATA_REMOVED]'
        break
      }
    }
  }

  // Sanitize URLs to remove sensitive query parameters
  if ('url' in event && event.url) {
    event.url = sanitizeUrl(event.url)
  }

  if ('referrer' in event && event.referrer) {
    event.referrer = sanitizeUrl(event.referrer)
  }

  return event
}

function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Remove sensitive query parameters
    const sensitiveParams = [
      'token', 'auth', 'session', 'key', 'password', 'secret',
      'api_key', 'access_token', 'refresh_token', 'bearer',
      'credit_card', 'ssn', 'social_security'
    ]

    for (const param of sensitiveParams) {
      urlObj.searchParams.delete(param)
    }

    return urlObj.toString()
  } catch {
    return url
  }
}

// Website configuration validation
export const websiteConfigSchema = z.object({
  domain: z.string().url().or(z.string().min(1)),
  name: z.string().min(1).max(100),
  trackingEnabled: z.boolean().default(true),
  privacyMode: z.boolean().default(false),
  retentionDays: z.number().min(1).max(365).default(90),
  allowedOrigins: z.array(z.string()).default([]),
})

// User settings validation
export const userSettingsSchema = z.object({
  timezone: z.string().max(50).optional(),
  dateFormat: z.enum(['US', 'EU', 'ISO']).default('US'),
  emailNotifications: z.boolean().default(true),
  weeklyReports: z.boolean().default(true),
})

// Analytics query validation
export const analyticsQuerySchema = z.object({
  websiteId: z.string(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  url: z.string().optional(),
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  country: z.string().length(2).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
})

export type WebsiteConfig = z.infer<typeof websiteConfigSchema>
export type UserSettings = z.infer<typeof userSettingsSchema>
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>