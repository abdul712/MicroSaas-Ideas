// Core types for the Customer Segmentation Tool
import { 
  User as PrismaUser,
  Tenant as PrismaTenant,
  Customer as PrismaCustomer,
  Segment as PrismaSegment,
  SegmentMembership as PrismaSegmentMembership,
  BehaviorEvent as PrismaBehaviorEvent,
  Integration as PrismaIntegration,
  Campaign as PrismaCampaign,
  CampaignInteraction as PrismaCampaignInteraction,
  MlModel as PrismaMlModel,
  AuditLog as PrismaAuditLog,
  UserRole,
  CampaignType,
  CampaignStatus,
  InteractionType,
  ModelType
} from '@prisma/client';

// Enhanced types with computed fields
export interface User extends PrismaUser {
  tenant: Tenant;
}

export interface Tenant extends PrismaTenant {
  users?: User[];
  customers?: Customer[];
  segments?: Segment[];
  integrations?: Integration[];
  _count?: {
    customers: number;
    segments: number;
    users: number;
  };
}

export interface Customer extends PrismaCustomer {
  tenant?: Tenant;
  segmentMemberships?: SegmentMembership[];
  behaviorEvents?: BehaviorEvent[];
  campaignInteractions?: CampaignInteraction[];
  _count?: {
    segmentMemberships: number;
    behaviorEvents: number;
  };
}

export interface Segment extends PrismaSegment {
  tenant?: Tenant;
  memberships?: SegmentMembership[];
  campaigns?: Campaign[];
  _count?: {
    memberships: number;
  };
}

export interface SegmentMembership extends PrismaSegmentMembership {
  segment?: Segment;
  customer?: Customer;
}

export interface BehaviorEvent extends PrismaBehaviorEvent {
  customer?: Customer;
  tenant?: Tenant;
}

export interface Integration extends PrismaIntegration {
  tenant?: Tenant;
}

export interface Campaign extends PrismaCampaign {
  tenant?: Tenant;
  segment?: Segment;
  interactions?: CampaignInteraction[];
  _count?: {
    interactions: number;
  };
}

export interface CampaignInteraction extends PrismaCampaignInteraction {
  campaign?: Campaign;
  customer?: Customer;
}

export interface MlModel extends PrismaMlModel {}

export interface AuditLog extends PrismaAuditLog {}

// Export enums
export { UserRole, CampaignType, CampaignStatus, InteractionType, ModelType };

// Segment rule types
export interface SegmentRule {
  id: string;
  field: string;
  operator: SegmentOperator;
  value: any;
  type: SegmentRuleType;
}

export enum SegmentOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUAL = 'greater_than_or_equal',
  LESS_THAN_OR_EQUAL = 'less_than_or_equal',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  BETWEEN = 'between',
  REGEX = 'regex'
}

export enum SegmentRuleType {
  DEMOGRAPHIC = 'demographic',
  BEHAVIORAL = 'behavioral',
  TRANSACTIONAL = 'transactional',
  ENGAGEMENT = 'engagement',
  CUSTOM = 'custom'
}

// ML Configuration types
export interface MLSegmentConfig {
  algorithm: MLAlgorithm;
  parameters: Record<string, any>;
  features: string[];
  autoUpdate: boolean;
  minClusterSize?: number;
  maxClusters?: number;
}

export enum MLAlgorithm {
  KMEANS = 'kmeans',
  DBSCAN = 'dbscan',
  HIERARCHICAL = 'hierarchical',
  RFM = 'rfm',
  BEHAVIORAL = 'behavioral'
}

// Analytics types
export interface SegmentAnalytics {
  segmentId: string;
  totalCustomers: number;
  growthRate: number;
  conversionRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  churnRate: number;
  engagement: {
    emailOpenRate: number;
    emailClickRate: number;
    websiteVisits: number;
    averageSessionDuration: number;
  };
  demographics: {
    ageDistribution: AgeGroup[];
    genderDistribution: GenderGroup[];
    locationDistribution: LocationGroup[];
  };
  behavior: {
    topCategories: CategoryGroup[];
    purchaseFrequency: FrequencyGroup[];
    timeOfPurchase: TimeGroup[];
  };
}

