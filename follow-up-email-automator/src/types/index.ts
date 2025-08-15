export interface EmailSequenceNode {
  id: string
  type: "email" | "delay" | "condition" | "trigger" | "webhook"
  position: { x: number; y: number }
  data: {
    label: string
    config?: any
    metrics?: {
      sent: number
      opened: number
      clicked: number
      replied: number
    }
  }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  type?: string
  data?: any
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  bodyHtml: string
  bodyText?: string
  variables?: string[]
  isPublic: boolean
  category?: string
  tags: string[]
  aiGenerated: boolean
  aiPrompt?: string
  openRate?: number
  clickRate?: number
  replyRate?: number
  createdAt: Date
  updatedAt: Date
}

export interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  company?: string
  jobTitle?: string
  phone?: string
  website?: string
  status: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED"
  engagementScore: number
  lastEngagedAt?: Date
  customFields: Record<string, any>
  tags: string[]
  source?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface EmailSequence {
  id: string
  name: string
  description?: string
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED"
  triggerType: "MANUAL" | "TAG_ADDED" | "LIST_ADDED" | "FORM_SUBMITTED" | "WEBHOOK" | "API_CALL"
  triggerConfig?: any
  isActive: boolean
  stopOnReply: boolean
  stopOnClick: boolean
  enrolledCount: number
  completedCount: number
  openRate?: number
  clickRate?: number
  replyRate?: number
  createdAt: Date
  updatedAt: Date
  steps: SequenceStep[]
}

export interface SequenceStep {
  id: string
  sequenceId: string
  stepOrder: number
  stepType: "EMAIL" | "DELAY" | "CONDITION" | "WEBHOOK" | "TASK"
  delayDays: number
  delayHours: number
  templateId?: string
  template?: EmailTemplate
  conditions?: any[]
  sentCount: number
  openCount: number
  clickCount: number
  replyCount: number
  createdAt: Date
  updatedAt: Date
}

export interface SequenceEnrollment {
  id: string
  contactId: string
  sequenceId: string
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "STOPPED"
  currentStepId?: string
  nextSendAt?: Date
  completedAt?: Date
  pausedAt?: Date
  enrolledAt: Date
  updatedAt: Date
}

export interface EmailSend {
  id: string
  contactId: string
  templateId: string
  subject: string
  bodyHtml: string
  bodyText?: string
  status: "PENDING" | "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "REPLIED" | "BOUNCED" | "FAILED"
  providerId?: string
  provider: "SENDGRID" | "RESEND" | "MAILGUN" | "POSTMARK"
  sentAt?: Date
  openedAt?: Date
  clickedAt?: Date
  repliedAt?: Date
  bouncedAt?: Date
  errorMessage?: string
  retryCount: number
  createdAt: Date
  updatedAt: Date
}

export interface EmailEvent {
  id: string
  emailId: string
  contactId: string
  type: "SENT" | "DELIVERED" | "OPENED" | "CLICKED" | "REPLIED" | "BOUNCED" | "COMPLAINED" | "UNSUBSCRIBED"
  timestamp: Date
  userAgent?: string
  ipAddress?: string
  location?: string
  url?: string
  providerId?: string
  metadata?: any
}

export interface Organization {
  id: string
  name: string
  slug: string
  domain?: string
  ownerId: string
  plan: "FREE" | "STARTER" | "PROFESSIONAL" | "BUSINESS" | "ENTERPRISE"
  billingEmail?: string
  monthlyEmailsSent: number
  monthlyEmailsLimit: number
  contactsCount: number
  contactsLimit: number
  emailConfig?: any
  createdAt: Date
  updatedAt: Date
}

export interface Analytics {
  emailsSent: number
  emailsOpened: number
  emailsClicked: number
  emailsReplied: number
  emailsBounced: number
  openRate: number
  clickRate: number
  replyRate: number
  bounceRate: number
}

export interface DashboardMetrics {
  totalContacts: number
  activeSequences: number
  emailsSentToday: number
  avgOpenRate: number
  avgClickRate: number
  avgReplyRate: number
  recentActivity: ActivityItem[]
}

export interface ActivityItem {
  id: string
  type: string
  description: string
  timestamp: Date
  metadata?: any
}

export interface Integration {
  id: string
  name: string
  type: "CRM" | "ECOMMERCE" | "ANALYTICS" | "PAYMENT" | "WEBHOOK"
  config: any
  credentials?: any
  isActive: boolean
  lastSyncAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Webhook {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
  failureCount: number
  lastFailure?: Date
  lastSuccess?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AbTest {
  id: string
  name: string
  templateAId: string
  templateBId: string
  trafficSplit: number
  status: "DRAFT" | "RUNNING" | "COMPLETED" | "PAUSED"
  startedAt?: Date
  endedAt?: Date
  samplesA: number
  samplesB: number
  conversionsA: number
  conversionsB: number
  pValue?: number
  confidence?: number
  winner?: "A" | "B" | "INCONCLUSIVE"
  createdAt: Date
  updatedAt: Date
}

export interface ContactList {
  id: string
  name: string
  description?: string
  isDefault: boolean
  tags: string[]
  contactCount?: number
  createdAt: Date
  updatedAt: Date
}