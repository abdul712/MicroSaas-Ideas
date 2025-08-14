import { prisma } from './prisma'
import { z } from 'zod'

// GDPR compliance utilities

export interface DataExportOptions {
  userId?: string
  customerId?: string
  email?: string
  includeAnalytics?: boolean
  includeFeedback?: boolean
  includePersonalData?: boolean
}

export interface DataDeletionOptions {
  userId?: string
  customerId?: string
  email?: string
  anonymize?: boolean // Instead of hard delete
  retainAnalytics?: boolean // For business insights
}

// Data export for GDPR Article 15 (Right of Access)
export async function exportUserData(options: DataExportOptions) {
  try {
    const data: any = {
      exportedAt: new Date().toISOString(),
      requestType: 'GDPR_DATA_EXPORT',
    }

    // User data
    if (options.userId) {
      const user = await prisma.user.findUnique({
        where: { id: options.userId },
        include: {
          organizations: {
            include: {
              organization: true,
            },
          },
          sessions: true,
          apiKeys: true,
        },
      })

      if (user) {
        data.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          organizations: user.organizations.map(om => ({
            role: om.role,
            joinedAt: om.joinedAt,
            organization: {
              name: om.organization.name,
              slug: om.organization.slug,
            },
          })),
          sessions: user.sessions.map(s => ({
            createdAt: s.createdAt,
            expiresAt: s.expiresAt,
          })),
          apiKeys: user.apiKeys.map(ak => ({
            name: ak.name,
            createdAt: ak.createdAt,
            lastUsed: ak.lastUsed,
            scopes: ak.scopes,
          })),
        }
      }
    }

    // Customer data
    if (options.email) {
      const customer = await prisma.customer.findFirst({
        where: { email: options.email },
        include: {
          feedback: options.includeFeedback ? {
            include: {
              project: {
                select: {
                  name: true,
                  slug: true,
                },
              },
              analysis: options.includeAnalytics,
            },
          } : false,
        },
      })

      if (customer) {
        data.customer = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          metadata: customer.metadata,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
        }

        if (options.includeFeedback && customer.feedback) {
          data.feedback = customer.feedback.map(f => ({
            id: f.id,
            type: f.type,
            content: f.content,
            rating: f.rating,
            sentiment: f.sentiment,
            category: f.category,
            tags: f.tags,
            source: f.source,
            createdAt: f.createdAt,
            project: f.project ? {
              name: f.project.name,
              slug: f.project.slug,
            } : null,
            analysis: options.includeAnalytics ? f.analysis : undefined,
          }))
        }
      }
    }

    return data
  } catch (error) {
    console.error('Data export error:', error)
    throw new Error('Failed to export user data')
  }
}

// Data deletion for GDPR Article 17 (Right to Erasure)
export async function deleteUserData(options: DataDeletionOptions) {
  try {
    const deletionLog = {
      deletedAt: new Date().toISOString(),
      requestType: 'GDPR_DATA_DELETION',
      options,
      results: {} as any,
    }

    await prisma.$transaction(async (tx) => {
      // Delete/anonymize user data
      if (options.userId) {
        if (options.anonymize) {
          // Anonymize user data instead of deleting
          await tx.user.update({
            where: { id: options.userId },
            data: {
              email: `deleted_${Date.now()}@anonymized.local`,
              name: 'Deleted User',
              password: 'DELETED',
            },
          })
          deletionLog.results.user = 'anonymized'
        } else {
          // Hard delete user and cascade
          await tx.user.delete({
            where: { id: options.userId },
          })
          deletionLog.results.user = 'deleted'
        }
      }

      // Delete/anonymize customer data
      if (options.email || options.customerId) {
        const where = options.customerId 
          ? { id: options.customerId }
          : { email: options.email }

        if (options.anonymize) {
          await tx.customer.updateMany({
            where,
            data: {
              email: null,
              name: 'Anonymous Customer',
              phone: null,
              metadata: {},
            },
          })

          // Anonymize related feedback content if not retaining analytics
          if (!options.retainAnalytics) {
            await tx.feedback.updateMany({
              where: { 
                customer: where,
              },
              data: {
                content: '[Content removed for privacy]',
                metadata: {},
              },
            })
          }

          deletionLog.results.customer = 'anonymized'
        } else {
          // Find feedback to delete analysis if needed
          const feedbackIds = await tx.feedback.findMany({
            where: { customer: where },
            select: { id: true },
          })

          // Delete feedback analysis
          if (!options.retainAnalytics) {
            await tx.feedbackAnalysis.deleteMany({
              where: {
                feedbackId: {
                  in: feedbackIds.map(f => f.id),
                },
              },
            })
          }

          // Delete customer (will cascade to feedback if configured)
          await tx.customer.deleteMany({ where })
          deletionLog.results.customer = 'deleted'
        }
      }
    })

    // Log the deletion for audit purposes
    await prisma.gdprLog.create({
      data: {
        type: 'DATA_DELETION',
        requestData: options,
        resultData: deletionLog,
        processedAt: new Date(),
      },
    }).catch(() => {
      // If GDPR log table doesn't exist, log to console
      console.log('GDPR Deletion Log:', deletionLog)
    })

    return deletionLog
  } catch (error) {
    console.error('Data deletion error:', error)
    throw new Error('Failed to delete user data')
  }
}

