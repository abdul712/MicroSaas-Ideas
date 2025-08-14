import { 
  Account, 
  User, 
  Client, 
  Portal, 
  File, 
  Folder,
  Message,
  Activity,
  Project,
  Task,
  Subscription,
  Plan,
  UserRole,
  PortalStatus,
  FileStatus,
  ActivityType
} from '@prisma/client'

// Extended types with relations
export interface AccountWithUsers extends Account {
  users: User[]
  portals: Portal[]
  clients: Client[]
  _count?: {
    users: number
    portals: number
    clients: number
  }
}

export interface UserWithAccount extends User {
  account: Account
}

export interface PortalWithRelations extends Portal {
  owner: User
  account: Account
  client: Client
  files: File[]
  folders: Folder[]
  messages: Message[]
  activities: Activity[]
  _count?: {
    files: number
    messages: number
    activities: number
  }
}

export interface ClientWithPortals extends Client {
  account: Account
  portals: Portal[]
  _count?: {
    portals: number
  }
}

export interface FileWithRelations extends File {
  portal: Portal
  folder?: Folder
  uploadedBy: User
}

export interface MessageWithRelations extends Message {
  portal: Portal
  sender?: User
  clientSender?: Client
  replies: Message[]
  thread?: Message
}

export interface ActivityWithRelations extends Activity {
  portal: Portal
  user?: User
  client?: Client
  file?: File
  message?: Message
}

// Portal Builder Types
export interface PortalTemplate {
  id: string
  name: string
  description: string
  preview: string
  category: string
  modules: PortalModule[]
  theme: PortalTheme
  config: Record<string, any>
}

export interface PortalModule {
  id: string
  name: string
  type: ModuleType
  icon: string
  description: string
  settings: Record<string, any>
  permissions: ModulePermissions
  enabled: boolean
  order: number
}

export interface PortalTheme {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
  }
  fonts: {
    heading: string
    body: string
  }
  layout: {
    sidebar: boolean
    header: boolean
    footer: boolean
  }
  branding: {
    logo?: string
    favicon?: string
    companyName: string
  }
}

export interface ModulePermissions {
  view: string[]
  edit: string[]
  delete: string[]
  admin: string[]
}

export type ModuleType = 
  | 'files'
  | 'messages'
  | 'projects'
  | 'invoices'
  | 'calendar'
  | 'analytics'
  | 'settings'
  | 'custom'

// File Management Types
export interface FileUpload {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface FilePreview {
  id: string
  name: string
  type: string
  size: number
  url: string
  thumbnail?: string
  canPreview: boolean
}

// Portal Builder Types
export interface DragItem {
  id: string
  type: string
  component: string
  props: Record<string, any>
  children?: DragItem[]
}

export interface DropResult {
  dragId: string
  hoverId: string
  position: 'before' | 'after' | 'inside'
}

// Communication Types
export interface MessageThread {
  id: string
  subject?: string
  lastMessage: Message
  messageCount: number
  participants: (User | Client)[]
  unreadCount: number
}

// Dashboard Types
export interface DashboardStats {
  totalPortals: number
  activeClients: number
  totalFiles: number
  storageUsed: number
  messagesThisMonth: number
  portalViews: number
}

export interface UsageMetrics {
  portals: {
    total: number
    limit: number
    usage: number
  }
  storage: {
    used: number
    limit: number
    usage: number
  }
  bandwidth: {
    used: number
    limit: number
    usage: number
  }
}

// API Response Types
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
    pageSize: number
    totalCount: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Form Types
export interface CreatePortalForm {
  name: string
  description?: string
  clientEmail: string
  clientName: string
  clientCompany?: string
  templateId?: string
  modules: string[]
}

export interface UpdatePortalForm {
  name?: string
  description?: string
  config?: Record<string, any>
  theme?: Partial<PortalTheme>
  status?: PortalStatus
}

export interface CreateClientForm {
  email: string
  name: string
  company?: string
  phone?: string
}

export interface PortalBuilderState {
  portal: PortalWithRelations | null
  selectedComponent: string | null
  isDragging: boolean
  previewMode: boolean
  unsavedChanges: boolean
  modules: PortalModule[]
}

// Search and Filter Types
export interface SearchFilters {
  query?: string
  type?: string
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
}

export interface SortOption {
  field: string
  direction: 'asc' | 'desc'
  label: string
}

// Notification Types
export interface NotificationSettings {
  email: boolean
  browser: boolean
  sms: boolean
  digest: 'daily' | 'weekly' | 'never'
}

export interface Notification {
  id: string
  type: ActivityType
  title: string
  message: string
  read: boolean
  createdAt: Date
  portalId?: string
  userId?: string
  clientId?: string
}

// Export/Import Types
export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf'
  dateRange?: {
    start: Date
    end: Date
  }
  includeFiles?: boolean
  includeMessages?: boolean
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  warnings: string[]
}

// White Label Types
export interface WhiteLabelConfig {
  enabled: boolean
  customDomain?: string
  branding: {
    logo?: string
    favicon?: string
    companyName: string
    supportEmail: string
    termsUrl?: string
    privacyUrl?: string
  }
  emailTemplates: Record<string, string>
  cssOverrides?: string
}

// Webhook Types
export interface WebhookConfig {
  url: string
  events: ActivityType[]
  secret?: string
  enabled: boolean
}

export interface WebhookPayload {
  event: ActivityType
  timestamp: Date
  data: Record<string, any>
  portalId: string
  accountId: string
}