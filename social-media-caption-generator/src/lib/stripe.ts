import Stripe from 'stripe';
import { prisma } from './prisma';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true
});

// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    name: 'Free',
    stripePriceId: null,
    creditsPerMonth: 20,
    maxBrandVoices: 2,
    features: ['basic_generation', 'community_support'],
    price: 0
  },
  CREATOR: {
    name: 'Creator',
    stripePriceId: process.env.STRIPE_CREATOR_PRICE_ID,
    creditsPerMonth: 200,
    maxBrandVoices: 5,
    features: ['basic_generation', 'brand_voices', 'image_analysis', 'priority_support', 'analytics'],
    price: 19
  },
  PROFESSIONAL: {
    name: 'Professional',
    stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    creditsPerMonth: 1000,
    maxBrandVoices: -1, // unlimited
    features: ['all_creator_features', 'team_collaboration', 'api_access', 'bulk_generation', 'advanced_analytics'],
    price: 49
  },
  AGENCY: {
    name: 'Agency',
    stripePriceId: process.env.STRIPE_AGENCY_PRICE_ID,
    creditsPerMonth: 5000,
    maxBrandVoices: -1, // unlimited
    features: ['all_professional_features', 'white_label', 'custom_training', 'dedicated_support', 'enterprise_features'],
    price: 149
  }
} as const;

