import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

// Encryption configuration
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;
const SALT_ROUNDS = 12;

// GDPR compliance constants
export const GDPR_DATA_RETENTION_DAYS = 365 * 3; // 3 years
export const GDPR_DELETION_GRACE_PERIOD = 30; // 30 days

// Security service class
export class SecurityService {
  private static instance: SecurityService;
  
  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Data encryption
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
      cipher.setAAD(Buffer.from('additional data'));

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Data decryption
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    try {
      const decipher = crypto.createDecipher(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY);
      decipher.setAAD(Buffer.from('additional data'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Password hashing
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw new Error('Failed to hash password');
    }
  }

  // Password verification
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Password verification failed:', error);
      return false;
    }
  }

  // Generate secure tokens
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash sensitive data for storage
  hashData(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Validate input against XSS and injection attacks
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .trim();
  }

  // Validate and sanitize user content (captions, brand voices, etc.)
  sanitizeUserContent(content: string): string {
    if (typeof content !== 'string') return '';
    
    // Allow basic formatting but remove dangerous content
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/data:\s*text\/html/gi, 'data:text/plain') // Convert HTML data URLs to plain text
      .trim();
  }

  // Rate limiting check
  async checkRateLimit(
    identifier: string,
    action: string,
    windowMs: number = 60000,
    maxAttempts: number = 10
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `${identifier}:${action}`;
    const now = new Date();
    const windowStart = new Date(now.getTime() - windowMs);

    try {
      const attempts = await prisma.auditLog.count({
        where: {
          metadata: {
            path: ['rateLimitKey'],
            equals: key
          },
          createdAt: {
            gte: windowStart
          }
        }
      });

      const allowed = attempts < maxAttempts;
      const remaining = Math.max(0, maxAttempts - attempts - 1);
      const resetTime = new Date(now.getTime() + windowMs);

      return { allowed, remaining, resetTime };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: true, remaining: maxAttempts, resetTime: now };
    }
  }

  // Log security events
  async logSecurityEvent(
    userId: string | null,
    action: string,
    details: {
      ipAddress?: string;
      userAgent?: string;
      success: boolean;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
      metadata?: any;
    }
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action: `security_${action}`,
          resource: 'security',
          metadata: {
            ...details.metadata,
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
            success: details.success,
            riskLevel: details.riskLevel,
            timestamp: new Date()
          },
          ipAddress: details.ipAddress,
          userAgent: details.userAgent
        }
      });

      // Alert on high-risk events
      if (details.riskLevel === 'high' || details.riskLevel === 'critical') {
        await this.alertSecurityTeam(action, details);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Alert security team for critical events
  private async alertSecurityTeam(action: string, details: any): Promise<void> {
    // In production, this would integrate with alerting systems (PagerDuty, Slack, etc.)
    console.error(`🚨 SECURITY ALERT: ${action}`, details);
    
    // Log critical security events to system notifications
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: [UserRole.ADMIN, UserRole.SUPER_ADMIN] } }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM_UPDATE',
            title: 'Security Alert',
            message: `Critical security event: ${action}. Risk level: ${details.riskLevel}`,
            data: {
              securityEvent: true,
              action,
              riskLevel: details.riskLevel,
              timestamp: new Date()
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to alert security team:', error);
    }
  }
}

// RBAC (Role-Based Access Control) implementation
export class RBACService {
  private static instance: RBACService;
  
  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  // Define permissions for each role
  private readonly rolePermissions = {
    [UserRole.USER]: [
      'caption:create',
      'caption:read:own',
      'caption:update:own',
      'caption:delete:own',
      'brandvoice:create:own',
      'brandvoice:read:own',
      'brandvoice:update:own',
      'brandvoice:delete:own',
      'generation:create:own',
      'generation:read:own',
      'analytics:read:own',
      'profile:read:own',
      'profile:update:own'
    ],
    [UserRole.ADMIN]: [
      'caption:create',
      'caption:read:any',
      'caption:update:any',
      'caption:delete:any',
      'brandvoice:create:any',
      'brandvoice:read:any',
      'brandvoice:update:any',
      'brandvoice:delete:any',
      'generation:create:any',
      'generation:read:any',
      'analytics:read:any',
      'user:read:any',
      'user:update:any',
      'organization:create',
      'organization:update',
      'organization:read',
      'system:monitor',
      'audit:read'
    ],
    [UserRole.SUPER_ADMIN]: [
      '*' // All permissions
    ]
  } as const;

