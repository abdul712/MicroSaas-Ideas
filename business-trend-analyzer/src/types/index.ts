// Organization types
export interface Organization {
  id: string
  name: string
  industry?: string
  timezone: string
  fiscalYearStart: number
  subscriptionTier: string
  createdAt: Date
  updatedAt: Date
}

export interface OrganizationMember {
  id: string
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  user: {
    id: string
    name?: string
    email: string
    image?: string
  }
}

// Data source and metric types
export interface DataSource {
  id: string
  organizationId: string
  type: string
  name: string
  connectionType: string
  config: Record<string, any>
  lastSync?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Metric {
  id: string
  organizationId: string
  dataSourceId?: string
  name: string
  category: string
  unit?: string
  aggregationType: string
  isCurrency: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  dataSource?: DataSource
}

// Analytics types
export interface TimeSeriesData {
  id: string
  organizationId: string
  metricId: string
  dataSourceId?: string
  timestamp: Date
  value: number
  dimensions?: Record<string, any>
  createdAt: Date
}

export interface Trend {
  id: string
  organizationId: string
  metricId: string
  trendType: string
  direction: string
  strength: number
  confidence: number
  periodStart: Date
  periodEnd: Date
  detectedAt: Date
  metadata?: Record<string, any>
  createdAt: Date
}

export interface Prediction {
  id: string
  organizationId: string
  metricId: string
  predictionDate: Date
  predictedValue: number
  confidenceInterval: {
    lower: number
    upper: number
  }
  modelType: string
  accuracyScore?: number
  metadata?: Record<string, any>
  createdAt: Date
}

// Insight types
export interface Insight {
  id: string
  organizationId: string
  userId?: string
  type: 'opportunity' | 'risk' | 'anomaly' | 'correlation' | 'seasonal'
  severity: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  metrics: Record<string, any>
  recommendations: Record<string, any>
  potentialImpact?: number
  isDismissed: boolean
  dismissedAt?: Date
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    name?: string
    email: string
    image?: string
  }
}

export interface Pattern {
  id: string
  organizationId: string
  name: string
  patternType: string
  description?: string
  metrics: Record<string, any>
  parameters: Record<string, any>
  confidence: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Chart data types
export interface ChartDataPoint {
  [key: string]: string | number | null
}

// API response types
export interface ApiResponse<T> {
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
    pages: number
  }
}

// Dashboard types
export interface DashboardMetric {
  id: string
  title: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  format: 'currency' | 'number' | 'percentage'
  icon: any
}

export interface InsightSummary {
  total: number
  critical: number
  high: number
  medium: number
  low: number
}