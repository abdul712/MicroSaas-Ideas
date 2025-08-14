import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export interface PrivacyConfig {
  gdprCompliant: boolean
  ccpaCompliant: boolean
  cookieConsent: boolean
  dataRetentionDays: number
  anonymizationLevel: 'none' | 'partial' | 'full'
  allowCrossSiteTracking: boolean
}

export interface TrackingEvent {
  anonymousId: string
  sessionId: string
  eventType: string
  properties: Record<string, any>
  timestamp: Date
  pageUrl: string
  userAgent?: string
  ipAddress?: string
  fingerprint?: string
}

export interface ConsentData {
  hasConsent: boolean
  consentTypes: string[]
  consentTimestamp: Date
  consentVersion: string
}

export class PrivacyCompliantTracker {
  private config: PrivacyConfig
  private consentData: ConsentData | null = null

  constructor(config: PrivacyConfig) {
    this.config = config
  }

  /**
   * Initialize tracking with privacy compliance
   */
  initialize(): string {
    // Generate or retrieve anonymous ID
    const anonymousId = this.getAnonymousId()
    
    // Check for existing consent
    this.checkExistingConsent()
    
    return anonymousId
  }

  /**
   * Track an event with privacy compliance
   */
  async trackEvent(
    eventType: string,
    properties: Record<string, any> = {},
    context: {
      pageUrl: string
      userAgent?: string
      ipAddress?: string
    }
  ): Promise<TrackingEvent | null> {
    // Check consent requirements
    if (!this.hasRequiredConsent(eventType)) {
      console.warn('Event tracking blocked due to insufficient consent')
      return null
    }

    // Generate anonymous identifiers
    const anonymousId = this.getAnonymousId()
    const sessionId = this.getSessionId()

    // Apply privacy filters
    const sanitizedProperties = this.sanitizeProperties(properties)
    const anonymizedContext = this.anonymizeContext(context)

    const event: TrackingEvent = {
      anonymousId,
      sessionId,
      eventType,
      properties: sanitizedProperties,
      timestamp: new Date(),
      pageUrl: anonymizedContext.pageUrl,
      userAgent: anonymizedContext.userAgent,
      ipAddress: anonymizedContext.ipAddress,
      fingerprint: this.generateFingerprint(context),
    }

    return event
  }

