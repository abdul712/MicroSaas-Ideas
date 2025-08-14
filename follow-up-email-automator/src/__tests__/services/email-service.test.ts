import { emailService } from '@/services/email-service'

// Mock SendGrid and Resend
jest.mock('@sendgrid/mail')
jest.mock('resend')

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('should send email successfully with SendGrid', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content',
        trackingId: 'test-tracking-id',
      }

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-message-id')
      expect(result.deliveryTime).toBeGreaterThan(0)
    })

    it('should fallback to Resend if SendGrid fails', async () => {
      const sgMail = require('@sendgrid/mail')
      sgMail.send.mockRejectedValue(new Error('SendGrid error'))

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      }

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-resend-id')
    })

    it('should return error if both providers fail', async () => {
      const sgMail = require('@sendgrid/mail')
      const { Resend } = require('resend')
      
      sgMail.send.mockRejectedValue(new Error('SendGrid error'))
      
      const mockResendInstance = new Resend()
      mockResendInstance.emails.send.mockRejectedValue(new Error('Resend error'))

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
      }

      const result = await emailService.sendEmail(emailData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should validate email input', async () => {
      const invalidEmailData = {
        to: 'invalid-email',
        subject: '',
        html: '',
      }

      const result = await emailService.sendEmail(invalidEmailData)

      expect(result.success).toBe(false)
    })

    it('should add tracking to email content', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test content with <a href=\"https://example.com\">link</a></p></body>',
        trackingId: 'test-tracking-id',
      }

      await emailService.sendEmail(emailData)

      const sgMail = require('@sendgrid/mail')
      const sentMessage = sgMail.send.mock.calls[0][0]
      
      // Check that tracking pixel was added
      expect(sentMessage.html).toContain('track/open/test-tracking-id')
      
      // Check that link tracking was added
      expect(sentMessage.html).toContain('track/click/test-tracking-id')
    })
  })

  describe('sendBulkEmails', () => {
    it('should send bulk emails successfully', async () => {
      const bulkData = {
        emails: [
          {
            to: 'test1@example.com',
            subject: 'Test Subject 1',
            html: '<p>Test content 1</p>',
          },
          {
            to: 'test2@example.com',
            subject: 'Test Subject 2',
            html: '<p>Test content 2</p>',
          },
        ],
        batchSize: 10,
      }

      const result = await emailService.sendBulkEmails(bulkData)

      expect(result.success).toBe(true)
      expect(result.sent).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
    })

    it('should handle partial failures in bulk sending', async () => {
      const sgMail = require('@sendgrid/mail')
      
      // Mock first email to succeed, second to fail
      sgMail.send
        .mockResolvedValueOnce([{ headers: { 'x-message-id': 'success-id' } }])
        .mockRejectedValueOnce(new Error('Failed to send'))

      // Also mock Resend fallback to fail
      const { Resend } = require('resend')
      const mockResendInstance = new Resend()
      mockResendInstance.emails.send.mockRejectedValue(new Error('Resend also failed'))

      const bulkData = {
        emails: [
          {
            to: 'success@example.com',
            subject: 'Success Subject',
            html: '<p>Success content</p>',
          },
          {
            to: 'fail@example.com',
            subject: 'Fail Subject',
            html: '<p>Fail content</p>',
          },
        ],
        batchSize: 10,
      }

      const result = await emailService.sendBulkEmails(bulkData)

      expect(result.success).toBe(false)
      expect(result.sent).toBe(1)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].email).toBe('fail@example.com')
    })

    it('should process emails in batches', async () => {
      const emails = Array.from({ length: 25 }, (_, i) => ({
        to: `test${i}@example.com`,
        subject: `Test Subject ${i}`,
        html: `<p>Test content ${i}</p>`,
      }))

      const bulkData = {
        emails,
        batchSize: 10,
      }

      const result = await emailService.sendBulkEmails(bulkData)

      expect(result.sent).toBe(25)
      
      // Should be called 25 times (once for each email)
      const sgMail = require('@sendgrid/mail')
      expect(sgMail.send).toHaveBeenCalledTimes(25)
    })
  })

  describe('validateEmailDeliverability', () => {
    it('should validate correct email addresses', async () => {
      const result = await emailService.validateEmailDeliverability('user@example.com')

      expect(result.isValid).toBe(true)
      expect(result.confidence).toBeGreaterThan(50)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect invalid email format', async () => {
      const result = await emailService.validateEmailDeliverability('invalid-email')

      expect(result.isValid).toBe(false)
      expect(result.confidence).toBe(0)
      expect(result.issues).toContain('Invalid email format')
    })

    it('should suggest corrections for typos', async () => {
      const result = await emailService.validateEmailDeliverability('user@gmial.com')

      expect(result.confidence).toBeLessThan(100)
      expect(result.issues).toContain('Possible domain typo')
      expect(result.suggestions.some(s => s.includes('gmail.com'))).toBe(true)
    })

    it('should detect disposable email domains', async () => {
      const result = await emailService.validateEmailDeliverability('user@tempmail.org')

      expect(result.confidence).toBeLessThan(100)
      expect(result.issues).toContain('Disposable email domain detected')
    })
  })

  describe('checkSpamScore', () => {
    it('should return low score for clean content', async () => {
      const result = await emailService.checkSpamScore(
        'Welcome to our service',
        'Thank you for joining us. We are excited to have you on board.'
      )

      expect(result.score).toBeLessThan(3)
      expect(result.issues).toHaveLength(0)
    })

    it('should detect spam trigger words', async () => {
      const result = await emailService.checkSpamScore(
        'FREE money guaranteed!',
        'Click here for no risk investment. Act now!'
      )

      expect(result.score).toBeGreaterThan(5)
      expect(result.issues.length).toBeGreaterThan(0)
      expect(result.suggestions.length).toBeGreaterThan(0)
    })

    it('should detect excessive capitals and punctuation', async () => {
      const result = await emailService.checkSpamScore(
        'URGENT MESSAGE!!!',
        'This is important content'
      )

      expect(result.score).toBeGreaterThan(0)
      expect(result.issues.some(issue => issue.includes('capital'))).toBe(true)
      expect(result.issues.some(issue => issue.includes('punctuation'))).toBe(true)
    })
  })

  describe('getEmailStats', () => {
    it('should return email statistics', async () => {
      const stats = await emailService.getEmailStats('test-tracking-id')

      expect(stats).toMatchObject({
        sent: expect.any(Boolean),
        delivered: expect.any(Boolean),
        opened: expect.any(Boolean),
        clicked: expect.any(Boolean),
        bounced: expect.any(Boolean),
        unsubscribed: expect.any(Boolean),
        openCount: expect.any(Number),
        clickCount: expect.any(Number),
      })
    })
  })

  describe('webhook processing', () => {
    it('should process SendGrid webhooks', async () => {
      const webhookData = [
        {
          event: 'delivered',
          sg_event_id: 'test-event-id',
          sg_message_id: 'test-message-id',
          email: 'test@example.com',
          timestamp: Date.now(),
        },
      ]

      await expect(
        emailService.processWebhook('sendgrid', webhookData)
      ).resolves.not.toThrow()
    })

    it('should process Resend webhooks', async () => {
      const webhookData = {
        type: 'email.delivered',
        data: {
          email_id: 'test-email-id',
          to: 'test@example.com',
          subject: 'Test Subject',
        },
      }

      await expect(
        emailService.processWebhook('resend', webhookData)
      ).resolves.not.toThrow()
    })
  })
})