// Data portability for GDPR Article 20
export async function exportDataForPortability(options: DataExportOptions) {
  const data = await exportUserData({
    ...options,
    includeFeedback: true,
    includeAnalytics: false, // Don't include AI analysis for portability
    includePersonalData: true,
  })

  // Format data for portability (structured, machine-readable)
  return {
    format: 'JSON',
    version: '1.0',
    standard: 'GDPR_Article_20',
    data,
  }
}

// Consent management
export async function updateConsentPreferences(
  customerId: string, 
  preferences: {
    analytics?: boolean
    marketing?: boolean
    essential?: boolean
    dataProcessing?: boolean
    dataSharing?: boolean
  }
) {
  try {
    const consent = await prisma.customerConsent.upsert({
      where: { customerId },
      update: {
        ...preferences,
        updatedAt: new Date(),
      },
      create: {
        customerId,
        ...preferences,
        essential: true, // Essential cookies always true
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }).catch(() => {
      // If consent table doesn't exist, store in customer metadata
      return prisma.customer.update({
        where: { id: customerId },
        data: {
          metadata: {
            consent: {
              ...preferences,
              updatedAt: new Date().toISOString(),
            },
          },
        },
      })
    })

    return consent
  } catch (error) {
    console.error('Consent update error:', error)
    throw new Error('Failed to update consent preferences')
  }
}

// Data retention policy enforcement
export async function enforceDataRetention() {
  try {
    const retentionPeriods = {
      feedback: 2 * 365, // 2 years
      analytics: 3 * 365, // 3 years
      sessions: 30, // 30 days
      logs: 365, // 1 year
    }

    const now = new Date()
    
    // Delete old feedback based on organization settings
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        settings: true,
      },
    })

    for (const org of organizations) {
      const retention = org.settings?.dataRetention || retentionPeriods.feedback
      const cutoffDate = new Date(now.getTime() - retention * 24 * 60 * 60 * 1000)

      await prisma.feedback.deleteMany({
        where: {
          project: {
            orgId: org.id,
          },
          createdAt: {
            lt: cutoffDate,
          },
        },
      })
    }

    // Delete old sessions
    const sessionCutoff = new Date(now.getTime() - retentionPeriods.sessions * 24 * 60 * 60 * 1000)
    await prisma.session.deleteMany({
      where: {
        createdAt: {
          lt: sessionCutoff,
        },
      },
    })

    console.log('Data retention policy enforced successfully')
  } catch (error) {
    console.error('Data retention enforcement error:', error)
    throw error
  }
}

// Validate GDPR request
const gdprRequestSchema = z.object({
  type: z.enum(['EXPORT', 'DELETE', 'PORTABILITY', 'CONSENT']),
  email: z.string().email().optional(),
  userId: z.string().optional(),
  customerId: z.string().optional(),
  verification: z.object({
    method: z.enum(['EMAIL', 'PHONE', 'MANUAL']),
    token: z.string().optional(),
    verified: z.boolean(),
  }),
})

export function validateGDPRRequest(data: any) {
  return gdprRequestSchema.parse(data)
}