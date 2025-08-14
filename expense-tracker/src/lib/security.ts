import crypto from 'crypto'
import { prisma } from './prisma'

// Encryption utilities for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
const ALGORITHM = 'aes-256-gcm'

export class EncryptionService {
  private static key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)

  static encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(ALGORITHM, this.key)
      cipher.setAAD(Buffer.from('expense-tracker', 'utf8'))
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      console.error('Encryption failed:', error)
      throw new Error('Failed to encrypt sensitive data')
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format')
      }
      
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      const decipher = crypto.createDecipher(ALGORITHM, this.key)
      
      decipher.setAAD(Buffer.from('expense-tracker', 'utf8'))
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt sensitive data')
    }
  }

  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex')
  }

  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }
}

// PCI DSS Compliance utilities
export class PCIComplianceService {
  // Mask sensitive payment information
  static maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 6) return '****'
    
    const first4 = cardNumber.substring(0, 4)
    const last4 = cardNumber.substring(cardNumber.length - 4)
    const masked = '*'.repeat(cardNumber.length - 8)
    
    return `${first4}${masked}${last4}`
  }

  // Validate card number using Luhn algorithm
  static validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\s+/g, '').split('').map(Number)
    
    for (let i = digits.length - 2; i >= 0; i -= 2) {
      digits[i] *= 2
      if (digits[i] > 9) {
        digits[i] -= 9
      }
    }
    
    const sum = digits.reduce((acc, digit) => acc + digit, 0)
    return sum % 10 === 0
  }

  // Log PCI-related access for auditing
  static async logPCIAccess(
    userId: string,
    organizationId: string,
    action: string,
    resourceId: string,
    ipAddress?: string
  ) {
    await prisma.auditLog.create({
      data: {
        action: action as any,
        resource: 'PCI_ACCESS',
        resourceId,
        userId,
        organizationId,
        newValues: {
          timestamp: new Date().toISOString(),
          ipAddress,
          action,
        },
      },
    })
  }

  // Secure data deletion
  static secureDelete(data: string): void {
    // In Node.js, we can't truly overwrite memory, but we can clear references
    if (typeof data === 'string') {
      data = ''
    }
  }
}

// GDPR Compliance utilities
export class GDPRComplianceService {
  // Data retention policies
  static readonly RETENTION_PERIODS = {
    AUDIT_LOGS: 7 * 365, // 7 years for audit logs
    USER_DATA: 5 * 365, // 5 years for user data after account deletion
    RECEIPTS: 7 * 365, // 7 years for receipt data (tax purposes)
    SESSIONS: 30, // 30 days for session data
  }