  // Check if user has specific permission
  hasPermission(userRole: UserRole, permission: string, resourceOwnership?: 'own' | 'any'): boolean {
    const permissions = this.rolePermissions[userRole];
    
    // Super admin has all permissions
    if (permissions.includes('*')) {
      return true;
    }

    // Check exact permission match
    if (permissions.includes(permission as any)) {
      return true;
    }

    // Check with ownership qualifier
    if (resourceOwnership) {
      const permissionWithOwnership = `${permission}:${resourceOwnership}`;
      if (permissions.includes(permissionWithOwnership as any)) {
        return true;
      }
    }

    return false;
  }

  // Check resource ownership
  async checkResourceOwnership(
    userId: string,
    resourceType: 'caption' | 'brandvoice' | 'generation' | 'organization',
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'caption':
          const caption = await prisma.caption.findFirst({
            where: { id: resourceId, userId }
          });
          return !!caption;

        case 'brandvoice':
          const brandVoice = await prisma.brandVoice.findFirst({
            where: { id: resourceId, userId }
          });
          return !!brandVoice;

        case 'generation':
          const generation = await prisma.generation.findFirst({
            where: { id: resourceId, userId }
          });
          return !!generation;

        case 'organization':
          const membership = await prisma.organizationMember.findFirst({
            where: { organizationId: resourceId, userId }
          });
          return !!membership;

        default:
          return false;
      }
    } catch (error) {
      console.error('Resource ownership check failed:', error);
      return false;
    }
  }

  // Authorize action on resource
  async authorize(
    userId: string,
    userRole: UserRole,
    action: string,
    resourceType?: string,
    resourceId?: string
  ): Promise<boolean> {
    const permission = resourceType ? `${resourceType}:${action}` : action;

    // Check if user has permission for any resource
    if (this.hasPermission(userRole, permission, 'any')) {
      return true;
    }

    // Check if user has permission for own resources
    if (this.hasPermission(userRole, permission, 'own') && resourceId) {
      const ownsResource = await this.checkResourceOwnership(userId, resourceType as any, resourceId);
      return ownsResource;
    }

    return false;
  }
}

// GDPR Compliance service
export class GDPRService {
  private static instance: GDPRService;
  
  public static getInstance(): GDPRService {
    if (!GDPRService.instance) {
      GDPRService.instance = new GDPRService();
    }
    return GDPRService.instance;
  }

