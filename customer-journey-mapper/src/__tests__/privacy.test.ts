/**
 * @jest-environment jsdom
 */

import { PrivacyManager } from '../lib/privacy'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: ''
})

describe('PrivacyManager', () => {
  let privacyManager: PrivacyManager

  beforeEach(() => {
    privacyManager = PrivacyManager.getInstance()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    document.cookie = ''
  })

  describe('Consent Management', () => {
    it('should return null when no consent is stored', () => {
      localStorageMock.getItem.mockReturnValue(null)
      expect(privacyManager.getConsent()).toBeNull()
    })

    it('should parse stored consent correctly', () => {
      const mockConsent = {
        necessary: true,
        analytics: true,
        marketing: false,
        personalization: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockConsent))

      const consent = privacyManager.getConsent()
      expect(consent).toBeTruthy()
      expect(consent?.necessary).toBe(true)
      expect(consent?.analytics).toBe(true)
      expect(consent?.marketing).toBe(false)
    })

    it('should set consent preferences', () => {
      const preferences = {
        necessary: true,
        analytics: true,
        marketing: false,
        personalization: true
      }

      privacyManager.setConsent(preferences)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'journey-consent-preferences',
        expect.stringContaining('"necessary":true')
      )
    })

    it('should validate consent correctly', () => {
      // Mock recent valid consent
      const recentConsent = {
        necessary: true,
        analytics: true,
        marketing: false,
        personalization: false,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(recentConsent))

      expect(privacyManager.hasValidConsent()).toBe(true)
    })

    it('should invalidate old consent', () => {
      // Mock old consent (over 1 year)
      const oldDate = new Date()
      oldDate.setFullYear(oldDate.getFullYear() - 2)
      
      const oldConsent = {
        necessary: true,
        analytics: true,
        marketing: false,
        personalization: false,
        timestamp: oldDate.toISOString(),
        version: '1.0'
      }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(oldConsent))

      expect(privacyManager.hasValidConsent()).toBe(false)
    })
  })

  describe('Data Anonymization', () => {
    it('should anonymize IPv4 addresses', () => {
      expect(privacyManager.anonymizeIP('192.168.1.100')).toBe('192.168.1.0')
      expect(privacyManager.anonymizeIP('10.0.0.1')).toBe('10.0.0.0')
    })

    it('should anonymize IPv6 addresses', () => {
      expect(privacyManager.anonymizeIP('2001:0db8:85a3:0000:0000:8a2e:0370:7334'))
        .toBe('2001:0db8:85a3:0000::0')
    })

    it('should anonymize email addresses', () => {
      expect(privacyManager.anonymizeEmail('test@example.com')).toBe('t**t@example.com')
      expect(privacyManager.anonymizeEmail('a@domain.org')).toBe('a@domain.org')
      expect(privacyManager.anonymizeEmail('longer.email@test.com')).toBe('l**********l@test.com')
    })

    it('should detect PII in data', () => {
      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        age: 30,
        password: 'secret123',
        address: '123 Main St'
      }

      const piiFields = privacyManager.detectPII(data)
      expect(piiFields).toContain('email')
      expect(piiFields).toContain('phone')
      expect(piiFields).toContain('password')
      expect(piiFields).not.toContain('age')
    })

    it('should sanitize data with PII', () => {
      const data = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'secret123',
        age: 25
      }

      const sanitized = privacyManager.sanitizeData(data)
      expect(sanitized.username).toBe('testuser')
      expect(sanitized.email).toBe('[REDACTED]')
      expect(sanitized.password).toBe('[REDACTED]')
      expect(sanitized.age).toBe(25)
    })
  })

  describe('Data Subject Rights', () => {
    it('should create data access request', async () => {
      const requestId = await privacyManager.requestDataAccess('customer123', 'test@example.com')
      expect(requestId).toMatch(/^access_\d+_[a-z0-9]+$/)
    })

    it('should create data deletion request', async () => {
      const requestId = await privacyManager.requestDataDeletion('customer123', 'test@example.com', 'No longer needed')
      expect(requestId).toMatch(/^delete_\d+_[a-z0-9]+$/)
    })

    it('should create data portability request', async () => {
      const requestId = await privacyManager.requestDataPortability('customer123', 'test@example.com')
      expect(requestId).toMatch(/^export_\d+_[a-z0-9]+$/)
    })
  })

  describe('Retention Policy', () => {
    it('should return correct retention periods', () => {
      expect(privacyManager.getRetentionPeriod('analytics')).toBe(730)
      expect(privacyManager.getRetentionPeriod('session')).toBe(30)
      expect(privacyManager.getRetentionPeriod('logs')).toBe(90)
      expect(privacyManager.getRetentionPeriod('unknown')).toBe(365)
    })

    it('should determine if data should be deleted', () => {
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 400) // 400 days old

      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10) // 10 days old

      expect(privacyManager.shouldDeleteData(oldDate, 'analytics')).toBe(false) // 730 day retention
      expect(privacyManager.shouldDeleteData(oldDate, 'session')).toBe(true) // 30 day retention
      expect(privacyManager.shouldDeleteData(recentDate, 'session')).toBe(false)
    })
  })

  describe('Compliance Helpers', () => {
    it('should generate privacy notice', () => {
      const notice = privacyManager.generatePrivacyNotice()
      expect(notice).toContain('Journey Mapper Privacy Notice')
      expect(notice).toContain('Data Collected')
      expect(notice).toContain('Your Rights')
    })

    it('should generate cookie policy', () => {
      const policy = privacyManager.generateCookiePolicy()
      expect(policy).toContain('Cookie Policy')
      expect(policy).toContain('Cookie Types')
      expect(policy).toContain('Necessary')
      expect(policy).toContain('Analytics')
    })
  })
})