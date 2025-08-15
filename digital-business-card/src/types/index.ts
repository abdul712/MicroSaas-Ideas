export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  subscriptionId?: string;
  subscriptionStatus?: string;
  customerId?: string;
  customDomain?: string;
}

export interface Card {
  id: string;
  userId: string;
  templateId: string;
  slug: string;
  qrCode?: string;
  isPrimary: boolean;
  isActive: boolean;
  customCss?: string;
  createdAt: Date;
  updatedAt: Date;
  fields: CardField[];
  template: Template;
  views: CardView[];
  connections: Connection[];
}

export interface CardField {
  id: string;
  cardId: string;
  fieldType: FieldType;
  label: string;
  value: string;
  order: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FieldType = 
  | 'name'
  | 'title'
  | 'company' 
  | 'phone'
  | 'email'
  | 'website'
  | 'social'
  | 'address'
  | 'bio'
  | 'custom';

export interface Template {
  id: string;
  name: string;
  category: string;
  designJson: TemplateDesign;
  premium: boolean;
  previewUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateDesign {
  layout: 'vertical' | 'horizontal' | 'minimal' | 'creative';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  spacing: 'compact' | 'normal' | 'spacious';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  backgroundPattern?: string;
  gradients?: {
    enabled: boolean;
    direction: string;
    colors: string[];
  };
}

export interface CardView {
  id: string;
  cardId: string;
  viewerIp?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
  device?: 'mobile' | 'desktop' | 'tablet';
  referrer?: string;
  timestamp: Date;
}

export interface Connection {
  id: string;
  cardId: string;
  userId?: string;
  contactInfo: ContactInfo;
  notes?: string;
  tags: string[];
  connectedAt: Date;
}

export interface ContactInfo {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  website?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  adminId: string;
  brandingJson?: TeamBranding;
  customDomain?: string;
  createdAt: Date;
  updatedAt: Date;
  members: TeamMember[];
}

export interface TeamBranding {
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  fonts: {
    primary: string;
  };
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  user: User;
}

export interface Analytics {
  id: string;
  cardId: string;
  userId: string;
  metricType: 'views' | 'connections' | 'shares' | 'saves';
  value: number;
  date: Date;
}

export interface QRCodeOptions {
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  type: 'canvas' | 'svg';
  quality: number;
  margin: number;
  color: {
    dark: string;
    light: string;
  };
  logo?: {
    src: string;
    width: number;
    height: number;
    x: number;
    y: number;
  };
}

export interface ShareOptions {
  method: 'qr' | 'link' | 'email' | 'sms' | 'nfc' | 'social';
  platform?: 'linkedin' | 'twitter' | 'facebook' | 'whatsapp';
  customMessage?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AnalyticsData {
  totalViews: number;
  totalConnections: number;
  totalShares: number;
  viewsToday: number;
  viewsThisWeek: number;
  viewsThisMonth: number;
  topLocations: Array<{
    country: string;
    city: string;
    count: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  timeSeriesData: Array<{
    date: string;
    views: number;
    connections: number;
  }>;
}