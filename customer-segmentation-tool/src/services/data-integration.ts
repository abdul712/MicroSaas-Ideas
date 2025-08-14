import { prisma } from '@/lib/prisma';
import { 
  Customer, 
  BehaviorEvent, 
  Integration, 
  IntegrationCategory,
  IntegrationProvider 
} from '@/types';

export class DataIntegrationService {
  /**
   * Available integration providers
   */
  static readonly PROVIDERS: IntegrationProvider[] = [
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Import customer and order data from your Shopify store',
      logoUrl: '/integrations/shopify.svg',
      category: IntegrationCategory.ECOMMERCE,
      features: ['Customer profiles', 'Order history', 'Product data', 'Real-time webhooks'],
      setupUrl: '/integrations/shopify/setup',
      documentationUrl: 'https://docs.shopify.com/api',
      isPopular: true,
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Sync payment and subscription data from Stripe',
      logoUrl: '/integrations/stripe.svg',
      category: IntegrationCategory.PAYMENT,
      features: ['Payment data', 'Subscription events', 'Customer billing', 'Revenue metrics'],
      setupUrl: '/integrations/stripe/setup',
      documentationUrl: 'https://stripe.com/docs/api',
      isPopular: true,
    },
    {
      id: 'mailchimp',
      name: 'Mailchimp',
      description: 'Import email marketing data and subscriber information',
      logoUrl: '/integrations/mailchimp.svg',
      category: IntegrationCategory.EMAIL_MARKETING,
      features: ['Email campaigns', 'Subscriber data', 'Engagement metrics', 'List management'],
      setupUrl: '/integrations/mailchimp/setup',
      documentationUrl: 'https://mailchimp.com/developer/',
      isPopular: true,
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Connect your HubSpot CRM and marketing data',
      logoUrl: '/integrations/hubspot.svg',
      category: IntegrationCategory.CRM,
      features: ['Contact management', 'Deal tracking', 'Marketing automation', 'Sales pipeline'],
      setupUrl: '/integrations/hubspot/setup',
      documentationUrl: 'https://developers.hubspot.com/',
      isPopular: true,
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Import leads, contacts, and opportunity data',
      logoUrl: '/integrations/salesforce.svg',
      category: IntegrationCategory.CRM,
      features: ['Lead management', 'Opportunity tracking', 'Account data', 'Custom objects'],
      setupUrl: '/integrations/salesforce/setup',
      documentationUrl: 'https://developer.salesforce.com/',
      isPopular: false,
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Import website behavior and conversion data',
      logoUrl: '/integrations/google-analytics.svg',
      category: IntegrationCategory.ANALYTICS,
      features: ['Website traffic', 'User behavior', 'Conversion tracking', 'E-commerce data'],
      setupUrl: '/integrations/google-analytics/setup',
      documentationUrl: 'https://developers.google.com/analytics',
      isPopular: true,
    },
    {
      id: 'klaviyo',
      name: 'Klaviyo',
      description: 'Sync email marketing and customer behavior data',
      logoUrl: '/integrations/klaviyo.svg',
      category: IntegrationCategory.EMAIL_MARKETING,
      features: ['Email automation', 'SMS campaigns', 'Behavioral tracking', 'Segmentation'],
      setupUrl: '/integrations/klaviyo/setup',
      documentationUrl: 'https://developers.klaviyo.com/',
      isPopular: false,
    },
    {
      id: 'zendesk',
      name: 'Zendesk',
      description: 'Import customer support and ticket data',
      logoUrl: '/integrations/zendesk.svg',
      category: IntegrationCategory.SUPPORT,
      features: ['Support tickets', 'Customer satisfaction', 'Agent performance', 'Knowledge base'],
      setupUrl: '/integrations/zendesk/setup',
      documentationUrl: 'https://developer.zendesk.com/',
      isPopular: false,
    },
  ];

  /**
   * Get available integration providers
   */
  static getProviders(category?: IntegrationCategory): IntegrationProvider[] {
    if (category) {
      return this.PROVIDERS.filter(provider => provider.category === category);
    }
    return this.PROVIDERS;
  }

  /**
   * Get a specific provider by ID
   */
  static getProvider(id: string): IntegrationProvider | undefined {
    return this.PROVIDERS.find(provider => provider.id === id);
  }

  /**
   * Create a new integration
   */
  async createIntegration(data: {
    tenantId: string;
    provider: string;
    name: string;
    config: Record<string, any>;
  }) {
    const provider = DataIntegrationService.getProvider(data.provider);
    if (!provider) {
      throw new Error(`Unknown provider: ${data.provider}`);
    }

    const integration = await prisma.integration.create({
      data: {
        tenantId: data.tenantId,
        provider: data.provider,
        name: data.name,
        config: data.config,
        isActive: true,
        syncStatus: 'pending',
      },
    });

    // Start initial sync
    await this.syncIntegration(integration.id);

    return integration;
  }

  /**
   * Sync data from an integration
   */
  async syncIntegration(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    try {
      await prisma.integration.update({
        where: { id: integrationId },
        data: { syncStatus: 'syncing' },
      });

      // Route to appropriate sync method based on provider
      switch (integration.provider) {
        case 'shopify':
          await this.syncShopifyData(integration);
          break;
        case 'stripe':
          await this.syncStripeData(integration);
          break;
        case 'mailchimp':
          await this.syncMailchimpData(integration);
          break;
        case 'hubspot':
          await this.syncHubSpotData(integration);
          break;
        case 'google-analytics':
          await this.syncGoogleAnalyticsData(integration);
          break;
        default:
          throw new Error(`Sync not implemented for provider: ${integration.provider}`);
      }

      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'completed',
          lastSync: new Date(),
          errorMessage: null,
        },
      });

    } catch (error) {
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
      throw error;
    }
  }

  /**
   * Sync Shopify data
   */
  private async syncShopifyData(integration: Integration) {
    // Mock Shopify data sync
    const mockCustomers = [
      {
        externalId: 'shopify_customer_1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        attributes: {
          source: 'shopify',
          totalOrders: 5,
          totalSpent: 450.00,
          acceptsMarketing: true,
          createdAt: '2023-01-15T10:30:00Z',
        },
      },
      {
        externalId: 'shopify_customer_2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        attributes: {
          source: 'shopify',
          totalOrders: 12,
          totalSpent: 1250.00,
          acceptsMarketing: true,
          createdAt: '2022-11-20T14:45:00Z',
        },
      },
    ];

    for (const customerData of mockCustomers) {
      // Upsert customer
      const customer = await prisma.customer.upsert({
        where: {
          tenantId_externalId: {
            tenantId: integration.tenantId,
            externalId: customerData.externalId,
          },
        },
        update: {
          email: customerData.email,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          attributes: customerData.attributes,
        },
        create: {
          tenantId: integration.tenantId,
          externalId: customerData.externalId,
          email: customerData.email,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          attributes: customerData.attributes,
        },
      });

      // Create mock purchase events
      const mockOrders = Array.from({ length: customerData.attributes.totalOrders }, (_, i) => ({
        customerId: customer.id,
        tenantId: integration.tenantId,
        eventType: 'purchase',
        properties: {
          orderId: `order_${customerData.externalId}_${i + 1}`,
          amount: Math.random() * 200 + 50,
          currency: 'USD',
          source: 'shopify',
        },
        occurredAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Random date in last year
      }));

      await prisma.behaviorEvent.createMany({
        data: mockOrders,
        skipDuplicates: true,
      });
    }
  }

  /**
   * Sync Stripe data
   */
  private async syncStripeData(integration: Integration) {
    // Mock Stripe data sync
    const mockPayments = [
      {
        customerId: 'stripe_customer_1',
        amount: 99.99,
        currency: 'USD',
        status: 'succeeded',
        description: 'Monthly subscription',
      },
      {
        customerId: 'stripe_customer_2',
        amount: 199.99,
        currency: 'USD',
        status: 'succeeded',
        description: 'Annual subscription',
      },
    ];

    for (const payment of mockPayments) {
      // Find or create customer
      let customer = await prisma.customer.findFirst({
        where: {
          tenantId: integration.tenantId,
          externalId: payment.customerId,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId: integration.tenantId,
            externalId: payment.customerId,
            attributes: {
              source: 'stripe',
            },
          },
        });
      }

      // Create payment event
      await prisma.behaviorEvent.create({
        data: {
          customerId: customer.id,
          tenantId: integration.tenantId,
          eventType: 'payment',
          properties: {
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            description: payment.description,
            source: 'stripe',
          },
          occurredAt: new Date(),
        },
      });
    }
  }

  /**
   * Sync Mailchimp data
   */
  private async syncMailchimpData(integration: Integration) {
    // Mock Mailchimp data sync
    const mockSubscribers = [
      {
        email: 'subscriber1@example.com',
        status: 'subscribed',
        emailOpenRate: 0.25,
        emailClickRate: 0.05,
        tags: ['newsletter', 'product-updates'],
      },
      {
        email: 'subscriber2@example.com',
        status: 'subscribed',
        emailOpenRate: 0.40,
        emailClickRate: 0.12,
        tags: ['newsletter', 'promotions'],
      },
    ];

    for (const subscriber of mockSubscribers) {
      // Find or create customer by email
      let customer = await prisma.customer.findFirst({
        where: {
          tenantId: integration.tenantId,
          email: subscriber.email,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId: integration.tenantId,
            externalId: `mailchimp_${subscriber.email}`,
            email: subscriber.email,
            attributes: {
              source: 'mailchimp',
              emailStatus: subscriber.status,
              emailOpenRate: subscriber.emailOpenRate,
              emailClickRate: subscriber.emailClickRate,
              tags: subscriber.tags,
            },
          },
        });
      } else {
        // Update existing customer with email data
        await prisma.customer.update({
          where: { id: customer.id },
          data: {
            attributes: {
              ...((customer.attributes as any) || {}),
              emailStatus: subscriber.status,
              emailOpenRate: subscriber.emailOpenRate,
              emailClickRate: subscriber.emailClickRate,
              tags: subscriber.tags,
            },
          },
        });
      }

      // Create email engagement events
      const emailEvents = [
        {
          eventType: 'email_open',
          properties: { campaignId: 'campaign_1', source: 'mailchimp' },
        },
        {
          eventType: 'email_click',
          properties: { campaignId: 'campaign_1', linkUrl: 'https://example.com', source: 'mailchimp' },
        },
      ];

      for (const event of emailEvents) {
        await prisma.behaviorEvent.create({
          data: {
            customerId: customer.id,
            tenantId: integration.tenantId,
            eventType: event.eventType,
            properties: event.properties,
            occurredAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
          },
        });
      }
    }
  }

  /**
   * Sync HubSpot data
   */
  private async syncHubSpotData(integration: Integration) {
    // Mock HubSpot data sync
    const mockContacts = [
      {
        externalId: 'hubspot_contact_1',
        email: 'lead1@example.com',
        firstName: 'Alice',
        lastName: 'Johnson',
        attributes: {
          source: 'hubspot',
          lifecycle_stage: 'customer',
          lead_score: 85,
          company: 'Tech Corp',
          industry: 'Technology',
        },
      },
      {
        externalId: 'hubspot_contact_2',
        email: 'lead2@example.com',
        firstName: 'Bob',
        lastName: 'Wilson',
        attributes: {
          source: 'hubspot',
          lifecycle_stage: 'qualified_lead',
          lead_score: 65,
          company: 'Marketing Inc',
          industry: 'Marketing',
        },
      },
    ];

    for (const contact of mockContacts) {
      // Upsert contact
      const customer = await prisma.customer.upsert({
        where: {
          tenantId_externalId: {
            tenantId: integration.tenantId,
            externalId: contact.externalId,
          },
        },
        update: {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          attributes: contact.attributes,
        },
        create: {
          tenantId: integration.tenantId,
          externalId: contact.externalId,
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          attributes: contact.attributes,
        },
      });

      // Create CRM interaction events
      await prisma.behaviorEvent.create({
        data: {
          customerId: customer.id,
          tenantId: integration.tenantId,
          eventType: 'crm_update',
          properties: {
            lifecycle_stage: contact.attributes.lifecycle_stage,
            lead_score: contact.attributes.lead_score,
            source: 'hubspot',
          },
          occurredAt: new Date(),
        },
      });
    }
  }

  /**
   * Sync Google Analytics data
   */
  private async syncGoogleAnalyticsData(integration: Integration) {
    // Mock Google Analytics data sync
    // In a real implementation, this would use the Google Analytics API
    const mockSessions = [
      {
        clientId: 'ga_client_1',
        sessionId: 'session_1',
        pageViews: 5,
        duration: 300, // seconds
        source: 'google',
        medium: 'organic',
        campaign: null,
      },
      {
        clientId: 'ga_client_2',
        sessionId: 'session_2',
        pageViews: 3,
        duration: 180,
        source: 'facebook',
        medium: 'social',
        campaign: 'summer_sale',
      },
    ];

    for (const session of mockSessions) {
      // Find or create customer by client ID
      let customer = await prisma.customer.findFirst({
        where: {
          tenantId: integration.tenantId,
          externalId: session.clientId,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            tenantId: integration.tenantId,
            externalId: session.clientId,
            attributes: {
              source: 'google_analytics',
            },
          },
        });
      }

      // Create page view events
      for (let i = 0; i < session.pageViews; i++) {
        await prisma.behaviorEvent.create({
          data: {
            customerId: customer.id,
            tenantId: integration.tenantId,
            eventType: 'page_view',
            properties: {
              sessionId: session.sessionId,
              source: session.source,
              medium: session.medium,
              campaign: session.campaign,
              pageNumber: i + 1,
              analyticsSource: 'google_analytics',
            },
            occurredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date in last week
          },
        });
      }

      // Create session event
      await prisma.behaviorEvent.create({
        data: {
          customerId: customer.id,
          tenantId: integration.tenantId,
          eventType: 'session',
          properties: {
            sessionId: session.sessionId,
            duration: session.duration,
            pageViews: session.pageViews,
            source: session.source,
            medium: session.medium,
            campaign: session.campaign,
            analyticsSource: 'google_analytics',
          },
          occurredAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  /**
   * Get integration status for a tenant
   */
  async getIntegrationStatus(tenantId: string) {
    const integrations = await prisma.integration.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await Promise.all(
      integrations.map(async (integration) => {
        const customerCount = await prisma.customer.count({
          where: {
            tenantId,
            attributes: {
              path: ['source'],
              equals: integration.provider,
            },
          },
        });

        const eventCount = await prisma.behaviorEvent.count({
          where: {
            tenantId,
            properties: {
              path: ['source'],
              equals: integration.provider,
            },
          },
        });

        return {
          ...integration,
          stats: {
            customerCount,
            eventCount,
            lastSyncAgo: integration.lastSync 
              ? Math.floor((Date.now() - integration.lastSync.getTime()) / (1000 * 60)) 
              : null,
          },
        };
      })
    );

    return stats;
  }

  /**
   * Test integration connection
   */
  async testIntegration(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    // Mock connection test
    // In a real implementation, this would test the actual API connection
    const isValid = Math.random() > 0.1; // 90% success rate for demo

    if (!isValid) {
      throw new Error('Integration test failed: Invalid credentials or connection timeout');
    }

    return {
      success: true,
      message: 'Connection successful',
      provider: integration.provider,
      testTimestamp: new Date(),
    };
  }

  /**
   * Delete integration and associated data
   */
  async deleteIntegration(integrationId: string, deleteAssociatedData: boolean = false) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    if (deleteAssociatedData) {
      // Delete customers from this integration
      await prisma.customer.deleteMany({
        where: {
          tenantId: integration.tenantId,
          attributes: {
            path: ['source'],
            equals: integration.provider,
          },
        },
      });

      // Delete events from this integration
      await prisma.behaviorEvent.deleteMany({
        where: {
          tenantId: integration.tenantId,
          properties: {
            path: ['source'],
            equals: integration.provider,
          },
        },
      });
    }

    // Delete the integration
    await prisma.integration.delete({
      where: { id: integrationId },
    });

    return { success: true };
  }
}