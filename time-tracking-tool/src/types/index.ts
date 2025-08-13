import { 
  User, 
  Workspace, 
  WorkspaceMember, 
  Client, 
  Project, 
  Task, 
  TimeEntry, 
  Activity,
  Rate,
  Invoice,
  InvoiceLineItem,
  Notification,
  Integration,
  UserRole,
  MemberRole,
  MemberStatus,
  ClientStatus,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  ActivityProductivity,
  RateType,
  InvoiceStatus,
  IntegrationType,
  NotificationType
} from '@prisma/client'

// Extended types with relations
export interface UserWithWorkspaces extends User {
  workspaceMembers: (WorkspaceMember & {
    workspace: Workspace
  })[]
}

export interface WorkspaceWithMembers extends Workspace {
  members: (WorkspaceMember & {
    user: User
  })[]
  owner: User
}

export interface ProjectWithDetails extends Project {
  client?: Client
  timeEntries: TimeEntry[]
  tasks: Task[]
  _count: {
    timeEntries: number
    tasks: number
  }
}

export interface TimeEntryWithDetails extends TimeEntry {
  user: User
  project: Project & {
    client?: Client
  }
  task?: Task
  activities: Activity[]
}

export interface TaskWithDetails extends Task {
  project: Project
  assignee?: User
  timeEntries: TimeEntry[]
  _count: {
    timeEntries: number
  }
}

export interface InvoiceWithDetails extends Invoice {
  client: Client
  lineItems: InvoiceLineItem[]
}

// Timer states
export type TimerState = 'stopped' | 'running' | 'paused'

export interface TimerData {
  state: TimerState
  startTime?: Date
  pausedTime?: number
  currentTime: Date
  projectId?: string
  taskId?: string
  description?: string
}

// Dashboard data types
export interface DashboardStats {
  todayHours: number
  weekHours: number
  monthHours: number
  totalProjects: number
  activeProjects: number
  completedTasks: number
  pendingTasks: number
  billableHours: number
  nonBillableHours: number
  earnings: {
    today: number
    week: number
    month: number
  }
}

export interface ProductivityStats {
  productiveTime: number
  neutralTime: number
  unproductiveTime: number
  totalTime: number
  focusScore: number
  topApps: {
    name: string
    time: number
    category: string
  }[]
  timeByCategory: {
    category: string
    time: number
    productivity: ActivityProductivity
  }[]
}

// Chart data types
export interface TimeChartData {
  date: string
  billable: number
  nonBillable: number
  total: number
}

export interface ProjectChartData {
  name: string
  value: number
  color: string
}

// Form types
export interface CreateProjectForm {
  name: string
  description?: string
  clientId?: string
  color: string
  hourlyRate?: number
  currency: string
  budget?: number
  estimatedHours?: number
  startDate?: Date
  endDate?: Date
}

export interface CreateTaskForm {
  title: string
  description?: string
  projectId: string
  assigneeId?: string
  priority: TaskPriority
  estimatedHours?: number
  dueDate?: Date
}

export interface CreateTimeEntryForm {
  description?: string
  startTime: Date
  endTime?: Date
  duration?: number
  projectId: string
  taskId?: string
  isBillable: boolean
}

export interface CreateClientForm {
  name: string
  email?: string
  phone?: string
  address?: string
  website?: string
  notes?: string
  defaultRate?: number
  currency: string
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Filter and search types
export interface TimeEntryFilters {
  projectId?: string
  taskId?: string
  userId?: string
  clientId?: string
  startDate?: Date
  endDate?: Date
  isBillable?: boolean
  isApproved?: boolean
}

export interface ProjectFilters {
  status?: ProjectStatus
  clientId?: string
  userId?: string
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
  projectId?: string
  assigneeId?: string
  dueDate?: Date
}

// Report types
export interface TimeReport {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalHours: number
    billableHours: number
    nonBillableHours: number
    totalEarnings: number
  }
  projects: {
    project: Project & { client?: Client }
    hours: number
    earnings: number
    tasks: {
      task: Task
      hours: number
    }[]
  }[]
  daily: {
    date: Date
    hours: number
    earnings: number
  }[]
}

export interface ProductivityReport {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalTime: number
    productiveTime: number
    neutralTime: number
    unproductiveTime: number
    focusScore: number
  }
  applications: {
    name: string
    category: string
    time: number
    productivity: ActivityProductivity
  }[]
  websites: {
    domain: string
    time: number
    productivity: ActivityProductivity
  }[]
  timelineData: {
    timestamp: Date
    activity: string
    duration: number
    productivity: ActivityProductivity
  }[]
}

// Notification types
export interface NotificationData {
  title: string
  message: string
  type: NotificationType
  actionUrl?: string
  actionLabel?: string
}

// Integration types
export interface IntegrationConfig {
  apiKey?: string
  accessToken?: string
  refreshToken?: string
  webhookUrl?: string
  settings: Record<string, any>
}

// Export all Prisma types
export {
  User,
  Workspace,
  WorkspaceMember,
  Client,
  Project,
  Task,
  TimeEntry,
  Activity,
  Rate,
  Invoice,
  InvoiceLineItem,
  Notification,
  Integration,
  UserRole,
  MemberRole,
  MemberStatus,
  ClientStatus,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  ActivityProductivity,
  RateType,
  InvoiceStatus,
  IntegrationType,
  NotificationType
}