import { prisma } from '@/lib/prisma'
import { CampaignType, CampaignStatus } from '@prisma/client'

export interface CampaignConfig {
  name: string
  type: CampaignType
  segmentId?: string
  settings: {
    subject?: string // for email campaigns
    content?: string
    template?: string
    scheduledAt?: Date
    timezone?: string
    // Email specific
    fromName?: string
    fromEmail?: string
    replyTo?: string
    // SMS specific
    smsContent?: string
    // Webhook specific
    webhookUrl?: string
    webhookMethod?: 'GET' | 'POST' | 'PUT'
    webhookHeaders?: Record<string, string>
    // Export specific
    format?: 'csv' | 'json' | 'xlsx'
    fields?: string[]
  }
}

export interface CampaignMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  converted: number
  bounced: number
  unsubscribed: number
  revenue: number
  openRate: number
  clickRate: number
  conversionRate: number
  roi: number
}

export class CampaignService {
  /**
   * Create a new campaign
   */
  async createCampaign(organizationId: string, config: CampaignConfig): Promise<string> {
    const campaign = await prisma.campaign.create({
      data: {
        organizationId,
        segmentId: config.segmentId,
        name: config.name,
        type: config.type,
        status: CampaignStatus.DRAFT,
        settings: config.settings,
        scheduledAt: config.settings.scheduledAt
      }
    })

    return campaign.id
  }

  /**
   * Launch a campaign
   */
  async launchCampaign(campaignId: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        segment: {
          include: {
            memberships: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Update campaign status
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.RUNNING,
        sentAt: new Date()
      }
    })

    // Execute campaign based on type
    switch (campaign.type) {
      case CampaignType.EMAIL:
        await this.executeEmailCampaign(campaign)
        break
      case CampaignType.SMS:
        await this.executeSMSCampaign(campaign)
        break
      case CampaignType.PUSH:
        await this.executePushCampaign(campaign)
        break
      case CampaignType.WEBHOOK:
        await this.executeWebhookCampaign(campaign)
        break
      case CampaignType.EXPORT:
        await this.executeExportCampaign(campaign)
        break
    }