  // Create data processing record
  static async recordDataProcessing(
    userId: string,
    organizationId: string,
    dataType: string,
    purpose: string,
    legalBasis: string
  ) {
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        resource: 'GDPR_DATA_PROCESSING',
        resourceId: `${dataType}-${Date.now()}`,
        userId,
        organizationId,
        newValues: {
          dataType,
          purpose,
          legalBasis,
          timestamp: new Date().toISOString(),
        },
      },
    })
  }

  // Export user data (GDPR Article 20 - Right to data portability)
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
        expenses: {
          include: {
            category: true,
            project: true,
            receipts: true,
          },
        },
        receipts: true,
        reports: true,
        auditLogs: {
          where: {
            userId,
          },
        },
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Remove sensitive fields
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        preferences: user.preferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organization: user.organization,
      expenses: user.expenses.map(expense => ({
        ...expense,
        receipts: expense.receipts.map(receipt => ({
          ...receipt,
          // Exclude file URLs for security
          fileUrl: undefined,
          thumbnailUrl: undefined,
        })),
      })),
      receipts: user.receipts.map(receipt => ({
        ...receipt,
        fileUrl: undefined,
        thumbnailUrl: undefined,
      })),
      reports: user.reports,
      auditLogs: user.auditLogs.map(log => ({
        action: log.action,
        resource: log.resource,
        createdAt: log.createdAt,
      })),
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: userId,
        version: '1.0',
        format: 'JSON',
      },
    }

    // Log the export
    await this.recordDataProcessing(
      userId,
      user.organizationId,
      'USER_DATA_EXPORT',
      'GDPR Article 20 - Data Portability',
      'User consent'
    )

    return exportData
  }

  // Delete user data (GDPR Article 17 - Right to erasure)
  static async deleteUserData(userId: string, retainForLegal: boolean = false) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (retainForLegal) {
      // Anonymize instead of delete for legal retention
      await prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${Date.now()}@example.com`,
          firstName: 'Deleted',
          lastName: 'User',
          avatar: null,
          hashedPassword: null,
          mfaSecret: null,
          mfaBackupCodes: [],
          preferences: {},
          isActive: false,
        },
      })

      await this.recordDataProcessing(
        userId,
        user.organizationId,
        'USER_DATA_ANONYMIZATION',
        'GDPR Article 17 with legal basis retention',
        'Legal obligation'
      )
    } else {
      // Full deletion
      await prisma.$transaction(async (tx) => {
        // Delete user's receipts files would be handled by storage service
        await tx.receipt.deleteMany({
          where: { userId },
        })

        // Delete user's expenses
        await tx.expense.deleteMany({
          where: { userId },
        })

        // Delete user's reports
        await tx.report.deleteMany({
          where: { userId },
        })

        // Delete user's sessions
        await tx.session.deleteMany({
          where: { userId },
        })

        // Delete the user
        await tx.user.delete({
          where: { id: userId },
        })
      })

      await this.recordDataProcessing(
        'SYSTEM',
        user.organizationId,
        'USER_DATA_DELETION',
        'GDPR Article 17 - Right to erasure',
        'User consent withdrawal'
      )
    }
  }

  // Clean up expired data based on retention policies
  static async cleanupExpiredData() {
    const now = new Date()
    
    // Clean up expired sessions
    const sessionCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.SESSIONS * 24 * 60 * 60 * 1000)
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: sessionCutoff,
        },
      },
    })

    // Clean up old audit logs (keep for legal requirements)
    const auditCutoff = new Date(now.getTime() - this.RETENTION_PERIODS.AUDIT_LOGS * 24 * 60 * 60 * 1000)
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: auditCutoff,
        },
      },
    })

    console.log(`GDPR cleanup completed at ${now.toISOString()}`)
  }

  // Generate privacy notice
  static generatePrivacyNotice() {
    return {
      dataController: {
        name: 'ExpenseTracker Pro',
        contact: 'privacy@expensetracker.com',
      },
      dataProcessed: [
        {
          type: 'Personal Information',
          data: ['Name', 'Email', 'Profile picture'],
          purpose: 'User account management and authentication',
          legalBasis: 'Contract performance',
          retention: '5 years after account deletion',
        },
        {
          type: 'Financial Data',
          data: ['Expense amounts', 'Receipt images', 'Transaction descriptions'],
          purpose: 'Expense tracking and reporting',
          legalBasis: 'Contract performance',
          retention: '7 years for tax compliance',
        },
        {
          type: 'Usage Data',
          data: ['Login times', 'Feature usage', 'IP addresses'],
          purpose: 'Service improvement and security',
          legalBasis: 'Legitimate interest',
          retention: '2 years',
        },
      ],
      userRights: [
        'Right to access your data',
        'Right to rectification',
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
      ],
      lastUpdated: new Date().toISOString(),
    }
  }
}

// Security monitoring and alerting
export class SecurityMonitoringService {
  // Detect suspicious activities
  static async detectSuspiciousActivity(userId: string, activity: string) {
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    // Check for multiple failed login attempts
    if (activity === 'LOGIN_FAILED') {
      const failedLogins = recentLogs.filter(log => 
        log.action === 'LOGIN' && log.newValues && 
        (log.newValues as any).failed === true
      ).length

      if (failedLogins >= 5) {
        await this.createSecurityAlert(
          userId,
          'MULTIPLE_FAILED_LOGINS',
          `${failedLogins} failed login attempts in 24 hours`
        )
      }
    }

    // Check for unusual data access patterns
    const dataAccess = recentLogs.filter(log => 
      log.resource === 'Expense' || log.resource === 'Receipt'
    ).length

    if (dataAccess > 100) {
      await this.createSecurityAlert(
        userId,
        'HIGH_DATA_ACCESS',
        `${dataAccess} data access events in 24 hours`
      )
    }
  }

  private static async createSecurityAlert(
    userId: string,
    alertType: string,
    description: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true, email: true },
    })

    if (user) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          resource: 'SECURITY_ALERT',
          resourceId: `${alertType}-${Date.now()}`,
          userId,
          organizationId: user.organizationId,
          newValues: {
            alertType,
            description,
            timestamp: new Date().toISOString(),
            userEmail: user.email,
          },
        },
      })

      // In a production environment, you would also send notifications
      // to security administrators here
      console.warn(`Security Alert: ${alertType} for user ${userId}: ${description}`)
    }
  }

  // Generate security report
  static async generateSecurityReport(organizationId: string, days: number = 30) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [loginEvents, dataAccess, securityAlerts] = await Promise.all([
      prisma.auditLog.count({
        where: {
          organizationId,
          action: 'LOGIN',
          createdAt: { gte: cutoff },
        },
      }),
      prisma.auditLog.count({
        where: {
          organizationId,
          resource: { in: ['Expense', 'Receipt'] },
          createdAt: { gte: cutoff },
        },
      }),
      prisma.auditLog.count({
        where: {
          organizationId,
          resource: 'SECURITY_ALERT',
          createdAt: { gte: cutoff },
        },
      }),
    ])

    return {
      period: `${days} days`,
      generatedAt: new Date().toISOString(),
      metrics: {
        loginEvents,
        dataAccess,
        securityAlerts,
      },
      recommendations: this.generateSecurityRecommendations({
        loginEvents,
        dataAccess,
        securityAlerts,
      }),
    }
  }

  private static generateSecurityRecommendations(metrics: {
    loginEvents: number
    dataAccess: number
    securityAlerts: number
  }) {
    const recommendations = []

    if (metrics.securityAlerts > 0) {
      recommendations.push('Review and address security alerts immediately')
    }

    if (metrics.loginEvents < 10) {
      recommendations.push('Consider reviewing user engagement and access patterns')
    }

    if (metrics.dataAccess > 1000) {
      recommendations.push('High data access volume detected - consider implementing additional monitoring')
    }

    return recommendations.length > 0 
      ? recommendations 
      : ['Security posture appears normal - continue regular monitoring']
  }
}

export default {
  EncryptionService,
  PCIComplianceService,
  GDPRComplianceService,
  SecurityMonitoringService,
}