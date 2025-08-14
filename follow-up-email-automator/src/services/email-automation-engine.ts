import Bull from 'bull'
import { prisma } from '@/lib/prisma'
import { emailService } from './email-service'
import { aiEmailGenerator } from './ai-email-generator'
import { parseEmailVariables } from '@/lib/utils'

interface EmailJobData {
  contactId: string
  templateId: string
  sequenceId?: string
  stepId?: string
  campaignId?: string
  variables?: Record<string, any>
  scheduledAt?: Date
  priority?: 'high' | 'normal' | 'low'
}

interface SequenceJobData {
  sequenceId: string
  contactIds: string[]
  startFromStep?: number
}

interface ABTestJobData {
  campaignId: string
  testId: string
  contactIds: string[]
}

class EmailAutomationEngine {
  private emailQueue: Bull.Queue<EmailJobData>
  private sequenceQueue: Bull.Queue<SequenceJobData>
  private abTestQueue: Bull.Queue<ABTestJobData>
  private optimizationQueue: Bull.Queue

  constructor() {
    // Initialize queues with Redis connection
    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    }

    this.emailQueue = new Bull('email-queue', { redis: redisConfig })
    this.sequenceQueue = new Bull('sequence-queue', { redis: redisConfig })
    this.abTestQueue = new Bull('ab-test-queue', { redis: redisConfig })
    this.optimizationQueue = new Bull('optimization-queue', { redis: redisConfig })

