import { Hashtag, HashtagHistory, HashtagSet, CompetitorTrack, Platform, SearchType, PlanType, UserRole } from '@prisma/client'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Hashtag related types
export interface HashtagWithHistory extends Hashtag {
  history: HashtagHistory[]
}

export interface HashtagSearchResult {
  hashtag: string
  platform: Platform
  postCount: bigint
  avgEngagement: number
  difficultyScore: number
  trendScore: number
  relatedTags: string[]
  competitorUsage?: number
}

export interface HashtagRecommendation {
  hashtag: string
  score: number
  reason: string
  category: 'trending' | 'niche' | 'competitor' | 'related'
  metrics: {
    postCount: bigint
    avgEngagement: number
    difficulty: number
    trend: number
  }
}

export interface HashtagAnalytics {
  hashtag: string
  platform: Platform
  timeframe: string
  metrics: {
    reach: number
    engagement: number
    posts: number
    growth: number
  }
  history: Array<{
    date: string
    value: number
    metric: string
  }>
}

// Search types
export interface SearchFilters {
  platform?: Platform
  minPostCount?: number
  maxPostCount?: number
  minEngagement?: number
  maxEngagement?: number
  difficulty?: 'low' | 'medium' | 'high'
  trending?: boolean
  timeframe?: '24h' | '7d' | '30d' | '90d'
}

export interface SearchRequest {
  query: string
  platform: Platform
  type: SearchType
  filters?: SearchFilters
  limit?: number
}

// User and subscription types
export interface UserProfile {
  id: string
  name?: string
  email: string
  role: UserRole
  plan: PlanType
  createdAt: Date
  stats: {
    totalSearches: number
    savedSets: number
    competitors: number
    apiCalls: number
  }
}

export interface PlanLimits {
  searchesPerMonth: number
  savedSets: number
  competitors: number
  apiCallsPerMonth: number
  features: string[]
}

// Dashboard types
export interface DashboardStats {
  totalSearches: number
  savedSets: number
  competitorsTracked: number
  trendsIdentified: number
  recentSearches: Array<{
    id: string
    query: string
    platform: Platform
    createdAt: Date
  }>
  topPerformingHashtags: Array<{
    hashtag: string
    platform: Platform
    performance: number
  }>
}

// Competitor analysis types
export interface CompetitorAnalysis {
  handle: string
  platform: Platform
  topHashtags: Array<{
    hashtag: string
    usageCount: number
    avgEngagement: number
    lastUsed: Date
  }>
  insights: {
    averageHashtagsPerPost: number
    hashtagDiversity: number
    engagementRate: number
    postFrequency: number
  }
  trends: Array<{
    hashtag: string
    trend: 'rising' | 'falling' | 'stable'
    change: number
  }>
}

// Trending topics types
export interface TrendingTopic {
  topic: string
  platform: Platform
  strength: number
  hashtags: string[]
  relatedTopics: string[]
  region: string
  detectedAt: Date
}

// Chart data types
export interface ChartDataPoint {
  name: string
  value: number
  date?: string
  category?: string
}

export interface TimeSeriesData {
  date: string
  value: number
  metric: string
}

// Component prop types
export interface HashtagCardProps {
  hashtag: HashtagSearchResult
  onSave?: (hashtag: string) => void
  onAnalyze?: (hashtag: string) => void
  saved?: boolean
}

export interface SearchBarProps {
  onSearch: (query: string, platform: Platform) => void
  loading?: boolean
  placeholder?: string
  platforms?: Platform[]
}

export interface FilterPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  platforms: Platform[]
}

// Form types
export interface SignUpFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface HashtagSetFormData {
  name: string
  description?: string
  hashtags: string[]
  isPublic: boolean
}

// Error types
export interface ApiError {
  code: string
  message: string
  details?: any
}

export class HashtagResearchError extends Error {
  code: string
  statusCode: number

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message)
    this.name = 'HashtagResearchError'
    this.code = code
    this.statusCode = statusCode
  }
}

// Rate limiting types
export interface RateLimitInfo {
  limit: number
  remaining: number
  resetTime: Date
}

// Cache types
export interface CacheOptions {
  ttl?: number
  key?: string
  tags?: string[]
}

// Webhook types
export interface WebhookPayload {
  event: string
  data: any
  timestamp: Date
  userId?: string
}

// Export utility type helpers
export type WithTimestamps<T> = T & {
  createdAt: Date
  updatedAt: Date
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>