  // Export user data (GDPR Article 20 - Right to data portability)
  async exportUserData(userId: string): Promise<{
    personalData: any;
    generatedContent: any;
    brandVoices: any;
    analytics: any;
    auditLog: any;
  }> {
    try {
      const [user, captions, brandVoices, generations, analytics, auditLogs] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            subscription: true,
            organizations: {
              include: { organization: true }
            }
          }
        }),
        prisma.caption.findMany({
          where: { userId },
          include: { analytics: true }
        }),
        prisma.brandVoice.findMany({
          where: { userId }
        }),
        prisma.generation.findMany({
          where: { userId }
        }),
        prisma.captionAnalytics.findMany({
          where: {
            caption: { userId }
          }
        }),
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 1000 // Last 1000 events
        })
      ]);

      return {
        personalData: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
          createdAt: user?.createdAt,
          preferences: user?.preferences,
          subscription: user?.subscription,
          organizations: user?.organizations?.map(org => ({
            id: org.organization.id,
            name: org.organization.name,
            role: org.role,
            joinedAt: org.joinedAt
          }))
        },
        generatedContent: captions.map(caption => ({
          id: caption.id,
          platform: caption.platform,
          text: caption.text,
          hashtags: caption.hashtags,
          createdAt: caption.createdAt,
          analytics: caption.analytics
        })),
        brandVoices: brandVoices.map(voice => ({
          id: voice.id,
          name: voice.name,
          description: voice.description,
          tone: voice.tone,
          personality: voice.personality,
          examples: voice.examples,
          createdAt: voice.createdAt
        })),
        analytics: analytics.map(analytic => ({
          captionId: analytic.captionId,
          platform: analytic.platform,
          impressions: analytic.impressions,
          likes: analytic.likes,
          comments: analytic.comments,
          shares: analytic.shares,
          engagementRate: analytic.engagementRate,
          recordedAt: analytic.recordedAt
        })),
        auditLog: auditLogs.map(log => ({
          action: log.action,
          resource: log.resource,
          createdAt: log.createdAt,
          ipAddress: log.ipAddress
        }))
      };
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw new Error('Failed to export user data');
    }
  }

  // Request data deletion (GDPR Article 17 - Right to erasure)
  async requestDataDeletion(
    userId: string,
    reason: 'user_request' | 'account_deletion' | 'data_retention_expired'
  ): Promise<{ deletionId: string; scheduledFor: Date }> {
    try {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + GDPR_DELETION_GRACE_PERIOD);

      // Create deletion request
      const deletionId = `del_${Date.now()}_${userId}`;
      
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'gdpr_deletion_requested',
          resource: 'user_data',
          metadata: {
            deletionId,
            reason,
            scheduledFor,
            gracePeriodDays: GDPR_DELETION_GRACE_PERIOD
          }
        }
      });

      // Schedule actual deletion (in production, this would use a job queue)
      setTimeout(() => {
        this.performDataDeletion(userId, deletionId).catch(error => {
          console.error('Scheduled data deletion failed:', error);
        });
      }, GDPR_DELETION_GRACE_PERIOD * 24 * 60 * 60 * 1000);

      return { deletionId, scheduledFor };
    } catch (error) {
      console.error('Failed to request data deletion:', error);
      throw new Error('Failed to request data deletion');
    }
  }

  // Perform actual data deletion
  async performDataDeletion(userId: string, deletionId: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        // Delete user-generated content
        await tx.captionAnalytics.deleteMany({
          where: { caption: { userId } }
        });

        await tx.caption.deleteMany({
          where: { userId }
        });

        await tx.generation.deleteMany({
          where: { userId }
        });

        await tx.brandVoice.deleteMany({
          where: { userId }
        });

        // Delete notifications
        await tx.notification.deleteMany({
          where: { userId }
        });

        // Anonymize audit logs instead of deleting (for security compliance)
        await tx.auditLog.updateMany({
          where: { userId },
          data: {
            userId: null,
            metadata: {
              anonymized: true,
              originalUserId: userId,
              deletionId
            }
          }
        });

        // Remove from organizations
        await tx.organizationMember.deleteMany({
          where: { userId }
        });

        // Delete subscription
        await tx.subscription.deleteMany({
          where: { userId }
        });

        // Delete accounts and sessions
        await tx.account.deleteMany({
          where: { userId }
        });

        await tx.session.deleteMany({
          where: { userId }
        });

        // Finally, delete user
        await tx.user.delete({
          where: { id: userId }
        });
      });

      // Log successful deletion
      await prisma.auditLog.create({
        data: {
          userId: null,
          action: 'gdpr_deletion_completed',
          resource: 'user_data',
          metadata: {
            deletionId,
            originalUserId: userId,
            completedAt: new Date()
          }
        }
      });

      console.log(`GDPR data deletion completed for user: ${userId}`);
    } catch (error) {
      console.error('Data deletion failed:', error);
      
      // Log failed deletion
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'gdpr_deletion_failed',
          resource: 'user_data',
          metadata: {
            deletionId,
            error: error.message,
            failedAt: new Date()
          }
        }
      });
      
      throw error;
    }
  }

  // Clean up expired data
  async cleanupExpiredData(): Promise<{ deletedCount: number }> {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - GDPR_DATA_RETENTION_DAYS);

    try {
      // Find users with expired data (inactive for retention period)
      const expiredUsers = await prisma.user.findMany({
        where: {
          lastActivityAt: {
            lt: expirationDate
          },
          // Only consider users who haven't logged in recently
          sessions: {
            none: {
              expires: {
                gt: expirationDate
              }
            }
          }
        },
        select: { id: true }
      });

      let deletedCount = 0;
      for (const user of expiredUsers) {
        try {
          await this.requestDataDeletion(user.id, 'data_retention_expired');
          deletedCount++;
        } catch (error) {
          console.error(`Failed to schedule deletion for user ${user.id}:`, error);
        }
      }

      return { deletedCount };
    } catch (error) {
      console.error('Failed to cleanup expired data:', error);
      return { deletedCount: 0 };
    }
  }
}

// Export service instances
export const securityService = SecurityService.getInstance();
export const rbacService = RBACService.getInstance();
export const gdprService = GDPRService.getInstance();