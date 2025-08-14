import sgMail from '@sendgrid/mail'
import { Resend } from 'resend'
import { z } from 'zod'

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

// Configure Resend as backup
const resend = new Resend(process.env.RESEND_API_KEY || '')

const EmailInput = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  from: z.string().email().optional(),
  trackingId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customArgs: z.record(z.string()).optional(),
})

const BulkEmailInput = z.object({
  emails: z.array(EmailInput),
  batchSize: z.number().default(100),
})

type EmailInput = z.infer<typeof EmailInput>
type BulkEmailInput = z.infer<typeof BulkEmailInput>

interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  deliveryTime?: number
}

interface BulkEmailResult {
  success: boolean
  sent: number
  failed: number
  errors: Array<{ email: string; error: string }>
}

class EmailService {
  private defaultFrom: string
  private trackingBaseUrl: string

  constructor() {
    this.defaultFrom = process.env.DEFAULT_FROM_EMAIL || 'noreply@emailflow.com'
    this.trackingBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }

  async sendEmail(input: EmailInput): Promise<EmailResult> {
    const startTime = Date.now()
    
    try {
      const validatedInput = EmailInput.parse(input)
      
      // Add tracking pixels and links if trackingId provided
      let processedHtml = validatedInput.html
      if (validatedInput.trackingId) {
        processedHtml = this.addTrackingToEmail(validatedInput.html, validatedInput.trackingId)
      }

      // Try SendGrid first
      const result = await this.sendWithSendGrid({
        ...validatedInput,
        html: processedHtml,
      })

      const deliveryTime = Date.now() - startTime

      return {
        success: true,
        messageId: result.messageId,
        deliveryTime,
      }

    } catch (error) {
      console.error('Email sending error:', error)
      
      // Try Resend as fallback
      try {
        const fallbackResult = await this.sendWithResend(input)
        const deliveryTime = Date.now() - startTime
        
        return {
          success: true,
          messageId: fallbackResult.messageId,
          deliveryTime,
        }
      } catch (fallbackError) {
        console.error('Fallback email sending failed:', fallbackError)
        
        return {
          success: false,
          error: fallbackError instanceof Error ? fallbackError.message : 'Unknown error',
          deliveryTime: Date.now() - startTime,
        }
      }
    }
  }