export interface AgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface GenderGroup {
  gender: string;
  count: number;
  percentage: number;
}

export interface LocationGroup {
  location: string;
  count: number;
  percentage: number;
}

export interface CategoryGroup {
  category: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface FrequencyGroup {
  frequency: string;
  count: number;
  percentage: number;
}

export interface TimeGroup {
  time: string;
  count: number;
  percentage: number;
}

// RFM Analysis types
export interface RFMScores {
  recency: number;
  frequency: number;
  monetary: number;
  rfmScore: string;
  rfmSegment: RFMSegment;
}

export enum RFMSegment {
  CHAMPIONS = 'Champions',
  LOYAL_CUSTOMERS = 'Loyal Customers',
  POTENTIAL_LOYALISTS = 'Potential Loyalists',
  NEW_CUSTOMERS = 'New Customers',
  PROMISING = 'Promising',
  NEED_ATTENTION = 'Need Attention',
  ABOUT_TO_SLEEP = 'About to Sleep',
  AT_RISK = 'At Risk',
  CANNOT_LOSE_THEM = 'Cannot Lose Them',
  HIBERNATING = 'Hibernating',
  LOST = 'Lost'
}

// Predictive Analytics types
export interface ChurnPrediction {
  customerId: string;
  churnProbability: number;
  riskLevel: RiskLevel;
  reasons: string[];
  recommendedActions: string[];
  confidence: number;
}

export interface CLVPrediction {
  customerId: string;
  predictedCLV: number;
  confidenceInterval: [number, number];
  timeHorizon: number; // in months
  factors: CLVFactor[];
}

export interface CLVFactor {
  factor: string;
  impact: number;
  description: string;
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Integration types
export interface IntegrationProvider {
  id: string;
  name: string;
  description: string;
  logoUrl: string;
  category: IntegrationCategory;
  features: string[];
  setupUrl: string;
  documentationUrl: string;
  isPopular: boolean;
}

export enum IntegrationCategory {
  ECOMMERCE = 'ecommerce',
  CRM = 'crm',
  EMAIL_MARKETING = 'email_marketing',
  ANALYTICS = 'analytics',
  PAYMENT = 'payment',
  SUPPORT = 'support',
  SOCIAL = 'social',
  ADVERTISING = 'advertising'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Dashboard types
export interface DashboardStats {
  totalCustomers: number;
  totalSegments: number;
  activeIntegrations: number;
  conversionRate: number;
  customerGrowth: number;
  segmentGrowth: number;
  revenueGrowth: number;
  churnRate: number;
}

export interface DashboardChart {
  id: string;
  title: string;
  type: ChartType;
  data: any[];
  config: ChartConfig;
}

export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  DOUGHNUT = 'doughnut',
  AREA = 'area',
  SCATTER = 'scatter',
  HEATMAP = 'heatmap'
}

export interface ChartConfig {
  xAxis?: string;
  yAxis?: string;
  colorScheme?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
  isAnimated?: boolean;
}

// Form types for segment creation
export interface SegmentFormData {
  name: string;
  description?: string;
  color: string;
  isDynamic: boolean;
  rules: SegmentRule[];
  mlConfig?: MLSegmentConfig;
  tags: string[];
}

// Real-time update types
export interface SegmentUpdate {
  type: 'customer_added' | 'customer_removed' | 'segment_updated' | 'segment_deleted';
  segmentId: string;
  customerId?: string;
  data?: any;
  timestamp: string;
}

// Export options
export interface ExportOptions {
  format: ExportFormat;
  fields: string[];
  filters?: SegmentRule[];
  includeAnalytics?: boolean;
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
  PDF = 'pdf'
}

// Notification types
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export enum NotificationType {
  SEGMENT_UPDATE = 'segment_update',
  INTEGRATION_SUCCESS = 'integration_success',
  INTEGRATION_ERROR = 'integration_error',
  CAMPAIGN_COMPLETED = 'campaign_completed',
  ML_MODEL_TRAINED = 'ml_model_trained',
  SYSTEM_ALERT = 'system_alert'
}