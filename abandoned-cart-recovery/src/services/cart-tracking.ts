import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { CartData, CustomerData } from '@/lib/integrations/platform-adapter';
import { AbandonedCart, Customer, EcommercePlatform } from '@prisma/client';
import { cartRecoveryQueue } from './queue-service';

export interface CartTrackingEvent {
  type: 'cart_created' | 'cart_updated' | 'cart_abandoned' | 'cart_recovered';
  storeId: string;
  cartData: CartData;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class CartTrackingService {
  private static instance: CartTrackingService;
  
  static getInstance(): CartTrackingService {
    if (!CartTrackingService.instance) {
      CartTrackingService.instance = new CartTrackingService();
    }
    return CartTrackingService.instance;
  }

  /**
   * Track a cart event from e-commerce platform
   */
  async trackCartEvent(event: CartTrackingEvent): Promise<void> {
    try {
      // Validate the event
      this.validateCartEvent(event);

      // Process based on event type
      switch (event.type) {
        case 'cart_created':
        case 'cart_updated':
          await this.handleCartUpdate(event);
          break;
        case 'cart_abandoned':
          await this.handleCartAbandonment(event);
          break;
        case 'cart_recovered':
          await this.handleCartRecovery(event);
          break;
      }

      // Store event in Redis for real-time dashboard
      await this.cacheCartEvent(event);

      console.log(`Cart event processed: ${event.type} for store ${event.storeId}`);
    } catch (error) {
      console.error('Error tracking cart event:', error);
      throw error;
    }
  }

  /**
   * Handle cart creation or update
   */
  private async handleCartUpdate(event: CartTrackingEvent): Promise<void> {
    const { storeId, cartData } = event;

    // Upsert customer data
    const customer = await this.upsertCustomer(storeId, cartData.customerData);

    // Upsert cart data
    const cart = await this.upsertCart(storeId, customer.id, cartData);

    // Schedule abandonment check (15 minutes default)
    await this.scheduleAbandonmentCheck(cart.id, 15 * 60 * 1000);

    // Update real-time metrics
    await this.updateRealTimeMetrics(storeId, 'cart_updated');
  }

  /**
   * Handle cart abandonment detection
   */
  private async handleCartAbandonment(event: CartTrackingEvent): Promise<void> {
    const { storeId, cartData } = event;

    // Find the cart in database
    const cart = await prisma.abandonedCart.findFirst({
      where: {
        storeId,
        externalCartId: cartData.id,
      },
      include: {
        customer: true,
        store: {
          include: {
            campaigns: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    if (!cart) {
      console.warn(`Cart not found for abandonment: ${cartData.id}`);
      return;
    }

    // Mark cart as abandoned
    await prisma.abandonedCart.update({
      where: { id: cart.id },
      data: {
        abandonedAt: event.timestamp,
        recovered: false,
      },
    });

    // Check customer consent and trigger recovery campaigns
    if (this.hasValidConsent(cart.customer)) {
      await this.triggerRecoveryCampaigns(cart, cart.store.campaigns);
    }

    // Update analytics
    await this.updateDailyAnalytics(storeId, 'cart_abandoned');
    await this.updateRealTimeMetrics(storeId, 'cart_abandoned');
  }

  /**
   * Handle successful cart recovery
   */
  private async handleCartRecovery(event: CartTrackingEvent): Promise<void> {
    const { storeId, cartData } = event;

    // Find and update the recovered cart
    const cart = await prisma.abandonedCart.findFirst({
      where: {
        storeId,
        externalCartId: cartData.id,
      },
    });

    if (cart && !cart.recovered) {
      await prisma.abandonedCart.update({
        where: { id: cart.id },
        data: {
          recovered: true,
          recoveredAt: event.timestamp,
          recoveryRevenue: cartData.value,
          recoveryMethod: this.determineRecoveryMethod(event.metadata),
        },
      });

      // Update analytics
      await this.updateDailyAnalytics(storeId, 'cart_recovered', cartData.value);
      await this.updateRealTimeMetrics(storeId, 'cart_recovered');

      console.log(`Cart recovered: ${cartData.id} for $${cartData.value}`);
    }
  }

  /**
   * Upsert customer data
   */
  private async upsertCustomer(storeId: string, customerData: CustomerData): Promise<Customer> {
    return prisma.customer.upsert({
      where: {
        storeId_externalId: {
          storeId,
          externalId: customerData.id,
        },
      },
      update: {
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        totalOrders: customerData.totalOrders || 0,
        totalSpent: customerData.totalSpent || 0,
        lastActivity: new Date(),
        metadata: {
          acceptsMarketing: customerData.acceptsMarketing,
        },
      },
      create: {
        storeId,
        externalId: customerData.id,
        email: customerData.email,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        phone: customerData.phone,
        totalOrders: customerData.totalOrders || 0,
        totalSpent: customerData.totalSpent || 0,
        consentEmail: customerData.acceptsMarketing || false,
        consentSms: false, // Requires explicit SMS consent
        lastActivity: new Date(),
        metadata: {
          acceptsMarketing: customerData.acceptsMarketing,
        },
      },
    });
  }

  /**
   * Upsert abandoned cart data
   */
  private async upsertCart(storeId: string, customerId: string, cartData: CartData): Promise<AbandonedCart> {
    return prisma.abandonedCart.upsert({
      where: {
        storeId_externalCartId: {
          storeId,
          externalCartId: cartData.id,
        },
      },
      update: {
        cartValue: cartData.value,
        cartItems: cartData.items,
        cartUrl: cartData.cartUrl,
        metadata: cartData.metadata,
      },
      create: {
        storeId,
        customerId,
        externalCartId: cartData.id,
        cartValue: cartData.value,
        cartItems: cartData.items,
        cartUrl: cartData.cartUrl,
        abandonedAt: cartData.abandonedAt,
        metadata: cartData.metadata,
      },
    });
  }

  /**
   * Schedule abandonment check using job queue
   */
  private async scheduleAbandonmentCheck(cartId: string, delayMs: number): Promise<void> {
    await cartRecoveryQueue.add(
      'check-abandonment',
      { cartId },
      {
        delay: delayMs,
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
  }

  /**
   * Check if customer has valid consent for marketing
   */
  private hasValidConsent(customer: Customer): boolean {
    return customer.consentEmail && !customer.optOutEmail;
  }

  /**
   * Trigger recovery campaigns for abandoned cart
   */
  private async triggerRecoveryCampaigns(cart: AbandonedCart, campaigns: any[]): Promise<void> {
    for (const campaign of campaigns) {
      // Check campaign trigger conditions
      if (this.checkCampaignTriggers(cart, campaign)) {
        await cartRecoveryQueue.add(
          'start-campaign',
          {
            cartId: cart.id,
            campaignId: campaign.id,
          },
          {
            removeOnComplete: true,
            removeOnFail: false,
          }
        );
      }
    }
  }

  /**
   * Check if cart meets campaign trigger conditions
   */
  private checkCampaignTriggers(cart: AbandonedCart, campaign: any): boolean {
    const conditions = campaign.triggerConditions as any;

    // Check minimum cart value
    if (conditions.minCartValue && cart.cartValue < conditions.minCartValue) {
      return false;
    }

    // Check maximum cart value
    if (conditions.maxCartValue && cart.cartValue > conditions.maxCartValue) {
      return false;
    }

    // Check customer segment (new vs returning)
    if (conditions.customerSegment && !this.matchesCustomerSegment(cart, conditions.customerSegment)) {
      return false;
    }

    return true;
  }

  /**
   * Check if cart matches customer segment criteria
   */
  private matchesCustomerSegment(cart: AbandonedCart, segment: string): boolean {
    // This would check customer history, purchase behavior, etc.
    // Implementation depends on segmentation strategy
    return true;
  }

  /**
   * Determine recovery method from metadata
   */
  private determineRecoveryMethod(metadata?: Record<string, any>): 'EMAIL' | 'SMS' | 'DIRECT' | 'PUSH' {
    if (metadata?.recoverySource === 'email') return 'EMAIL';
    if (metadata?.recoverySource === 'sms') return 'SMS';
    if (metadata?.recoverySource === 'push') return 'PUSH';
    return 'DIRECT';
  }

  /**
   * Update daily analytics aggregates
   */
  private async updateDailyAnalytics(storeId: string, eventType: string, revenue?: number): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const data: any = {
      date: today,
    };

    switch (eventType) {
      case 'cart_abandoned':
        data.cartsAbandoned = { increment: 1 };
        break;
      case 'cart_recovered':
        data.cartsRecovered = { increment: 1 };
        if (revenue) {
          data.revenueRecovered = { increment: revenue };
        }
        break;
    }

    await prisma.analytics.upsert({
      where: {
        storeId_date: {
          storeId,
          date: today,
        },
      },
      update: data,
      create: {
        storeId,
        date: today,
        cartsAbandoned: eventType === 'cart_abandoned' ? 1 : 0,
        cartsRecovered: eventType === 'cart_recovered' ? 1 : 0,
        revenueRecovered: revenue || 0,
        ...data,
      },
    });
  }

  /**
   * Update real-time metrics in Redis
   */
  private async updateRealTimeMetrics(storeId: string, eventType: string): Promise<void> {
    const key = `metrics:${storeId}:${new Date().toISOString().split('T')[0]}`;
    
    await redis.hincrby(key, eventType, 1);
    await redis.expire(key, 86400 * 7); // Expire after 7 days
  }

  /**
   * Cache cart event for real-time dashboard
   */
  private async cacheCartEvent(event: CartTrackingEvent): Promise<void> {
    const key = `events:${event.storeId}`;
    const eventData = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString(),
    });

    await redis.lpush(key, eventData);
    await redis.ltrim(key, 0, 99); // Keep last 100 events
    await redis.expire(key, 3600); // Expire after 1 hour
  }

  /**
   * Validate cart tracking event
   */
  private validateCartEvent(event: CartTrackingEvent): void {
    if (!event.type || !event.storeId || !event.cartData) {
      throw new Error('Invalid cart tracking event: missing required fields');
    }

    if (!event.cartData.id || !event.cartData.email) {
      throw new Error('Invalid cart data: missing cart ID or customer email');
    }

    if (!this.isValidEmail(event.cartData.email)) {
      throw new Error('Invalid customer email address');
    }
  }

  /**
   * Validate email address
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get real-time cart metrics for dashboard
   */
  async getRealTimeMetrics(storeId: string): Promise<Record<string, number>> {
    const key = `metrics:${storeId}:${new Date().toISOString().split('T')[0]}`;
    const metrics = await redis.hgetall(key);
    
    return {
      cartsAbandoned: parseInt(metrics.cart_abandoned || '0'),
      cartsUpdated: parseInt(metrics.cart_updated || '0'),
      cartsRecovered: parseInt(metrics.cart_recovered || '0'),
    };
  }

  /**
   * Get recent cart events for dashboard
   */
  async getRecentEvents(storeId: string, limit: number = 10): Promise<CartTrackingEvent[]> {
    const key = `events:${storeId}`;
    const events = await redis.lrange(key, 0, limit - 1);
    
    return events.map(event => JSON.parse(event));
  }
}