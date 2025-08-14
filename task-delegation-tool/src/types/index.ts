import { type Prisma, type PlanType, type UserRole, type TeamRole, type Priority, type TaskStatus, type UpdateType, type ReminderType, type InsightType, type NotificationType, type SubscriptionStatus } from '@prisma/client'

// Re-export Prisma enums
export { PlanType, UserRole, TeamRole, Priority, TaskStatus, UpdateType, ReminderType, InsightType, NotificationType, SubscriptionStatus }

// Prisma types with includes
export type OrganizationWithUsers = Prisma.OrganizationGetPayload<{
  include: {
    users: true
    teams: true
    subscriptions: true
  }
}>

export type UserWithOrganization = Prisma.UserGetPayload<{
  include: {
    organization: true
    teamMemberships: {
      include: {
        team: true
      }
    }
  }
}>

export type TaskWithDetails = Prisma.TaskGetPayload<{
  include: {
    delegator: {
      select: {
        id: true
        fullName: true
        email: true
        avatar: true
      }
    }
    assignee: {
      select: {
        id: true
        fullName: true
        email: true
        avatar: true
        skills: true
        workloadCapacity: true
      }
    }
    team: {
      select: {
        id: true
        name: true
      }
    }
    updates: {
      include: {
        user: {
          select: {
            id: true
            fullName: true
            avatar: true
          }
        }
      }
      orderBy: {
        createdAt: 'desc'
      }
    }
    attachments: true
    timeEntries: true
  }
}>

export type TeamWithMembers = Prisma.TeamGetPayload<{
  include: {
    members: {
      include: {
        user: {
          select: {
            id: true
            fullName: true
            email: true
            avatar: true
            role: true
            skills: true
            productivityScore: true
            workloadCapacity: true
          }
        }
      }
    }
    tasks: {
      include: {
        assignee: {
          select: {
            id: true
            fullName: true
          }
        }
      }
    }
  }
}>

// AI-related types
export interface TaskIntelligence {
  complexityScore: number
  estimatedDuration: number
  predictedCompletion: Date
  confidence: number
  skillRequirements: string[]
  riskFactors: string[]
  dependencies: string[]
}

export interface WorkloadAnalysis {
  userId: string
  currentLoad: number
  capacity: number
  utilization: number
  burnoutRisk: number
  recommendedActions: string[]
}

export interface TeamProductivityMetrics {
  teamId: string
  averageCompletionTime: number
  taskCompletionRate: number
  collaborationScore: number
  bottlenecks: string[]
  recommendations: string[]
}

export interface AIDelegationSuggestion {
  taskId: string
  suggestedAssignee: string
  confidence: number
  reasoning: string[]
  alternativeAssignees: Array<{
    userId: string
    score: number
    reasoning: string[]
  }>
}

export interface CognitiveLoadMetrics {
  userId: string
  currentLoad: number
  threshold: number
  factors: Array<{
    type: string
    impact: number
    description: string
  }>
  recommendations: string[]
}

// Dashboard and analytics types
export interface DashboardMetrics {
  totalTasks: number
  completedTasks: number
  overdueTasks: number
  avgCompletionTime: number
  teamProductivity: number
  burnoutAlerts: number
}

export interface ProductivityTrend {
  date: string
  value: number
  target?: number
}

export interface TaskDistribution {
  status: TaskStatus
  count: number
  percentage: number
}

export interface UserPerformance {
  userId: string
  name: string
  avatar?: string
  completedTasks: number
  avgCompletionTime: number
  qualityScore: number
  workloadUtilization: number
}

// Form types
export interface CreateTaskForm {
  title: string
  description?: string
  assigneeId?: string
  teamId?: string
  priority: Priority
  dueDate?: Date
  skillRequirements?: string[]
  storyPoints?: number
}

export interface UpdateTaskForm {
  id: string
  title?: string
  description?: string
  assigneeId?: string
  priority?: Priority
  status?: TaskStatus
  dueDate?: Date
  blockedReason?: string
}

export interface CreateTeamForm {
  name: string
  description?: string
  memberIds: string[]
}

export interface InviteUserForm {
  email: string
  fullName: string
  role: UserRole
  teamIds?: string[]
}

// API response types
export interface APIResponse<T = any> {
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
  }
}

// Real-time event types
export interface SocketEvent {
  type: string
  payload: any
  userId?: string
  organizationId: string
  timestamp: Date
}

export interface TaskUpdateEvent extends SocketEvent {
  type: 'task:updated' | 'task:created' | 'task:deleted' | 'task:assigned'
  payload: {
    taskId: string
    task?: Partial<TaskWithDetails>
    changes?: Record<string, any>
    updatedBy: string
  }
}

export interface NotificationEvent extends SocketEvent {
  type: 'notification:new'
  payload: {
    notification: {
      id: string
      type: NotificationType
      title: string
      message: string
      data?: any
    }
  }
}

export interface AIInsightEvent extends SocketEvent {
  type: 'ai:insight'
  payload: {
    insight: {
      type: InsightType
      confidence: number
      data: any
      actionable: boolean
    }
  }
}

// Configuration types
export interface OrganizationSettings {
  aiFeatures: boolean
  workloadThreshold: number
  burnoutPrevention: boolean
  defaultWorkingHours: {
    start: string
    end: string
    timezone: string
  }
  integrations: {
    slack?: {
      enabled: boolean
      webhookUrl?: string
    }
    email?: {
      enabled: boolean
      provider: string
    }
  }
}

export interface UserPreferences {
  notifications: {
    email: boolean
    push: boolean
    slack: boolean
    frequency: 'immediate' | 'hourly' | 'daily'
  }
  dashboard: {
    defaultView: 'kanban' | 'list' | 'calendar'
    showAIInsights: boolean
    compactMode: boolean
  }
  workingHours: {
    start: string
    end: string
    timezone: string
    daysOfWeek: number[]
  }
}

// Error types
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR')
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR')
    this.name = 'NotFoundError'
  }
}