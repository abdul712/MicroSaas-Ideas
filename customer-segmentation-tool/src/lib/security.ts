import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const scryptAsync = promisify(scrypt)

export class SecurityManager {
  private static readonly SALT_LENGTH = 32
  private static readonly KEY_LENGTH = 64
  private static readonly JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'
  private static readonly JWT_EXPIRES_IN = '7d'

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Encrypt sensitive data using scrypt
   */
  static async encryptData(data: string): Promise<{ encrypted: string; salt: string }> {
    const salt = randomBytes(this.SALT_LENGTH)
    const key = (await scryptAsync(data, salt, this.KEY_LENGTH)) as Buffer
    
    return {
      encrypted: key.toString('hex'),
      salt: salt.toString('hex')
    }
  }

  /**
   * Decrypt sensitive data
   */
  static async decryptData(encrypted: string, salt: string, originalData: string): Promise<boolean> {
    const encryptedBuffer = Buffer.from(encrypted, 'hex')
    const saltBuffer = Buffer.from(salt, 'hex')
    
    const key = (await scryptAsync(originalData, saltBuffer, this.KEY_LENGTH)) as Buffer
    
    return timingSafeEqual(encryptedBuffer, key)
  }

  /**
   * Generate JWT token
   */
  static generateJWT(payload: Record<string, any>): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      algorithm: 'HS256'
    })
  }

  /**
   * Verify JWT token
   */
  static verifyJWT(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  /**
   * Generate secure API key
   */
  static generateApiKey(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Hash API key for storage
   */
  static async hashApiKey(apiKey: string): Promise<string> {
    return this.hashPassword(apiKey)
  }

  /**
   * Anonymize email for GDPR compliance
   */
  static anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@')
    const anonymizedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : local
    return `${anonymizedLocal}@${domain}`
  }

  /**
   * Anonymize PII data
   */
  static anonymizePII(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['email', 'phone', 'firstName', 'lastName', 'address']
    const anonymized = { ...data }

    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        switch (field) {
          case 'email':
            anonymized[field] = this.anonymizeEmail(anonymized[field])
            break
          case 'phone':
            anonymized[field] = '*'.repeat(anonymized[field].length - 4) + anonymized[field].slice(-4)
            break
          case 'firstName':
          case 'lastName':
            anonymized[field] = anonymized[field].charAt(0) + '*'.repeat(anonymized[field].length - 1)
            break
          default:
            anonymized[field] = '[REDACTED]'
        }
      }
    }

    return anonymized
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Generate CSRF token
   */
  static generateCSRFToken(): string {
    return randomBytes(32).toString('hex')
  }

  /**
   * Sanitize input to prevent XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Rate limiting token bucket
   */
  static createRateLimiter(maxTokens: number, refillRate: number) {
    const buckets = new Map<string, { tokens: number; lastRefill: number }>()

    return {
      isAllowed(key: string): boolean {
        const now = Date.now()
        const bucket = buckets.get(key) || { tokens: maxTokens, lastRefill: now }

        // Refill tokens based on time passed
        const timePassed = now - bucket.lastRefill
        const tokensToAdd = Math.floor(timePassed / (1000 / refillRate))
        bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd)
        bucket.lastRefill = now

        if (bucket.tokens > 0) {
          bucket.tokens--
          buckets.set(key, bucket)
          return true
        }

        buckets.set(key, bucket)
        return false
      },

      getRemainingTokens(key: string): number {
        return buckets.get(key)?.tokens || maxTokens
      }
    }
  }
}

/**
 * GDPR Compliance utilities
 */
export class GDPRManager {
  /**
   * Check if user has given consent for data processing
   */
  static hasConsent(userId: string, purpose: string): boolean {
    // In production, this would check against a consent database
    return true // Placeholder
  }

  /**
   * Record user consent
   */
  static async recordConsent(userId: string, purposes: string[], ipAddress: string): Promise<void> {
    // Implementation would store consent record with timestamp
    console.log(`Recording consent for user ${userId}: ${purposes.join(', ')}`)
  }

  /**
   * Withdraw consent
   */
  static async withdrawConsent(userId: string, purposes: string[]): Promise<void> {
    // Implementation would update consent records
    console.log(`Withdrawing consent for user ${userId}: ${purposes.join(', ')}`)
  }

  /**
   * Export user data (Right to Access)
   */
  static async exportUserData(userId: string): Promise<Record<string, any>> {
    // Implementation would collect all user data across systems
    return {
      personal: {},
      activity: {},
      segments: {},
      campaigns: {}
    }
  }

  /**
   * Delete user data (Right to Deletion/Right to be Forgotten)
   */
  static async deleteUserData(userId: string): Promise<void> {
    // Implementation would anonymize or delete all user data
    console.log(`Deleting all data for user ${userId}`)
  }

  /**
   * Portability - export data in machine-readable format
   */
  static async exportPortableData(userId: string): Promise<string> {
    const userData = await this.exportUserData(userId)
    return JSON.stringify(userData, null, 2)
  }
}

/**
 * Audit logging for compliance
 */
export class AuditLogger {
  /**
   * Log data access
   */
  static logDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    ipAddress?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      resourceType,
      resourceId,
      action,
      ipAddress,
      type: 'DATA_ACCESS'
    }

    // In production, this would write to a secure audit log
    console.log('AUDIT:', logEntry)
  }

  /**
   * Log data modification
   */
  static logDataModification(
    userId: string,
    resourceType: string,
    resourceId: string,
    changes: Record<string, any>,
    ipAddress?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      resourceType,
      resourceId,
      changes: SecurityManager.anonymizePII(changes),
      ipAddress,
      type: 'DATA_MODIFICATION'
    }

    console.log('AUDIT:', logEntry)
  }

  /**
   * Log authentication events
   */
  static logAuthEvent(
    userId: string,
    event: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE',
    ipAddress?: string,
    userAgent?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      event,
      ipAddress,
      userAgent,
      type: 'AUTHENTICATION'
    }

    console.log('AUDIT:', logEntry)
  }

  /**
   * Log consent events
   */
  static logConsentEvent(
    userId: string,
    action: 'GIVEN' | 'WITHDRAWN',
    purposes: string[],
    ipAddress?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      purposes,
      ipAddress,
      type: 'CONSENT'
    }

    console.log('AUDIT:', logEntry)
  }
}

/**
 * Content Security Policy helpers
 */
export class CSPManager {
  static getCSPHeader(): string {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://*.googleapis.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ]

    return cspDirectives.join('; ')
  }

  static getSecurityHeaders(): Record<string, string> {
    return {
      'Content-Security-Policy': this.getCSPHeader(),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    }
  }
}