  /**
   * Set user consent preferences
   */
  setConsent(consentTypes: string[], version: string = '1.0'): void {
    this.consentData = {
      hasConsent: consentTypes.length > 0,
      consentTypes,
      consentTimestamp: new Date(),
      consentVersion: version,
    }

    // Store consent in local storage (client-side)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cro_consent', JSON.stringify(this.consentData))
    }
  }

  /**
   * Revoke consent and clean up data
   */
  revokeConsent(): void {
    this.consentData = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cro_consent')
      localStorage.removeItem('cro_anonymous_id')
      localStorage.removeItem('cro_session_id')
      
      // Clear any tracking cookies
      this.clearTrackingCookies()
    }
  }

  /**
   * Get anonymized user identifier
   */
  private getAnonymousId(): string {
    if (typeof window === 'undefined') {
      return uuidv4()
    }

    let anonymousId = localStorage.getItem('cro_anonymous_id')
    
    if (!anonymousId) {
      anonymousId = uuidv4()
      localStorage.setItem('cro_anonymous_id', anonymousId)
    }

    return anonymousId
  }

  /**
   * Get session identifier
   */
  private getSessionId(): string {
    if (typeof window === 'undefined') {
      return uuidv4()
    }

    let sessionId = sessionStorage.getItem('cro_session_id')
    
    if (!sessionId) {
      sessionId = uuidv4()
      sessionStorage.setItem('cro_session_id', sessionId)
    }

    return sessionId
  }

  /**
   * Check if user has required consent for tracking
   */
  private hasRequiredConsent(eventType: string): boolean {
    // Always allow essential functionality
    if (eventType === 'page_view' && !this.config.cookieConsent) {
      return true
    }

    if (!this.consentData?.hasConsent) {
      return false
    }

    // Check specific consent types
    const requiredConsents = this.getRequiredConsents(eventType)
    return requiredConsents.every(consent => 
      this.consentData!.consentTypes.includes(consent)
    )
  }

  /**
   * Get required consent types for event
   */
  private getRequiredConsents(eventType: string): string[] {
    const consentMap: Record<string, string[]> = {
      'page_view': ['analytics'],
      'click': ['analytics'],
      'form_start': ['analytics'],
      'form_submit': ['analytics'],
      'purchase': ['analytics', 'marketing'],
      'video_play': ['analytics'],
      'scroll': ['analytics'],
      'heatmap_click': ['analytics'],
      'ab_test_view': ['analytics', 'optimization'],
    }

    return consentMap[eventType] || ['analytics']
  }

  /**
   * Sanitize event properties for privacy
   */
  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    const sanitized = { ...properties }

    // Remove or hash sensitive data
    const sensitiveFields = [
      'email', 'phone', 'name', 'address', 
      'credit_card', 'ssn', 'password'
    ]

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        if (this.config.anonymizationLevel === 'full') {
          delete sanitized[field]
        } else if (this.config.anonymizationLevel === 'partial') {
          sanitized[field] = this.hashValue(sanitized[field])
        }
      }
    })

    // Limit data collection based on configuration
    if (this.config.gdprCompliant) {
      // Remove unnecessary metadata
      delete sanitized.browser_plugins
      delete sanitized.screen_resolution
      delete sanitized.timezone
    }

    return sanitized
  }

  /**
   * Anonymize context data
   */
  private anonymizeContext(context: {
    pageUrl: string
    userAgent?: string
    ipAddress?: string
  }): {
    pageUrl: string
    userAgent?: string
    ipAddress?: string
  } {
    const anonymized = { ...context }

    // Anonymize IP address for GDPR compliance
    if (anonymized.ipAddress && this.config.gdprCompliant) {
      anonymized.ipAddress = this.anonymizeIpAddress(anonymized.ipAddress)
    }

    // Reduce user agent precision
    if (anonymized.userAgent && this.config.anonymizationLevel !== 'none') {
      anonymized.userAgent = this.anonymizeUserAgent(anonymized.userAgent)
    }

    // Remove query parameters that might contain PII
    if (anonymized.pageUrl) {
      anonymized.pageUrl = this.sanitizeUrl(anonymized.pageUrl)
    }

    return anonymized
  }

  /**
   * Generate privacy-compliant fingerprint
   */
  private generateFingerprint(context: any): string {
    if (this.config.anonymizationLevel === 'full') {
      return ''
    }

    // Use only non-identifying characteristics
    const fingerprintData = {
      screen: typeof window !== 'undefined' ? `${screen.width}x${screen.height}` : '',
      timezone: typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
      language: typeof window !== 'undefined' ? navigator.language : '',
    }

    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex')
      .substring(0, 16)
  }

  /**
   * Hash sensitive values
   */
  private hashValue(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex')
      .substring(0, 8)
  }

  /**
   * Anonymize IP address
   */
  private anonymizeIpAddress(ip: string): string {
    // IPv4: Remove last octet
    if (ip.includes('.')) {
      const parts = ip.split('.')
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
    
    // IPv6: Remove last 64 bits
    if (ip.includes(':')) {
      const parts = ip.split(':')
      return parts.slice(0, 4).join(':') + '::0'
    }

    return '0.0.0.0'
  }

  /**
   * Anonymize user agent
   */
  private anonymizeUserAgent(userAgent: string): string {
    // Extract only browser and OS information
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/)
    const osMatch = userAgent.match(/(Windows|Mac|Linux|iOS|Android)/)
    
    const browser = browserMatch ? browserMatch[0] : 'Unknown'
    const os = osMatch ? osMatch[0] : 'Unknown'
    
    return `${browser} (${os})`
  }

  /**
   * Sanitize URL to remove PII
   */
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      
      // Remove sensitive query parameters
      const sensitiveParams = ['email', 'phone', 'token', 'key', 'id', 'user']
      sensitiveParams.forEach(param => {
        urlObj.searchParams.delete(param)
      })

      // Remove fragment if it contains sensitive data
      if (urlObj.hash.includes('token') || urlObj.hash.includes('key')) {
        urlObj.hash = ''
      }

      return urlObj.toString()
    } catch {
      return url.split('?')[0] // Return just the pathname if URL parsing fails
    }
  }

  /**
   * Check for existing consent
   */
  private checkExistingConsent(): void {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem('cro_consent')
    if (stored) {
      try {
        this.consentData = JSON.parse(stored)
      } catch {
        localStorage.removeItem('cro_consent')
      }
    }
  }

  /**
   * Clear tracking cookies
   */
  private clearTrackingCookies(): void {
    const cookies = ['_cro_id', '_cro_session', '_cro_test']
    cookies.forEach(cookie => {
      document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    })
  }

  /**
   * Data retention cleanup
   */
  static async cleanupExpiredData(
    projectId: string,
    retentionDays: number
  ): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    // This would typically be implemented in a background job
    console.log(`Cleaning up data older than ${cutoffDate.toISOString()} for project ${projectId}`)
    
    // Implementation would delete expired conversion events, user sessions, etc.
  }
}

export class ConsentManager {
  /**
   * Generate consent banner configuration
   */
  static generateConsentBanner(config: PrivacyConfig): {
    required: boolean
    categories: ConsentCategory[]
    text: string
  } {
    const categories: ConsentCategory[] = [
      {
        id: 'essential',
        name: 'Essential',
        description: 'Required for basic website functionality',
        required: true,
        enabled: true,
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Helps us understand how visitors interact with our website',
        required: false,
        enabled: false,
      },
      {
        id: 'optimization',
        name: 'Optimization',
        description: 'Allows us to test different versions to improve user experience',
        required: false,
        enabled: false,
      },
    ]

    if (!config.gdprCompliant && !config.ccpaCompliant) {
      categories.forEach(cat => {
        if (!cat.required) cat.enabled = true
      })
    }

    return {
      required: config.gdprCompliant || config.ccpaCompliant,
      categories,
      text: config.gdprCompliant 
        ? 'We use cookies and similar technologies to improve your experience and analyze website usage.'
        : 'This website uses cookies to enhance user experience.',
    }
  }
}

export interface ConsentCategory {
  id: string
  name: string
  description: string
  required: boolean
  enabled: boolean
}

export default PrivacyCompliantTracker