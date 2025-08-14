import { type Organization, type User, type Customer, type Segment, type Event, type Campaign, type Integration, type Prediction } from '@prisma/client'

// Extended types with relationships
export type OrganizationWithUsers = Organization & {
  users: User[]
  _count: {
    customers: number
    segments: number
    campaigns: number
  }
}

export type CustomerWithSegments = Customer & {
  segments: {
    segment: Segment
    joinedAt: Date
    confidenceScore?: number
  }[]
  events: Event[]
  predictions: Prediction[]
}

export type SegmentWithStats = Segment & {
  _count: {
    memberships: number
  }
  organization: Organization
  memberships: {
    customer: Customer
    joinedAt: Date
    confidenceScore?: number
  }[]
}

export type CampaignWithSegment = Campaign & {
  segment?: Segment
  organization: Organization
}

export type IntegrationWithStats = Integration & {
  organization: Organization
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// Segmentation types
export interface SegmentRule {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
  value: any
  logic?: 'AND' | 'OR'
}

export interface SegmentCriteria {
  rules: SegmentRule[]
  logic: 'AND' | 'OR'
}

export interface RFMScores {
  recency: number
  frequency: number
  monetary: number
  segment: string
}

// ML Model types
export interface MLModelConfig {
  type: 'kmeans' | 'dbscan' | 'hierarchical' | 'rfm' | 'custom'
  parameters: Record<string, any>
  features: string[]
}

export interface ClusteringResult {
  clusterId: number
  confidence: number
  features: Record<string, number>
}

export interface PredictionResult {
  type: 'churn' | 'clv' | 'next_purchase' | 'category_preference'
  value: number
  confidence: number
  explanation?: string
  factors?: Record<string, number>
}

// Analytics types
export interface CustomerMetrics {
  totalCustomers: number
  activeCustomers: number
  newCustomers: number
  churnedCustomers: number
  avgOrderValue: number
  totalRevenue: number
  customerGrowthRate: number
}

export interface SegmentMetrics {
  totalSegments: number
  avgSegmentSize: number
  topPerformingSegment: string
  segmentGrowthRate: number
}

export interface EngagementMetrics {
  emailOpenRate: number
  clickThroughRate: number
  conversionRate: number
  bounceRate: number
}

export interface DashboardMetrics {
  customers: CustomerMetrics
  segments: SegmentMetrics
  engagement: EngagementMetrics
  revenue: {
    current: number
    previous: number
    change: number
    forecast: number
  }
}

// Chart data types
export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
  color?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  comparison?: number
}

export interface SegmentDistribution {
  segmentName: string
  customerCount: number
  percentage: number
  revenue: number
  avgOrderValue: number
  color: string
}

// Integration types
export interface IntegrationConfig {
  platform: string
  credentials: Record<string, string>
  settings: {
    syncInterval?: number
    dataTypes?: string[]
    webhookUrl?: string
  }
}

export interface SyncStatus {
  lastSync: Date
  status: 'success' | 'error' | 'in_progress'
  recordsProcessed: number
  errorMessage?: string
}

// Export types
export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx'
  fields: string[]
  filters?: SegmentCriteria
  includeMetadata?: boolean
}

// Filter types
export interface DateRange {
  from: Date
  to: Date
}

export interface CustomerFilter {
  segments?: string[]
  dateRange?: DateRange
  totalSpent?: { min?: number; max?: number }
  orderCount?: { min?: number; max?: number }
  tags?: string[]
  location?: string[]
}

// Form types
export interface CreateSegmentForm {
  name: string
  description?: string
  type: 'MANUAL' | 'BEHAVIORAL' | 'RFM' | 'ML_CLUSTERING' | 'PREDICTIVE'
  criteria?: SegmentCriteria
  mlConfig?: MLModelConfig
}

export interface CreateCampaignForm {
  name: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'WEBHOOK' | 'EXPORT'
  segmentId?: string
  settings: Record<string, any>
  scheduledAt?: Date
}

export interface UpdateCustomerForm {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  attributes?: Record<string, any>
  tags?: string[]
}

// Notification types
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    url: string
  }
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Permission types
export type Permission = 
  | 'view_customers'
  | 'edit_customers'
  | 'create_segments'
  | 'edit_segments'
  | 'delete_segments'
  | 'create_campaigns'
  | 'edit_campaigns'
  | 'view_analytics'
  | 'manage_integrations'
  | 'manage_billing'
  | 'manage_users'
  | 'admin'

export interface UserPermissions {
  userId: string
  permissions: Permission[]
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
}