import type { 
  User, 
  Organization, 
  Widget, 
  Campaign, 
  Event, 
  AbTest,
  Integration,
  UserRole,
  SubscriptionPlan,
  CampaignType,
  EventType,
  AbTestStatus,
  IntegrationType
} from '@prisma/client';

// Extended types with relations
export interface UserWithOrganization extends User {
  organization?: Organization;
}

export interface OrganizationWithWidgets extends Organization {
  widgets: Widget[];
  users: User[];
}

export interface WidgetWithCampaigns extends Widget {
  campaigns: Campaign[];
  organization: Organization;
}

export interface CampaignWithEvents extends Campaign {
  events: Event[];
  widget: Widget;
}

export interface EventWithCampaign extends Event {
  campaign?: Campaign;
}

// Widget Configuration Types
export interface WidgetConfig {
  organizationId: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  theme: 'light' | 'dark' | 'auto';
  displayDuration: number;
  maxNotifications: number;
  animationStyle: 'slide' | 'fade' | 'bounce';
  showClose: boolean;
  enableSounds: boolean;
  customCss?: string;
  targetingRules?: TargetingRules;
}

export interface TargetingRules {
  pages?: string[];
  excludePages?: string[];
  countries?: string[];
  devices?: ('desktop' | 'mobile' | 'tablet')[];
  timing?: {
    delay?: number;
    frequency?: number;
    maxPerSession?: number;
  };
  conditions?: {
    minTimeOnSite?: number;
    minPageViews?: number;
    isNewVisitor?: boolean;
    hasReferer?: boolean;
  };
}

// Notification Types
export interface NotificationData {
  id: string;
  type: CampaignType;
  message: string;
  customerName?: string;
  location?: string;
  product?: string;
  timestamp: string;
  avatar?: string;
  rating?: number;
  customData?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: CampaignType;
  template: string;
  variables: string[];
  isActive: boolean;
}

// Analytics Types
export interface AnalyticsMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  uniqueVisitors: number;
  averageTimeOnSite: number;
  bounceRate: number;
}

export interface ConversionFunnel {
  step: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface VisitorSession {
  visitorId: string;
  sessionId: string;
  startTime: string;
  endTime?: string;
  pageViews: number;
  events: Event[];
  location?: {
    country: string;
    city: string;
    region: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
  };
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// A/B Testing Types
export interface AbTestVariant {
  id: string;
  name: string;
  config: WidgetConfig;
  trafficPercentage: number;
  isControl: boolean;
}

export interface AbTestResults {
  variant: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isSignificant: boolean;
  lift: number;
}

// Integration Types
export interface ShopifyIntegration {
  shopDomain: string;
  accessToken: string;
  webhookId?: string;
  isConnected: boolean;
}

export interface WooCommerceIntegration {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  isConnected: boolean;
}

export interface StripeIntegration {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
  isConnected: boolean;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard Types
export interface DashboardStats {
  totalVisitors: number;
  totalConversions: number;
  conversionRate: number;
  revenue: number;
  activeWidgets: number;
  activeCampaigns: number;
  notificationsShown: number;
  clickThroughRate: number;
}

export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ConversionChart {
  period: 'hour' | 'day' | 'week' | 'month';
  data: ChartDataPoint[];
}

// Form Types
export interface CreateWidgetForm {
  name: string;
  domain: string;
  settings: WidgetConfig;
}

export interface CreateCampaignForm {
  name: string;
  type: CampaignType;
  widgetId: string;
  rules: TargetingRules;
  settings: {
    template: string;
    variables: Record<string, any>;
  };
}

export interface CreateAbTestForm {
  name: string;
  description?: string;
  variants: AbTestVariant[];
  trafficSplit: Record<string, number>;
  successMetric: 'conversions' | 'clicks' | 'revenue';
  duration: number; // days
}

// WebSocket Types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

export interface VisitorJoinMessage extends WebSocketMessage {
  type: 'visitor_join';
  data: {
    visitorId: string;
    page: string;
    referrer: string;
    userAgent: string;
    location?: any;
  };
}

export interface NotificationMessage extends WebSocketMessage {
  type: 'notification';
  data: NotificationData;
}

export interface VisitorCountMessage extends WebSocketMessage {
  type: 'visitor_count';
  data: {
    count: number;
    recentActivity?: string;
  };
}

// Export Prisma types for convenience
export type {
  User,
  Organization,
  Widget,
  Campaign,
  Event,
  AbTest,
  Integration,
  UserRole,
  SubscriptionPlan,
  CampaignType,
  EventType,
  AbTestStatus,
  IntegrationType
};