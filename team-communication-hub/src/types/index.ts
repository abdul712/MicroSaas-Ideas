// Core type definitions for Team Communication Hub

export interface TeamContextType {
  teamId: string;
  subdomain: string;
  plan: PlanType;
  role: TeamRole;
  settings: TeamSettings;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status: UserStatus;
  lastActiveAt: Date;
}

export interface MessageData {
  id: string;
  content: string;
  senderId: string;
  channelId: string;
  threadId?: string;
  type: MessageType;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  sender: UserProfile;
  reactions: MessageReaction[];
  attachments: FileAttachment[];
  mentions: string[];
}

export interface ChannelData {
  id: string;
  name: string;
  description?: string;
  type: ChannelType;
  topic?: string;
  isArchived: boolean;
  memberCount: number;
  unreadCount?: number;
  lastMessage?: MessageData;
  createdAt: Date;
}

export interface ThreadData {
  id: string;
  channelId: string;
  parentMessageId?: string;
  title?: string;
  messageCount: number;
  lastMessage?: MessageData;
  isActive: boolean;
  createdAt: Date;
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
}

export interface MessageReaction {
  id: string;
  emoji: string;
  userId: string;
  user: UserProfile;
  createdAt: Date;
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  defaultChannelId?: string;
  fileUploadLimit: number;
  messageRetention: number; // days
  aiAssistantEnabled: boolean;
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
}

export interface NotificationSettings {
  email: {
    mentions: boolean;
    directMessages: boolean;
    channelUpdates: boolean;
    weeklyDigest: boolean;
  };
  push: {
    mentions: boolean;
    directMessages: boolean;
    keywords: string[];
  };
  desktop: {
    enabled: boolean;
    sound: boolean;
    mentions: boolean;
    directMessages: boolean;
  };
}

export interface SecuritySettings {
  requireTwoFactor: boolean;
  sessionTimeout: number; // minutes
  allowedDomains: string[];
  ipWhitelist: string[];
}

export interface PresenceData {
  userId: string;
  status: UserStatus;
  activity?: string;
  lastSeen: Date;
}

export interface TypingIndicator {
  userId: string;
  channelId: string;
  username: string;
  timestamp: Date;
}

export interface AIAssistantResponse {
  id: string;
  type: 'summary' | 'translation' | 'suggestion' | 'analysis';
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
}

// Socket event types
export interface ServerToClientEvents {
  'message:new': (message: MessageData) => void;
  'message:updated': (message: MessageData) => void;
  'message:deleted': (messageId: string) => void;
  'message:reaction': (messageId: string, reaction: MessageReaction) => void;
  'channel:updated': (channel: ChannelData) => void;
  'channel:deleted': (channelId: string) => void;
  'user:presence': (presence: PresenceData) => void;
  'user:typing': (typing: TypingIndicator) => void;
  'user:stopped_typing': (userId: string, channelId: string) => void;
  'notification:new': (notification: Notification) => void;
  'ai:response': (response: AIAssistantResponse) => void;
}

export interface ClientToServerEvents {
  'message:send': (channelId: string, content: string, threadId?: string) => void;
  'message:edit': (messageId: string, content: string) => void;
  'message:delete': (messageId: string) => void;
  'message:react': (messageId: string, emoji: string) => void;
  'user:typing': (channelId: string) => void;
  'user:stop_typing': (channelId: string) => void;
  'user:presence': (status: UserStatus, activity?: string) => void;
  'channel:join': (channelId: string) => void;
  'channel:leave': (channelId: string) => void;
  'ai:request': (type: string, data: any) => void;
}

// API Response types
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
    hasMore: boolean;
  };
}

// Database enums (matching Prisma schema)
export enum UserStatus {
  ONLINE = 'ONLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export enum PlanType {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  DIRECT = 'DIRECT',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
  SYSTEM = 'SYSTEM',
  AI_RESPONSE = 'AI_RESPONSE',
}

// Form validation schemas
export interface CreateTeamData {
  name: string;
  subdomain: string;
  description?: string;
}

export interface CreateChannelData {
  name: string;
  description?: string;
  type: ChannelType;
  isPrivate: boolean;
}

export interface InviteMemberData {
  email: string;
  role: TeamRole;
  message?: string;
}

export interface UpdateProfileData {
  displayName?: string;
  username?: string;
  avatarUrl?: string;
}

// Error types
export class TeamCommunicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TeamCommunicationError';
  }
}

export class AuthenticationError extends TeamCommunicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
  }
}

export class AuthorizationError extends TeamCommunicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'INSUFFICIENT_PERMISSIONS', 403);
  }
}

export class ValidationError extends TeamCommunicationError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class RateLimitError extends TeamCommunicationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}