/**
 * Privacy and GDPR/CCPA Compliance Utilities
 */

export interface ConsentPreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  personalization: boolean
  timestamp: Date
  version: string
}

export interface DataSubjectRequest {
  type: 'access' | 'delete' | 'portability' | 'rectification'
  customerId: string
  email?: string
  reason?: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  requestedAt: Date
  completedAt?: Date
}

export class PrivacyManager {
  private static instance: PrivacyManager
  private consentVersion = '1.0'

  static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager()
    }
    return PrivacyManager.instance
  }

  // Consent Management
  public getConsent(): ConsentPreferences | null {
    if (typeof window === 'undefined') return null
    
    const stored = localStorage.getItem('journey-consent-preferences')
    if (!stored) return null

    try {
      const parsed = JSON.parse(stored)
      return {
        ...parsed,
        timestamp: new Date(parsed.timestamp)
      }
    } catch {
      return null
    }
  }

  public setConsent(preferences: Omit<ConsentPreferences, 'timestamp' | 'version'>): void {
    if (typeof window === 'undefined') return

    const consent: ConsentPreferences = {
      ...preferences,
      timestamp: new Date(),
      version: this.consentVersion
    }

    localStorage.setItem('journey-consent-preferences', JSON.stringify(consent))
    
    // Set consent cookie for server-side tracking
    const expires = new Date()
    expires.setFullYear(expires.getFullYear() + 1)
    
    document.cookie = `journey-consent=${preferences.analytics ? 'true' : 'false'}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`

    // Dispatch event for tracking SDK
    window.dispatchEvent(new CustomEvent('consentChanged', { detail: consent }))
  }

  public hasValidConsent(): boolean {
    const consent = this.getConsent()
    if (!consent) return false

    // Check if consent is recent (less than 1 year old)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    return consent.timestamp > oneYearAgo && consent.version === this.consentVersion
  }

  public requiresConsentRenewal(): boolean {
    const consent = this.getConsent()
    if (!consent) return true

    // Check if consent is older than 11 months (remind before expiry)
    const elevenMonthsAgo = new Date()
    elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11)
    
    return consent.timestamp < elevenMonthsAgo || consent.version !== this.consentVersion
  }

  // Data Anonymization
  public anonymizeIP(ip: string): string {
    const parts = ip.split('.')
    if (parts.length === 4) {
      // IPv4 - zero out last octet
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
    
    // IPv6 - zero out last 64 bits
    const ipv6Parts = ip.split(':')
    if (ipv6Parts.length >= 4) {
      return ipv6Parts.slice(0, 4).join(':') + '::0'
    }
    
    return '0.0.0.0' // Fallback
  }

  public anonymizeEmail(email: string): string {
    const [local, domain] = email.split('@')
    if (!local || !domain) return '[REDACTED]'
    
    const maskedLocal = local.charAt(0) + '*'.repeat(Math.max(0, local.length - 2)) + local.charAt(local.length - 1)
    return `${maskedLocal}@${domain}`
  }

  public detectPII(data: Record<string, any>): string[] {
    const piiFields: string[] = []
    const piiPatterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[1-9][\d]{0,15}$/,
      ssn: /^\d{3}-\d{2}-\d{4}$/,
      creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
      ip: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    }

    const sensitiveKeywords = [
      'password', 'secret', 'token', 'key', 'ssn', 'social',
      'credit', 'card', 'bank', 'account', 'pin', 'cvv'
    ]

    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase()
      const valueStr = String(value)

      // Check for sensitive keywords in field names
      if (sensitiveKeywords.some(keyword => keyLower.includes(keyword))) {
        piiFields.push(key)
        continue
      }

      // Check for PII patterns in values
      for (const [piiType, pattern] of Object.entries(piiPatterns)) {
        if (pattern.test(valueStr)) {
          piiFields.push(key)
          break
        }
      }
    }

    return piiFields
  }

  public sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data }
    const piiFields = this.detectPII(data)

    for (const field of piiFields) {
      sanitized[field] = '[REDACTED]'
    }

    return sanitized
  }

  // Data Subject Rights (GDPR)
  public async requestDataAccess(customerId: string, email: string): Promise<string> {
    // In a real implementation, this would create a request in the database
    // and trigger a background job to collect all user data
    
    const requestId = `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`Data access request created: ${requestId} for customer: ${customerId}`)
    
    // Store request in database
    // await prisma.dataSubjectRequest.create({...})
    
    return requestId
  }

  public async requestDataDeletion(customerId: string, email: string, reason?: string): Promise<string> {
    const requestId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`Data deletion request created: ${requestId} for customer: ${customerId}`)
    
    // Store request in database
    // await prisma.dataSubjectRequest.create({...})
    
    return requestId
  }

  public async requestDataPortability(customerId: string, email: string): Promise<string> {
    const requestId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log(`Data portability request created: ${requestId} for customer: ${customerId}`)
    
    // Store request in database
    // await prisma.dataSubjectRequest.create({...})
    
    return requestId
  }

  // Compliance Helpers
  public generatePrivacyNotice(): string {
    return `
      Journey Mapper Privacy Notice
      
      We collect and process personal data to provide customer journey analytics services.
      
      Data Collected:
      - Technical information (IP address, device type, browser)
      - Behavioral data (page views, clicks, interactions)
      - Identifiers (customer ID, session ID)
      
      Legal Basis:
      - Legitimate interest for analytics
      - Consent for marketing cookies
      
      Your Rights:
      - Access your data
      - Request deletion
      - Data portability
      - Object to processing
      
      Contact: privacy@journeymapper.com
    `
  }

  public generateCookiePolicy(): string {
    return `
      Cookie Policy
      
      We use cookies to provide and improve our services.
      
      Cookie Types:
      - Necessary: Essential for service functionality
      - Analytics: Help us understand usage patterns
      - Marketing: Enable personalized content
      
      You can manage cookie preferences in your browser settings.
    `
  }

  // Retention Policy
  public getRetentionPeriod(dataType: string): number {
    const retentionPeriods = {
      'analytics': 730, // 2 years
      'session': 30,    // 30 days
      'logs': 90,       // 90 days
      'marketing': 365, // 1 year
      'support': 1095   // 3 years
    }

    return retentionPeriods[dataType] || 365 // Default 1 year
  }

  public shouldDeleteData(createdAt: Date, dataType: string): boolean {
    const retentionDays = this.getRetentionPeriod(dataType)
    const expiryDate = new Date(createdAt)
    expiryDate.setDate(expiryDate.getDate() + retentionDays)
    
    return new Date() > expiryDate
  }
}

// Cookie consent banner utilities
export function showConsentBanner(): void {
  if (typeof window === 'undefined') return
  
  const privacyManager = PrivacyManager.getInstance()
  
  if (privacyManager.hasValidConsent()) {
    return // No need to show banner
  }

  // Create and show consent banner
  const banner = document.createElement('div')
  banner.id = 'consent-banner'
  banner.className = 'fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50'
  banner.innerHTML = `
    <div class="container mx-auto flex flex-col sm:flex-row items-center justify-between">
      <div class="mb-4 sm:mb-0">
        <p class="text-sm">
          We use cookies to improve your experience and analyze usage. 
          <a href="/privacy" class="underline">Learn more</a>
        </p>
      </div>
      <div class="flex space-x-4">
        <button id="accept-all" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm">
          Accept All
        </button>
        <button id="accept-necessary" class="border border-gray-300 hover:bg-gray-100 hover:text-gray-900 px-4 py-2 rounded text-sm">
          Necessary Only
        </button>
        <button id="customize" class="text-gray-300 hover:text-white text-sm">
          Customize
        </button>
      </div>
    </div>
  `

  document.body.appendChild(banner)

  // Add event listeners
  document.getElementById('accept-all')?.addEventListener('click', () => {
    privacyManager.setConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true
    })
    banner.remove()
  })

  document.getElementById('accept-necessary')?.addEventListener('click', () => {
    privacyManager.setConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      personalization: false
    })
    banner.remove()
  })

  document.getElementById('customize')?.addEventListener('click', () => {
    // Show detailed consent modal
    showConsentModal()
    banner.remove()
  })
}

export function showConsentModal(): void {
  // Implementation for detailed consent preferences modal
  console.log('Show consent modal - would open detailed preferences')
}

// Initialize privacy manager on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    const privacyManager = PrivacyManager.getInstance()
    
    // Show consent banner if needed
    if (!privacyManager.hasValidConsent()) {
      setTimeout(showConsentBanner, 1000) // Delay to not interfere with page load
    }
    
    // Check for consent renewal
    if (privacyManager.requiresConsentRenewal()) {
      console.log('Consent renewal required - consider showing renewal notice')
    }
  })
}