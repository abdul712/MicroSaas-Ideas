import { Organization, User, Contact, EmailTemplate, AutomationWorkflow, EmailCampaign, EmailSend } from "@prisma/client"

// Extended types with relations
export type OrganizationWithUsers = Organization & {
  users: User[]
}

export type ContactWithLists = Contact & {
  contactListItems: {
    emailList: {
      id: string
      name: string
    }
  }[]
}

export type EmailTemplateWithStats = EmailTemplate & {
  _count: {
    emailCampaigns: number
  }
}

export type AutomationWorkflowWithStats = AutomationWorkflow & {
  _count: {
    emailCampaigns: number
    workflowRuns: number
  }
}

export type EmailCampaignWithStats = EmailCampaign & {
  template?: EmailTemplate
  automationWorkflow?: AutomationWorkflow
  _count: {
    emailSends: number
  }
  stats: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    complained: number
    unsubscribed: number
    openRate: number
    clickRate: number
    bounceRate: number
  }
}

export type EmailSendWithDetails = EmailSend & {
  contact: Contact
  campaign: EmailCampaign
}

// Dashboard analytics types
export interface DashboardStats {
  totalContacts: number
  totalCampaigns: number
  totalSent: number
  averageOpenRate: number
  averageClickRate: number
  recentCampaigns: EmailCampaignWithStats[]
  topPerformingCampaigns: EmailCampaignWithStats[]
}

// Email automation types
export interface EmailAutomationTrigger {
  type: 'time_based' | 'event_based' | 'manual'
  config: {
    delay?: number
    delayUnit?: 'minutes' | 'hours' | 'days'
    eventType?: string
    conditions?: Record<string, any>
  }
}

export interface EmailAutomationStep {
  id: string
  type: 'email' | 'delay' | 'condition' | 'action'
  position: { x: number; y: number }
  data: {
    templateId?: string
    delay?: number
    delayUnit?: 'minutes' | 'hours' | 'days'
    condition?: Record<string, any>
    action?: Record<string, any>
  }
}

export interface EmailAutomationWorkflow {
  id: string
  name: string
  description?: string
  trigger: EmailAutomationTrigger
  steps: EmailAutomationStep[]
  connections: Array<{
    source: string
    target: string
    condition?: Record<string, any>
  }>
}

// AI content generation types
export interface AIContentRequest {
  prompt: string
  context?: {
    industry?: string
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent'
    purpose?: 'welcome' | 'follow_up' | 'promotional' | 'educational'
    audience?: string
  }
  templateType: 'subject' | 'content' | 'both'
}

export interface AIContentResponse {
  subject?: string
  content?: string
  suggestions?: string[]
}

// Analytics types
export interface EmailMetrics {
  timestamp: Date
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  unsubscribed: number
}

export interface ContactEngagement {
  contactId: string
  email: string
  firstName?: string
  lastName?: string
  engagementScore: number
  lastEngaged?: Date
  totalOpens: number
  totalClicks: number
  totalSent: number
}

// Integration types
export interface Integration {
  id: string
  name: string
  provider: string
  isActive: boolean
  config: Record<string, any>
  lastSync?: Date
}

export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, any>
  timestamp: Date
}

// Form types
export interface ContactFormData {
  email: string
  firstName?: string
  lastName?: string
  properties?: Record<string, any>
  listIds?: string[]
}

export interface EmailTemplateFormData {
  name: string
  subject: string
  content: string
  category?: string
  variables?: string[]
}

export interface EmailCampaignFormData {
  name: string
  subject: string
  templateId?: string
  fromEmail: string
  fromName: string
  replyToEmail?: string
  contactIds?: string[]
  listIds?: string[]
  scheduledAt?: Date
}

export interface AutomationWorkflowFormData {
  name: string
  description?: string
  triggerType: string
  triggerConfig: Record<string, any>
  isActive: boolean
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// Error types
export interface EmailError {
  code: string
  message: string
  details?: Record<string, any>
}

// Settings types
export interface OrganizationSettings {
  emailSettings: {
    fromEmail: string
    fromName: string
    replyToEmail?: string
    unsubscribeUrl?: string
  }
  automationSettings: {
    defaultDelay: number
    maxSendRate: number
    timezone: string
  }
  integrationSettings: {
    webhookUrl?: string
    apiKeys: Record<string, string>
  }
}

// Queue job types
export interface EmailJob {
  id: string
  organizationId: string
  campaignId: string
  contactId: string
  templateId: string
  scheduledAt: Date
  priority: 'high' | 'normal' | 'low'
  retryCount: number
  maxRetries: number
  data: {
    email: string
    subject: string
    content: string
    fromEmail: string
    fromName: string
    variables: Record<string, any>
  }
}