// Stripe service class
export class StripeService {
  private static instance: StripeService;
  
  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Create Stripe customer
  async createCustomer(user: {
    id: string;
    email: string;
    name?: string | null;
  }): Promise<string> {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      });

      // Update user record with Stripe customer ID
      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customer.id,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          creditsPerMonth: SUBSCRIPTION_TIERS.FREE.creditsPerMonth
        },
        update: {
          stripeCustomerId: customer.id
        }
      });

      return customer.id;
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      throw new Error('Failed to create customer');
    }
  }

  // Get or create customer
  async getOrCreateCustomer(userId: string): Promise<string> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        include: { user: true }
      });

      if (subscription?.stripeCustomerId) {
        // Verify customer exists in Stripe
        try {
          await stripe.customers.retrieve(subscription.stripeCustomerId);
          return subscription.stripeCustomerId;
        } catch (error) {
          // Customer doesn't exist in Stripe, create new one
          return await this.createCustomer(subscription.user);
        }
      }

      // No customer ID in database, create new customer
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return await this.createCustomer(user);
    } catch (error) {
      console.error('Error getting/creating customer:', error);
      throw error;
    }
  }

  // Create checkout session
  async createCheckoutSession(
    userId: string,
    tier: keyof typeof SUBSCRIPTION_TIERS,
    options: {
      successUrl: string;
      cancelUrl: string;
      trialDays?: number;
    }
  ): Promise<{ sessionId: string; url: string }> {
    try {
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      if (!tierConfig.stripePriceId) {
        throw new Error('Invalid subscription tier');
      }

      const customerId = await this.getOrCreateCustomer(userId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: tierConfig.stripePriceId,
            quantity: 1
          }
        ],
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        subscription_data: options.trialDays ? {
          trial_period_days: options.trialDays
        } : undefined,
        metadata: {
          userId,
          tier
        },
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        tax_id_collection: {
          enabled: true
        }
      });

      return {
        sessionId: session.id,
        url: session.url!
      };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw new Error('Failed to create checkout session');
    }
  }

  // Create portal session
  async createPortalSession(userId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      const customerId = await this.getOrCreateCustomer(userId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      return { url: session.url };
    } catch (error) {
      console.error('Error creating portal session:', error);
      throw new Error('Failed to create portal session');
    }
  }

  // Handle successful subscription
  async handleSubscriptionSuccess(
    subscriptionId: string,
    customerId: string
  ): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const customer = await stripe.customers.retrieve(customerId);

      const userId = (customer as Stripe.Customer).metadata?.userId;
      if (!userId) {
        throw new Error('User ID not found in customer metadata');
      }

      // Get price information to determine tier
      const priceId = subscription.items.data[0]?.price.id;
      const tier = this.getTierFromPriceId(priceId);

      if (!tier) {
        throw new Error('Unable to determine subscription tier');
      }

      const tierConfig = SUBSCRIPTION_TIERS[tier];

      // Update subscription in database
      await prisma.subscription.update({
        where: { userId },
        data: {
          stripeSubscriptionId: subscriptionId,
          stripePriceId: priceId,
          tier,
          status: SubscriptionStatus.ACTIVE,
          creditsPerMonth: tierConfig.creditsPerMonth,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });

      // Add credits for the current period
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: { increment: tierConfig.creditsPerMonth }
        }
      });

      // Log the event
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'subscription_activated',
          resource: 'subscription',
          metadata: {
            tier,
            subscriptionId,
            creditsAdded: tierConfig.creditsPerMonth
          }
        }
      });

      console.log(`Subscription activated for user ${userId}: ${tier}`);
    } catch (error) {
      console.error('Error handling subscription success:', error);
      throw error;
    }
  }

  // Handle subscription cancellation
  async handleSubscriptionCancellation(subscriptionId: string): Promise<void> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (!dbSubscription) {
        throw new Error('Subscription not found in database');
      }

      // Update subscription status
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: subscription.status === 'canceled' ? SubscriptionStatus.CANCELED : SubscriptionStatus.INACTIVE,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });

      // If immediately canceled, downgrade to free tier
      if (subscription.status === 'canceled') {
        await this.downgradeToFree(dbSubscription.userId);
      }

      // Log the event
      await prisma.auditLog.create({
        data: {
          userId: dbSubscription.userId,
          action: 'subscription_canceled',
          resource: 'subscription',
          metadata: {
            subscriptionId,
            canceledAt: new Date()
          }
        }
      });

      console.log(`Subscription canceled: ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling subscription cancellation:', error);
      throw error;
    }
  }

  // Handle payment failure
  async handlePaymentFailure(subscriptionId: string): Promise<void> {
    try {
      const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId }
      });

      if (!dbSubscription) return;

      // Update status to past due
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: SubscriptionStatus.PAST_DUE
        }
      });

      // Send notification to user
      await prisma.notification.create({
        data: {
          userId: dbSubscription.userId,
          type: 'SUBSCRIPTION_EXPIRED',
          title: 'Payment Failed',
          message: 'Your subscription payment has failed. Please update your payment method to continue using premium features.',
          data: {
            subscriptionId,
            action: 'update_payment_method'
          }
        }
      });

      console.log(`Payment failed for subscription: ${subscriptionId}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  // Downgrade user to free tier
  private async downgradeToFree(userId: string): Promise<void> {
    try {
      await prisma.subscription.update({
        where: { userId },
        data: {
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          creditsPerMonth: SUBSCRIPTION_TIERS.FREE.creditsPerMonth,
          stripeSubscriptionId: null,
          stripePriceId: null,
          currentPeriodStart: null,
          currentPeriodEnd: null
        }
      });

      // Reset monthly credits to free tier limit
      await prisma.user.update({
        where: { id: userId },
        data: {
          creditBalance: SUBSCRIPTION_TIERS.FREE.creditsPerMonth
        }
      });

      console.log(`User ${userId} downgraded to free tier`);
    } catch (error) {
      console.error('Error downgrading to free tier:', error);
      throw error;
    }
  }

  // Get tier from Stripe price ID
  private getTierFromPriceId(priceId: string): keyof typeof SUBSCRIPTION_TIERS | null {
    for (const [tier, config] of Object.entries(SUBSCRIPTION_TIERS)) {
      if (config.stripePriceId === priceId) {
        return tier as keyof typeof SUBSCRIPTION_TIERS;
      }
    }
    return null;
  }

  // Refresh user credits (monthly)
  async refreshMonthlyCredits(): Promise<void> {
    try {
      const activeSubscriptions = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodEnd: {
            lte: new Date() // Period has ended
          }
        },
        include: { user: true }
      });

      for (const subscription of activeSubscriptions) {
        const tierConfig = SUBSCRIPTION_TIERS[subscription.tier];
        
        // Add monthly credits
        await prisma.user.update({
          where: { id: subscription.userId },
          data: {
            creditBalance: { increment: tierConfig.creditsPerMonth }
          }
        });

        // Update period dates if it's a Stripe subscription
        if (subscription.stripeSubscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId
          );

          await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            }
          });
        }

        console.log(`Credits refreshed for user ${subscription.userId}: +${tierConfig.creditsPerMonth}`);
      }

      console.log(`Refreshed credits for ${activeSubscriptions.length} users`);
    } catch (error) {
      console.error('Error refreshing monthly credits:', error);
      throw error;
    }
  }

  // Get subscription usage analytics
  async getSubscriptionAnalytics(userId: string): Promise<{
    currentTier: string;
    creditsUsed: number;
    creditsRemaining: number;
    monthlyLimit: number;
    daysUntilRenewal: number;
    usageHistory: Array<{
      date: Date;
      creditsUsed: number;
      action: string;
    }>;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscription: true,
          auditLogs: {
            where: {
              action: { in: ['caption_generated', 'image_analyzed', 'brand_voice_created'] },
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
            },
            orderBy: { createdAt: 'desc' },
            take: 100
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const subscription = user.subscription;
      const tierConfig = SUBSCRIPTION_TIERS[subscription?.tier || 'FREE'];

      // Calculate days until renewal
      let daysUntilRenewal = 0;
      if (subscription?.currentPeriodEnd) {
        const now = new Date();
        const renewalDate = subscription.currentPeriodEnd;
        daysUntilRenewal = Math.max(0, Math.ceil((renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      }

      // Usage history
      const usageHistory = user.auditLogs.map(log => ({
        date: log.createdAt,
        creditsUsed: 1, // Simplified - in reality, different actions might use different credits
        action: log.action
      }));

      return {
        currentTier: subscription?.tier || 'FREE',
        creditsUsed: user.totalCreditsUsed,
        creditsRemaining: user.creditBalance,
        monthlyLimit: tierConfig.creditsPerMonth,
        daysUntilRenewal,
        usageHistory
      };
    } catch (error) {
      console.error('Error getting subscription analytics:', error);
      throw error;
    }
  }

  // Check if user can access feature
  canAccessFeature(subscription: any, feature: string): boolean {
    if (!subscription) return false;
    
    const tierConfig = SUBSCRIPTION_TIERS[subscription.tier as keyof typeof SUBSCRIPTION_TIERS];
    return tierConfig.features.includes(feature) || 
           tierConfig.features.some(f => f.startsWith('all_') && feature !== 'white_label' && feature !== 'custom_training');
  }

  // Get feature limits for user
  getFeatureLimits(subscription: any): {
    maxBrandVoices: number;
    creditsPerMonth: number;
    features: string[];
  } {
    const tier = subscription?.tier || 'FREE';
    const tierConfig = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
    
    return {
      maxBrandVoices: tierConfig.maxBrandVoices,
      creditsPerMonth: tierConfig.creditsPerMonth,
      features: tierConfig.features
    };
  }
}

export const stripeService = StripeService.getInstance();