import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const STRIPE_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    priceId: null,
    credits: 20,
    features: ['20 captions/month', '2 brand voices', 'Basic analytics', 'Community support'],
  },
  CREATOR: {
    name: 'Creator',
    price: 1900, // $19.00 in cents
    priceId: process.env.STRIPE_CREATOR_PRICE_ID,
    credits: 200,
    features: ['200 captions/month', '5 brand voices', 'All platforms', 'Priority generation', 'Advanced analytics', 'Email support'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    price: 4900, // $49.00 in cents
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    credits: 1000,
    features: ['1,000 captions/month', 'Unlimited brand voices', 'API access', 'Bulk generation', 'Team collaboration', 'Priority support'],
  },
  AGENCY: {
    name: 'Agency',
    price: 14900, // $149.00 in cents
    priceId: process.env.STRIPE_AGENCY_PRICE_ID,
    credits: 5000,
    features: ['5,000 captions/month', 'White-label option', 'Custom AI training', 'Dedicated support', 'Advanced integrations', 'Custom reporting'],
  },
} as const;

export type PlanType = keyof typeof STRIPE_PLANS;

export async function createCheckoutSession({
  priceId,
  customerId,
  userId,
  organizationId,
  successUrl,
  cancelUrl,
  trialDays = 14,
}: {
  priceId: string;
  customerId?: string;
  userId: string;
  organizationId?: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      ...(organizationId && { organizationId }),
    },
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        userId,
        ...(organizationId && { organizationId }),
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_creation = 'always';
  }

  return await stripe.checkout.sessions.create(sessionParams);
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function createCustomer({
  email,
  name,
  userId,
  organizationId,
}: {
  email: string;
  name?: string;
  userId: string;
  organizationId?: string;
}) {
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
      ...(organizationId && { organizationId }),
    },
  });
}

export async function updateSubscription({
  subscriptionId,
  priceId,
  quantity = 1,
  prorationBehavior = 'create_prorations',
}: {
  subscriptionId: string;
  priceId: string;
  quantity?: number;
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice';
}) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
        quantity,
      },
    ],
    proration_behavior: prorationBehavior,
  });
}

export async function cancelSubscription({
  subscriptionId,
  cancelAtPeriodEnd = true,
}: {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
}) {
  if (cancelAtPeriodEnd) {
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

export async function resumeSubscription({
  subscriptionId,
}: {
  subscriptionId: string;
}) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

export async function createUsageRecord({
  subscriptionItemId,
  quantity,
  timestamp,
  action = 'increment',
}: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: 'increment' | 'set';
}) {
  return await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp: timestamp || Math.floor(Date.now() / 1000),
    action,
  });
}

export async function getUpcomingInvoice({
  customerId,
  subscriptionId,
}: {
  customerId: string;
  subscriptionId?: string;
}) {
  const params: Stripe.InvoiceRetrieveUpcomingParams = {
    customer: customerId,
  };

  if (subscriptionId) {
    params.subscription = subscriptionId;
  }

  return await stripe.invoices.retrieveUpcoming(params);
}

export async function addSeatsToSubscription({
  subscriptionId,
  additionalSeats,
}: {
  subscriptionId: string;
  additionalSeats: number;
}) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentQuantity = subscription.items.data[0].quantity || 1;
  const newQuantity = currentQuantity + additionalSeats;

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        quantity: newQuantity,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

export async function removeSeatsFromSubscription({
  subscriptionId,
  seatsToRemove,
}: {
  subscriptionId: string;
  seatsToRemove: number;
}) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentQuantity = subscription.items.data[0].quantity || 1;
  const newQuantity = Math.max(1, currentQuantity - seatsToRemove);

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        quantity: newQuantity,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

export function formatPrice(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}

export function getPlanByPriceId(priceId: string): [PlanType, typeof STRIPE_PLANS[PlanType]] | null {
  for (const [planKey, plan] of Object.entries(STRIPE_PLANS)) {
    if (plan.priceId === priceId) {
      return [planKey as PlanType, plan];
    }
  }
  return null;
}

export function isValidPlan(plan: string): plan is PlanType {
  return plan in STRIPE_PLANS;
}

export async function handleSubscriptionStatusChange({
  subscription,
  previousAttributes,
}: {
  subscription: Stripe.Subscription;
  previousAttributes?: Partial<Stripe.Subscription>;
}) {
  const { prisma } = await import('@/lib/prisma');
  
  const userId = subscription.metadata.userId;
  const organizationId = subscription.metadata.organizationId;

  if (!userId) {
    console.error('No userId in subscription metadata:', subscription.id);
    return;
  }

  // Determine the plan from the price ID
  const priceId = subscription.items.data[0]?.price.id;
  const planInfo = getPlanByPriceId(priceId);
  
  if (!planInfo) {
    console.error('Unknown price ID:', priceId);
    return;
  }

  const [planType, planDetails] = planInfo;

  // Update subscription in database
  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    plan: planType,
    status: subscription.status.toUpperCase() as any,
    credits: planDetails.credits,
    maxCredits: planDetails.credits,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    creditsResetDate: new Date(subscription.current_period_end * 1000),
  };

  if (organizationId) {
    // Update organization subscription
    await prisma.organizationSubscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: subscriptionData,
      create: {
        ...subscriptionData,
        organizationId,
        stripeCustomerId: subscription.customer as string,
      },
    });
  } else {
    // Update user subscription
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: subscriptionData,
      create: {
        ...subscriptionData,
        userId,
        stripeCustomerId: subscription.customer as string,
      },
    });
  }

  // Log activity
  await prisma.activity.create({
    data: {
      userId,
      organizationId: organizationId || undefined,
      type: subscription.status === 'active' ? 'SUBSCRIPTION_ACTIVATED' : 'SUBSCRIPTION_UPDATED',
      description: `Subscription ${subscription.status}: ${planType} plan`,
      metadata: {
        subscriptionId: subscription.id,
        plan: planType,
        status: subscription.status,
        amount: subscription.items.data[0]?.price.unit_amount,
      },
    },
  });
}

export async function syncSubscriptionCredits() {
  const { prisma } = await import('@/lib/prisma');
  
  // Reset credits for subscriptions where the period has ended
  const now = new Date();
  
  // User subscriptions
  const userSubscriptions = await prisma.subscription.findMany({
    where: {
      creditsResetDate: { lte: now },
      status: 'ACTIVE',
    },
  });

  for (const subscription of userSubscriptions) {
    const plan = STRIPE_PLANS[subscription.plan];
    
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        credits: plan.credits,
        creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
      },
    });
  }

  // Organization subscriptions
  const orgSubscriptions = await prisma.organizationSubscription.findMany({
    where: {
      creditsResetDate: { lte: now },
      status: 'ACTIVE',
    },
  });

  for (const subscription of orgSubscriptions) {
    const plan = STRIPE_PLANS[subscription.plan];
    
    await prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        credits: plan.credits,
        creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next month
      },
    });
  }
}