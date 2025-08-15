export interface BaseEvent {
  type: string
  timestamp: number
  page_view_id?: string
  session_id?: string
  url?: string
}

export interface ClickEvent extends BaseEvent {
  type: 'click'
  x: number
  y: number
  client_x: number
  client_y: number
  element_selector: string
  element_path?: string
  element_tag: string
  element_text?: string
  element_attributes?: Record<string, any>
  viewport_width: number
  viewport_height: number
}

export interface MouseMoveEvent extends BaseEvent {
  type: 'mouse_move'
  x: number
  y: number
  client_x: number
  client_y: number
}

export interface ScrollEvent extends BaseEvent {
  type: 'scroll'
  scroll_x: number
  scroll_y: number
  scroll_depth: number
  viewport_width: number
  viewport_height: number
}

export interface PageViewEvent extends BaseEvent {
  type: 'page_view'
  page_view_id: string
  session_id: string
  url: string
  title?: string
  referrer?: string
  viewport_width: number
  viewport_height: number
  document_width: number
  document_height: number
  user_agent?: string
  language?: string
  timezone?: string
}

export interface CustomEvent extends BaseEvent {
  type: 'custom'
  event_name: string
  properties?: Record<string, any>
}

export interface FocusEvent extends BaseEvent {
  type: 'focus' | 'blur'
  element_selector: string
  element_path?: string
  element_tag: string
}

export interface FormSubmitEvent extends BaseEvent {
  type: 'form_submit'
  element_selector: string
  element_path?: string
  form_action?: string
  form_method?: string
}

export interface ResizeEvent extends BaseEvent {
  type: 'resize'
  viewport_width: number
  viewport_height: number
}

export interface PageLifecycleEvent extends BaseEvent {
  type: 'page_hide' | 'page_show' | 'visibility_change'
  hidden?: boolean
}

export type TrackingEvent = 
  | ClickEvent 
  | MouseMoveEvent 
  | ScrollEvent 
  | PageViewEvent 
  | CustomEvent 
  | FocusEvent 
  | FormSubmitEvent 
  | ResizeEvent 
  | PageLifecycleEvent

export interface ProcessingContext {
  userAgent: string
  ip: string
  timestamp: Date
}

export interface HeatmapPoint {
  x: number
  y: number
  intensity: number
  count: number
}

export interface HeatmapData {
  points: HeatmapPoint[]
  maxIntensity: number
  totalClicks: number
  viewport: {
    width: number
    height: number
  }
  document: {
    width: number
    height: number
  }
  dateRange: {
    from: Date
    to: Date
  }
}

export interface ScrollHeatmapData {
  segments: Array<{
    depth: number
    percentage: number
    count: number
  }>
  averageScrollDepth: number
  maxScrollDepth: number
  totalViews: number
  documentHeight: number
}

export interface RealTimeMetrics {
  activeSessions: number
  activeViewers: number
  todayViews: number
  timestamp: Date
}

export interface AnalyticsMetrics {
  pageViews: number
  uniqueVisitors: number
  bounceRate: number
  averageTimeOnPage: number
  topPages: Array<{
    url: string
    views: number
    percentage: number
  }>
  topReferrers: Array<{
    referrer: string
    views: number
    percentage: number
  }>
  deviceTypes: Array<{
    device: string
    count: number
    percentage: number
  }>
  countries: Array<{
    country: string
    count: number
    percentage: number
  }>
}

export interface SessionRecording {
  id: string
  sessionId: string
  startTime: Date
  endTime: Date
  duration: number
  events: TrackingEvent[]
  url: string
  viewportWidth: number
  viewportHeight: number
  compressed: boolean
}

export interface ConversionFunnel {
  id: string
  name: string
  steps: Array<{
    name: string
    url: string
    selector?: string
  }>
  results: Array<{
    step: number
    visitors: number
    conversions: number
    conversionRate: number
    dropoffRate: number
  }>
}

export interface ABTest {
  id: string
  name: string
  variants: Array<{
    name: string
    traffic: number
    selector: string
    changes: Record<string, any>
  }>
  metrics: Array<{
    variant: string
    visitors: number
    conversions: number
    conversionRate: number
    confidence: number
  }>
}

export interface AlertRule {
  id: string
  name: string
  condition: {
    metric: string
    operator: 'gt' | 'lt' | 'eq'
    value: number
    timeframe: number
  }
  actions: Array<{
    type: 'email' | 'webhook' | 'slack'
    config: Record<string, any>
  }>
  enabled: boolean
}

// Website and user types
export interface Website {
  id: string
  userId: string
  domain: string
  name: string
  trackingId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  settings: {
    privacyMode: boolean
    retentionDays: number
    allowedOrigins: string[]
  }
}

export interface User {
  id: string
  email: string
  name?: string
  planId: string
  createdAt: Date
  updatedAt: Date
  settings: {
    timezone: string
    dateFormat: string
    emailNotifications: boolean
    weeklyReports: boolean
  }
}

export interface Plan {
  id: string
  name: string
  price: number
  features: {
    websites: number
    pageViews: number
    dataRetention: number
    sessionRecordings: boolean
    heatmaps: boolean
    customEvents: boolean
    apiAccess: boolean
    support: string
  }
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Dashboard data types
export interface DashboardData {
  websites: Website[]
  recentActivity: TrackingEvent[]
  alerts: AlertRule[]
  metrics: AnalyticsMetrics
  realTime: RealTimeMetrics
}

export interface HeatmapFilters {
  dateRange: {
    from: Date
    to: Date
  }
  deviceType?: 'desktop' | 'mobile' | 'tablet'
  country?: string
  referrer?: string
  newVsReturning?: 'new' | 'returning'
  customSegment?: string
}