    this.setupQueueProcessors()
    this.setupQueueEvents()
  }

  private setupQueueProcessors() {
    // Email sending processor
    this.emailQueue.process('send-email', 10, async (job) => {
      const { contactId, templateId, variables, sequenceId, stepId, campaignId } = job.data
      
      try {
        // Get contact and template data
        const [contact, template] = await Promise.all([
          prisma.contact.findUnique({ where: { id: contactId } }),
          prisma.emailTemplate.findUnique({ where: { id: templateId } })
        ])

        if (!contact || !template) {
          throw new Error('Contact or template not found')
        }

        // Create email send record
        const emailSend = await prisma.emailSend.create({
          data: {
            contactId,
            templateId,
            sequenceId,
            stepId,
            campaignId,
            subject: parseEmailVariables(template.subject, { 
              firstName: contact.firstName,
              lastName: contact.lastName,
              company: contact.company,
              ...variables 
            }),
            status: 'QUEUED',
            metadata: variables,
          }
        })

        // Parse email content with variables
        const personalizedContent = {
          subject: parseEmailVariables(template.subject, {
            firstName: contact.firstName,
            lastName: contact.lastName,
            company: contact.company,
            ...variables
          }),
          htmlContent: parseEmailVariables(template.htmlContent, {
            firstName: contact.firstName,
            lastName: contact.lastName,
            company: contact.company,
            ...variables
          }),
          textContent: template.textContent ? parseEmailVariables(template.textContent, {
            firstName: contact.firstName,
            lastName: contact.lastName,
            company: contact.company,
            ...variables
          }) : undefined,
        }

        // Send email through service
        const result = await emailService.sendEmail({
          to: contact.email,
          subject: personalizedContent.subject,
          html: personalizedContent.htmlContent,
          text: personalizedContent.textContent,
          trackingId: emailSend.id,
        })

        // Update send record with result
        await prisma.emailSend.update({
          where: { id: emailSend.id },
          data: {
            status: result.success ? 'SENT' : 'FAILED',
            sentAt: result.success ? new Date() : null,
            errorMessage: result.error,
          }
        })

        // Log email event
        await prisma.emailEvent.create({
          data: {
            sendId: emailSend.id,
            type: result.success ? 'SENT' : 'FAILED',
            data: { messageId: result.messageId, error: result.error },
          }
        })

        return { success: true, emailSendId: emailSend.id }

      } catch (error) {
        console.error('Email sending error:', error)
        throw error
      }
    })

    // Sequence processor
    this.sequenceQueue.process('execute-sequence', 5, async (job) => {
      const { sequenceId, contactIds, startFromStep = 0 } = job.data

      try {
        const sequence = await prisma.emailSequence.findUnique({
          where: { id: sequenceId },
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
              include: { template: true }
            }
          }
        })

        if (!sequence) {
          throw new Error('Sequence not found')
        }

        for (const contactId of contactIds) {
          // Check if contact is already enrolled
          let enrollment = await prisma.sequenceEnrollment.findUnique({
            where: {
              sequenceId_contactId: {
                sequenceId,
                contactId
              }
            }
          })

          // Create enrollment if not exists
          if (!enrollment) {
            enrollment = await prisma.sequenceEnrollment.create({
              data: {
                sequenceId,
                contactId,
                currentStep: startFromStep,
                status: 'ACTIVE',
              }
            })
          }

          // Schedule the first step
          if (sequence.steps.length > startFromStep) {
            const firstStep = sequence.steps[startFromStep]
            const delay = (firstStep.delayDays * 24 * 60 * 60 * 1000) + 
                         (firstStep.delayHours * 60 * 60 * 1000)

            await this.emailQueue.add('send-email', {
              contactId,
              templateId: firstStep.templateId,
              sequenceId,
              stepId: firstStep.id,
            }, {
              delay,
              attempts: 3,
            })
          }
        }

        return { success: true, enrolledContacts: contactIds.length }

      } catch (error) {
        console.error('Sequence execution error:', error)
        throw error
      }
    })

    // A/B test processor
    this.abTestQueue.process('execute-ab-test', 3, async (job) => {
      const { campaignId, testId, contactIds } = job.data

      try {
        const abTest = await prisma.aBTest.findUnique({
          where: { id: testId },
          include: {
            variants: {
              include: { template: true }
            }
          }
        })

        if (!abTest) {
          throw new Error('A/B test not found')
        }

        // Distribute contacts across variants
        const contactsPerVariant = Math.floor(contactIds.length / abTest.variants.length)
        let contactIndex = 0

        for (const variant of abTest.variants) {
          const variantContacts = contactIds.slice(
            contactIndex,
            contactIndex + contactsPerVariant
          )

          for (const contactId of variantContacts) {
            await this.emailQueue.add('send-email', {
              contactId,
              templateId: variant.templateId,
              campaignId,
            }, {
              attempts: 3,
            })
          }

          contactIndex += contactsPerVariant
        }

        return { success: true, testedContacts: contactIds.length }

      } catch (error) {
        console.error('A/B test execution error:', error)
        throw error
      }
    })

    // Optimization processor
    this.optimizationQueue.process('optimize-send-times', async (job) => {
      try {
        // Get contacts that need send time optimization
        const contacts = await prisma.contact.findMany({
          include: {
            emailSends: {
              where: {
                openedAt: { not: null }
              },
              select: {
                sentAt: true,
                openedAt: true
              }
            }
          }
        })

        // Analyze optimal send times for each contact
        for (const contact of contacts) {
          if (contact.emailSends.length < 3) continue // Need minimum data

          const optimalHour = this.calculateOptimalSendTime(contact.emailSends)
          
          // Store optimal send time in custom fields
          await prisma.contact.update({
            where: { id: contact.id },
            data: {
              customFields: {
                ...contact.customFields,
                optimalSendHour: optimalHour
              }
            }
          })
        }

        return { success: true, optimizedContacts: contacts.length }

      } catch (error) {
        console.error('Send time optimization error:', error)
        throw error
      }
    })
  }

  private setupQueueEvents() {
    // Email queue events
    this.emailQueue.on('completed', async (job, result) => {
      console.log(`Email job ${job.id} completed:`, result)
      
      // Check if this was part of a sequence
      if (job.data.sequenceId && job.data.stepId) {
        await this.scheduleNextSequenceStep(
          job.data.sequenceId,
          job.data.contactId,
          job.data.stepId
        )
      }
    })

    this.emailQueue.on('failed', async (job, err) => {
      console.error(`Email job ${job.id} failed:`, err)
      
      // Update contact interaction
      await prisma.contactInteraction.create({
        data: {
          contactId: job.data.contactId,
          type: 'EMAIL_FAILED',
          metadata: { error: err.message, jobId: job.id }
        }
      })
    })

    // Sequence queue events
    this.sequenceQueue.on('completed', (job, result) => {
      console.log(`Sequence job ${job.id} completed:`, result)
    })

    this.sequenceQueue.on('failed', (job, err) => {
      console.error(`Sequence job ${job.id} failed:`, err)
    })
  }

  // Public methods
  async scheduleEmail(data: EmailJobData): Promise<Bull.Job<EmailJobData>> {
    const delay = data.scheduledAt ? 
      Math.max(0, data.scheduledAt.getTime() - Date.now()) : 0

    const priority = data.priority === 'high' ? 1 : 
                    data.priority === 'low' ? 3 : 2

    return this.emailQueue.add('send-email', data, {
      delay,
      priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      }
    })
  }

  async startSequence(sequenceId: string, contactIds: string[]): Promise<Bull.Job<SequenceJobData>> {
    return this.sequenceQueue.add('execute-sequence', {
      sequenceId,
      contactIds
    }, {
      attempts: 2,
    })
  }

  async executeABTest(campaignId: string, testId: string, contactIds: string[]): Promise<Bull.Job<ABTestJobData>> {
    return this.abTestQueue.add('execute-ab-test', {
      campaignId,
      testId,
      contactIds
    }, {
      attempts: 2,
    })
  }

  async pauseSequence(sequenceId: string, contactId?: string): Promise<void> {
    if (contactId) {
      await prisma.sequenceEnrollment.updateMany({
        where: { sequenceId, contactId },
        data: { status: 'PAUSED', pausedAt: new Date() }
      })
    } else {
      await prisma.sequenceEnrollment.updateMany({
        where: { sequenceId },
        data: { status: 'PAUSED', pausedAt: new Date() }
      })
    }
  }

  async resumeSequence(sequenceId: string, contactId?: string): Promise<void> {
    if (contactId) {
      await prisma.sequenceEnrollment.updateMany({
        where: { sequenceId, contactId, status: 'PAUSED' },
        data: { status: 'ACTIVE', pausedAt: null }
      })
    } else {
      await prisma.sequenceEnrollment.updateMany({
        where: { sequenceId, status: 'PAUSED' },
        data: { status: 'ACTIVE', pausedAt: null }
      })
    }
  }

  async getQueueStats() {
    const [emailWaiting, emailActive, emailCompleted, emailFailed] = await Promise.all([
      this.emailQueue.getWaiting(),
      this.emailQueue.getActive(),
      this.emailQueue.getCompleted(),
      this.emailQueue.getFailed(),
    ])

    return {
      email: {
        waiting: emailWaiting.length,
        active: emailActive.length,
        completed: emailCompleted.length,
        failed: emailFailed.length,
      }
    }
  }

  private async scheduleNextSequenceStep(sequenceId: string, contactId: string, currentStepId: string) {
    try {
      const sequence = await prisma.emailSequence.findUnique({
        where: { id: sequenceId },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' }
          }
        }
      })

      if (!sequence) return

      const currentStepIndex = sequence.steps.findIndex(step => step.id === currentStepId)
      const nextStep = sequence.steps[currentStepIndex + 1]

      if (!nextStep) {
        // Mark enrollment as completed
        await prisma.sequenceEnrollment.update({
          where: {
            sequenceId_contactId: {
              sequenceId,
              contactId
            }
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
        return
      }

      // Update current step in enrollment
      await prisma.sequenceEnrollment.update({
        where: {
          sequenceId_contactId: {
            sequenceId,
            contactId
          }
        },
        data: { currentStep: nextStep.stepOrder }
      })

      // Schedule next step
      const delay = (nextStep.delayDays * 24 * 60 * 60 * 1000) + 
                   (nextStep.delayHours * 60 * 60 * 1000)

      await this.emailQueue.add('send-email', {
        contactId,
        templateId: nextStep.templateId,
        sequenceId,
        stepId: nextStep.id,
      }, {
        delay,
        attempts: 3,
      })

    } catch (error) {
      console.error('Error scheduling next sequence step:', error)
    }
  }

  private calculateOptimalSendTime(emailSends: any[]): number {
    // Analyze send times and open times to find optimal hour
    const hourStats: Record<number, { sends: number; opens: number }> = {}

    emailSends.forEach(send => {
      if (send.sentAt && send.openedAt) {
        const sentHour = new Date(send.sentAt).getHours()
        
        if (!hourStats[sentHour]) {
          hourStats[sentHour] = { sends: 0, opens: 0 }
        }
        
        hourStats[sentHour].sends++
        hourStats[sentHour].opens++
      }
    })

    // Find hour with highest open rate
    let bestHour = 9 // Default to 9 AM
    let bestOpenRate = 0

    Object.entries(hourStats).forEach(([hour, stats]) => {
      const openRate = stats.opens / stats.sends
      if (openRate > bestOpenRate && stats.sends >= 2) {
        bestOpenRate = openRate
        bestHour = parseInt(hour)
      }
    })

    return bestHour
  }

  async optimizeSendTimes(): Promise<void> {
    await this.optimizationQueue.add('optimize-send-times', {}, {
      repeat: { cron: '0 2 * * *' } // Run daily at 2 AM
    })
  }

  async cleanupOldJobs(): Promise<void> {
    // Clean up completed jobs older than 7 days
    await this.emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed')
    await this.emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'failed')
  }
}

export const emailAutomationEngine = new EmailAutomationEngine()