  async sendBulkEmails(input: BulkEmailInput): Promise<BulkEmailResult> {
    const { emails, batchSize } = BulkEmailInput.parse(input)
    
    let sent = 0
    let failed = 0
    const errors: Array<{ email: string; error: string }> = []

    // Process in batches to avoid rate limits
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      
      // Send batch concurrently
      const batchResults = await Promise.allSettled(
        batch.map(email => this.sendEmail(email))
      )

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++
        } else {
          failed++
          errors.push({
            email: batch[index].to,
            error: result.status === 'fulfilled' ? 
              result.value.error || 'Unknown error' : 
              result.reason?.message || 'Promise rejected'
          })
        }
      })

      // Add delay between batches to respect rate limits
      if (i + batchSize < emails.length) {
        await this.delay(1000) // 1 second delay
      }
    }

    return {
      success: failed === 0,
      sent,
      failed,
      errors,
    }
  }

  async validateEmailDeliverability(email: string): Promise<{
    isValid: boolean
    confidence: number
    issues: string[]
    suggestions: string[]
  }> {
    const issues: string[] = []
    const suggestions: string[] = []
    let confidence = 100

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        confidence: 0,
        issues: ['Invalid email format'],
        suggestions: ['Please check the email address format']
      }
    }

    // Domain validation
    const domain = email.split('@')[1]
    
    // Check for common typos
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    const typoSuggestions = this.suggestDomainCorrections(domain, commonDomains)
    
    if (typoSuggestions.length > 0) {
      confidence -= 20
      issues.push('Possible domain typo')
      suggestions.push(`Did you mean: ${typoSuggestions.join(', ')}?`)
    }

    // Check for disposable email domains
    const disposableDomains = ['tempmail.org', '10minutemail.com', 'guerrillamail.com']
    if (disposableDomains.includes(domain.toLowerCase())) {
      confidence -= 50
      issues.push('Disposable email domain detected')
      suggestions.push('Consider using a permanent email address')
    }

    return {
      isValid: confidence > 50,
      confidence,
      issues,
      suggestions,
    }
  }

  async getEmailStats(trackingId: string): Promise<{
    sent: boolean
    delivered: boolean
    opened: boolean
    clicked: boolean
    bounced: boolean
    unsubscribed: boolean
    openCount: number
    clickCount: number
    lastOpened?: Date
    lastClicked?: Date
  }> {
    // In a real implementation, this would query the database
    // For now, return mock data
    return {
      sent: true,
      delivered: true,
      opened: false,
      clicked: false,
      bounced: false,
      unsubscribed: false,
      openCount: 0,
      clickCount: 0,
    }
  }

  async processWebhook(provider: 'sendgrid' | 'resend', payload: any): Promise<void> {
    try {
      if (provider === 'sendgrid') {
        await this.processSendGridWebhook(payload)
      } else if (provider === 'resend') {
        await this.processResendWebhook(payload)
      }
    } catch (error) {
      console.error(`Webhook processing error (${provider}):`, error)
      throw error
    }
  }

  private async sendWithSendGrid(input: EmailInput): Promise<{ messageId: string }> {
    const msg = {
      to: input.to,
      from: input.from || this.defaultFrom,
      subject: input.subject,
      html: input.html,
      text: input.text,
      trackingSettings: {
        clickTracking: { enable: !!input.trackingId },
        openTracking: { enable: !!input.trackingId },
      },
      customArgs: input.customArgs || {},
    }

    const [response] = await sgMail.send(msg)
    return { messageId: response.headers['x-message-id'] }
  }

  private async sendWithResend(input: EmailInput): Promise<{ messageId: string }> {
    const result = await resend.emails.send({
      from: input.from || this.defaultFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      tags: input.tags || [],
    })

    if (result.error) {
      throw new Error(result.error.message)
    }

    return { messageId: result.data?.id || '' }
  }

  private addTrackingToEmail(html: string, trackingId: string): string {
    let processedHtml = html

    // Add open tracking pixel
    const trackingPixel = `<img src="${this.trackingBaseUrl}/api/track/open/${trackingId}" width="1" height="1" style="display:none;" />`
    processedHtml = processedHtml.replace('</body>', `${trackingPixel}</body>`)

    // Add click tracking to links
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi
    processedHtml = processedHtml.replace(linkRegex, (match, url, attributes) => {
      const trackingUrl = `${this.trackingBaseUrl}/api/track/click/${trackingId}?url=${encodeURIComponent(url)}`
      return `<a href="${trackingUrl}"${attributes}>`
    })

    return processedHtml
  }

  private async processSendGridWebhook(events: any[]): Promise<void> {
    // Process SendGrid webhook events
    for (const event of events) {
      const { event: eventType, sg_event_id, sg_message_id, email, timestamp } = event
      
      // Here you would update your database based on the event
      console.log('SendGrid webhook event:', { eventType, sg_message_id, email, timestamp })
    }
  }

  private async processResendWebhook(event: any): Promise<void> {
    // Process Resend webhook events
    const { type, data } = event
    
    // Here you would update your database based on the event
    console.log('Resend webhook event:', { type, data })
  }

  private suggestDomainCorrections(domain: string, commonDomains: string[]): string[] {
    const suggestions: string[] = []
    
    commonDomains.forEach(commonDomain => {
      const distance = this.levenshteinDistance(domain.toLowerCase(), commonDomain)
      if (distance === 1 || (distance === 2 && domain.length > 5)) {
        suggestions.push(commonDomain)
      }
    })

    return suggestions
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async warmupDomain(domain: string, dailyLimit: number = 50): Promise<void> {
    // Domain warmup process - gradually increase sending volume
    console.log(`Starting domain warmup for ${domain} with daily limit ${dailyLimit}`)
    
    // This would be implemented as a scheduled job that gradually increases
    // the number of emails sent from the domain over several weeks
  }

  async checkSpamScore(subject: string, content: string): Promise<{
    score: number
    issues: string[]
    suggestions: string[]
  }> {
    const issues: string[] = []
    const suggestions: string[] = []
    let score = 0

    // Check for spam trigger words
    const spamWords = ['free', 'guarantee', 'no risk', 'act now', 'limited time', 'click here']
    const subjectLower = subject.toLowerCase()
    const contentLower = content.toLowerCase()

    spamWords.forEach(word => {
      if (subjectLower.includes(word)) {
        score += 2
        issues.push(`Subject contains spam trigger word: "${word}"`)
      }
      if (contentLower.includes(word)) {
        score += 1
        issues.push(`Content contains spam trigger word: "${word}"`)
      }
    })

    // Check for excessive capitals
    if (subject.match(/[A-Z]{3,}/g)) {
      score += 3
      issues.push('Subject contains excessive capital letters')
      suggestions.push('Reduce the use of capital letters in subject')
    }

    // Check for excessive punctuation
    if (subject.match(/[!]{2,}/g) || subject.match(/[?]{2,}/g)) {
      score += 2
      issues.push('Subject contains excessive punctuation')
      suggestions.push('Limit punctuation marks in subject line')
    }

    if (score > 5) {
      suggestions.push('Consider rewriting the email to reduce spam score')
    }

    return { score, issues, suggestions }
  }
}

export const emailService = new EmailService()