    // Update campaign status to completed
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.COMPLETED
      }
    })
  }

  /**
   * Execute email campaign
   */
  private async executeEmailCampaign(campaign: any): Promise<void> {
    const customers = campaign.segment?.memberships.map((m: any) => m.customer) || []
    const settings = campaign.settings as any

    let sent = 0
    let delivered = 0
    let bounced = 0

    for (const customer of customers) {
      if (!customer.email) continue

      try {
        // In production, integrate with email service (SendGrid, Mailchimp, etc.)
        const emailResult = await this.sendEmail({
          to: customer.email,
          from: `${settings.fromName} <${settings.fromEmail}>`,
          replyTo: settings.replyTo,
          subject: this.personalizeContent(settings.subject, customer),
          content: this.personalizeContent(settings.content, customer),
          template: settings.template,
          trackingId: `${campaign.id}_${customer.id}`
        })

        if (emailResult.success) {
          sent++
          delivered++

          // Create event for tracking
          await prisma.event.create({
            data: {
              organizationId: campaign.organizationId,
              customerId: customer.id,
              eventType: 'email_sent',
              properties: {
                campaignId: campaign.id,
                campaignName: campaign.name,
                subject: settings.subject,
                messageId: emailResult.messageId
              },
              timestamp: new Date(),
              source: 'campaign'
            }
          })
        } else {
          bounced++
        }
      } catch (error) {
        console.error(`Failed to send email to ${customer.email}:`, error)
        bounced++
      }
    }

    // Update campaign metrics
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        sentCount: sent,
        // These would be updated via webhooks from email service
        // openCount: 0,
        // clickCount: 0,
        // conversionCount: 0
      }
    })
  }

  /**
   * Execute SMS campaign
   */
  private async executeSMSCampaign(campaign: any): Promise<void> {
    const customers = campaign.segment?.memberships.map((m: any) => m.customer) || []
    const settings = campaign.settings as any

    let sent = 0

    for (const customer of customers) {
      if (!customer.phone) continue

      try {
        // In production, integrate with SMS service (Twilio, etc.)
        const smsResult = await this.sendSMS({
          to: customer.phone,
          message: this.personalizeContent(settings.smsContent, customer),
          trackingId: `${campaign.id}_${customer.id}`
        })

        if (smsResult.success) {
          sent++

          await prisma.event.create({
            data: {
              organizationId: campaign.organizationId,
              customerId: customer.id,
              eventType: 'sms_sent',
              properties: {
                campaignId: campaign.id,
                campaignName: campaign.name,
                messageId: smsResult.messageId
              },
              timestamp: new Date(),
              source: 'campaign'
            }
          })
        }
      } catch (error) {
        console.error(`Failed to send SMS to ${customer.phone}:`, error)
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: sent }
    })
  }

  /**
   * Execute push notification campaign
   */
  private async executePushCampaign(campaign: any): Promise<void> {
    const customers = campaign.segment?.memberships.map((m: any) => m.customer) || []
    const settings = campaign.settings as any

    let sent = 0

    for (const customer of customers) {
      // Get push tokens from customer attributes
      const pushTokens = (customer.attributes as any)?.pushTokens || []

      for (const token of pushTokens) {
        try {
          const pushResult = await this.sendPushNotification({
            token,
            title: settings.title,
            body: this.personalizeContent(settings.content, customer),
            data: {
              campaignId: campaign.id,
              customerId: customer.id
            }
          })

          if (pushResult.success) {
            sent++

            await prisma.event.create({
              data: {
                organizationId: campaign.organizationId,
                customerId: customer.id,
                eventType: 'push_sent',
                properties: {
                  campaignId: campaign.id,
                  campaignName: campaign.name,
                  title: settings.title
                },
                timestamp: new Date(),
                source: 'campaign'
              }
            })
          }
        } catch (error) {
          console.error(`Failed to send push notification:`, error)
        }
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: sent }
    })
  }

  /**
   * Execute webhook campaign
   */
  private async executeWebhookCampaign(campaign: any): Promise<void> {
    const customers = campaign.segment?.memberships.map((m: any) => m.customer) || []
    const settings = campaign.settings as any

    let sent = 0

    for (const customer of customers) {
      try {
        const webhookResult = await this.sendWebhook({
          url: settings.webhookUrl,
          method: settings.webhookMethod || 'POST',
          headers: settings.webhookHeaders || {},
          data: {
            campaignId: campaign.id,
            campaignName: campaign.name,
            customer: {
              id: customer.id,
              email: customer.email,
              firstName: customer.firstName,
              lastName: customer.lastName,
              attributes: customer.attributes
            },
            timestamp: new Date().toISOString()
          }
        })

        if (webhookResult.success) {
          sent++

          await prisma.event.create({
            data: {
              organizationId: campaign.organizationId,
              customerId: customer.id,
              eventType: 'webhook_sent',
              properties: {
                campaignId: campaign.id,
                webhookUrl: settings.webhookUrl,
                response: webhookResult.response
              },
              timestamp: new Date(),
              source: 'campaign'
            }
          })
        }
      } catch (error) {
        console.error(`Failed to send webhook for customer ${customer.id}:`, error)
      }
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: sent }
    })
  }

  /**
   * Execute export campaign
   */
  private async executeExportCampaign(campaign: any): Promise<void> {
    const customers = campaign.segment?.memberships.map((m: any) => m.customer) || []
    const settings = campaign.settings as any

    const exportData = customers.map(customer => {
      const data: any = {}
      
      if (settings.fields) {
        for (const field of settings.fields) {
          data[field] = customer[field]
        }
      } else {
        // Export all non-sensitive fields
        data.id = customer.id
        data.email = customer.email
        data.firstName = customer.firstName
        data.lastName = customer.lastName
        data.totalSpent = customer.totalSpent
        data.orderCount = customer.orderCount
        data.lastOrderAt = customer.lastOrderAt
      }

      return data
    })

    // Generate export file
    let exportContent: string
    switch (settings.format) {
      case 'json':
        exportContent = JSON.stringify(exportData, null, 2)
        break
      case 'csv':
        exportContent = this.convertToCSV(exportData)
        break
      default:
        exportContent = this.convertToCSV(exportData)
    }

    // In production, save to S3 or similar and send download link
    console.log(`Export generated for campaign ${campaign.id}:`, exportContent.length, 'characters')

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { 
        sentCount: exportData.length,
        // Store export metadata in settings
        settings: {
          ...settings,
          exportGenerated: true,
          exportSize: exportData.length,
          exportGeneratedAt: new Date()
        }
      }
    })
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      throw new Error('Campaign not found')
    }

    // Calculate derived metrics
    const openRate = campaign.sentCount > 0 ? campaign.openCount / campaign.sentCount : 0
    const clickRate = campaign.openCount > 0 ? campaign.clickCount / campaign.openCount : 0
    const conversionRate = campaign.sentCount > 0 ? campaign.conversionCount / campaign.sentCount : 0
    const roi = campaign.revenue > 0 && campaign.sentCount > 0 
      ? (campaign.revenue / (campaign.sentCount * 0.05)) - 1 // Assuming $0.05 cost per send
      : 0

    return {
      sent: campaign.sentCount,
      delivered: campaign.sentCount, // Would be updated from delivery webhooks
      opened: campaign.openCount,
      clicked: campaign.clickCount,
      converted: campaign.conversionCount,
      bounced: 0, // Would be tracked separately
      unsubscribed: 0, // Would be tracked separately
      revenue: campaign.revenue,
      openRate,
      clickRate,
      conversionRate,
      roi
    }
  }

  /**
   * Track email open
   */
  async trackEmailOpen(campaignId: string, customerId: string, userAgent?: string): Promise<void> {
    // Check if already opened to avoid double counting
    const existingEvent = await prisma.event.findFirst({
      where: {
        eventType: 'email_opened',
        customerId,
        properties: {
          path: ['campaignId'],
          equals: campaignId
        }
      }
    })

    if (!existingEvent) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId }
      })

      if (campaign) {
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            openCount: { increment: 1 }
          }
        })

        await prisma.event.create({
          data: {
            organizationId: campaign.organizationId,
            customerId,
            eventType: 'email_opened',
            properties: {
              campaignId,
              userAgent
            },
            timestamp: new Date(),
            source: 'campaign'
          }
        })
      }
    }
  }

  /**
   * Track email click
   */
  async trackEmailClick(campaignId: string, customerId: string, url: string): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (campaign) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          clickCount: { increment: 1 }
        }
      })

      await prisma.event.create({
        data: {
          organizationId: campaign.organizationId,
          customerId,
          eventType: 'email_clicked',
          properties: {
            campaignId,
            url
          },
          timestamp: new Date(),
          source: 'campaign'
        }
      })
    }
  }

  /**
   * Track conversion
   */
  async trackConversion(campaignId: string, customerId: string, value: number): Promise<void> {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (campaign) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          conversionCount: { increment: 1 },
          revenue: { increment: value }
        }
      })

      await prisma.event.create({
        data: {
          organizationId: campaign.organizationId,
          customerId,
          eventType: 'campaign_conversion',
          properties: {
            campaignId
          },
          value,
          timestamp: new Date(),
          source: 'campaign'
        }
      })
    }
  }

  /**
   * A/B test campaigns
   */
  async createABTest(
    organizationId: string,
    segmentId: string,
    variantA: CampaignConfig,
    variantB: CampaignConfig,
    splitRatio: number = 0.5
  ): Promise<{ campaignAId: string; campaignBId: string }> {
    // Get segment customers
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      include: {
        memberships: {
          include: { customer: true }
        }
      }
    })

    if (!segment) {
      throw new Error('Segment not found')
    }

    const customers = segment.memberships.map(m => m.customer)
    const shuffled = customers.sort(() => 0.5 - Math.random())
    const splitIndex = Math.floor(shuffled.length * splitRatio)

    const groupA = shuffled.slice(0, splitIndex)
    const groupB = shuffled.slice(splitIndex)

    // Create segments for each group
    const segmentA = await prisma.segment.create({
      data: {
        organizationId,
        name: `${segment.name} - Variant A`,
        type: 'MANUAL',
        description: `A/B test group A for ${segment.name}`
      }
    })

    const segmentB = await prisma.segment.create({
      data: {
        organizationId,
        name: `${segment.name} - Variant B`,
        type: 'MANUAL',
        description: `A/B test group B for ${segment.name}`
      }
    })

    // Add customers to segments
    await Promise.all([
      ...groupA.map(customer =>
        prisma.segmentMembership.create({
          data: {
            customerId: customer.id,
            segmentId: segmentA.id
          }
        })
      ),
      ...groupB.map(customer =>
        prisma.segmentMembership.create({
          data: {
            customerId: customer.id,
            segmentId: segmentB.id
          }
        })
      )
    ])

    // Create campaigns
    const campaignAId = await this.createCampaign(organizationId, {
      ...variantA,
      name: `${variantA.name} - Variant A`,
      segmentId: segmentA.id
    })

    const campaignBId = await this.createCampaign(organizationId, {
      ...variantB,
      name: `${variantB.name} - Variant B`,
      segmentId: segmentB.id
    })

    return { campaignAId, campaignBId }
  }

  // Helper methods

  private personalizeContent(content: string, customer: any): string {
    return content
      .replace(/\{\{firstName\}\}/g, customer.firstName || '')
      .replace(/\{\{lastName\}\}/g, customer.lastName || '')
      .replace(/\{\{email\}\}/g, customer.email || '')
      .replace(/\{\{totalSpent\}\}/g, customer.totalSpent?.toFixed(2) || '0')
      .replace(/\{\{orderCount\}\}/g, customer.orderCount?.toString() || '0')
  }

  private async sendEmail(config: any): Promise<{ success: boolean; messageId?: string }> {
    // Mock email sending - integrate with actual service
    console.log('Sending email:', config)
    return {
      success: Math.random() > 0.05, // 95% delivery rate
      messageId: Math.random().toString(36)
    }
  }

  private async sendSMS(config: any): Promise<{ success: boolean; messageId?: string }> {
    // Mock SMS sending - integrate with actual service
    console.log('Sending SMS:', config)
    return {
      success: Math.random() > 0.02, // 98% delivery rate
      messageId: Math.random().toString(36)
    }
  }

  private async sendPushNotification(config: any): Promise<{ success: boolean }> {
    // Mock push notification - integrate with actual service
    console.log('Sending push notification:', config)
    return {
      success: Math.random() > 0.1 // 90% delivery rate
    }
  }

  private async sendWebhook(config: any): Promise<{ success: boolean; response?: any }> {
    // Mock webhook - make actual HTTP request
    console.log('Sending webhook:', config)
    return {
      success: Math.random() > 0.05, // 95% success rate
      response: { status: 'received' }
    }
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    return csvContent
  }
}