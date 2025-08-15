import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
  appInfo: {
    name: 'EventPro',
    version: '1.0.0',
    url: 'https://eventpro.com',
  },
})

export const getStripePublishableKey = () => {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('Missing STRIPE_PUBLISHABLE_KEY environment variable')
  }
  return process.env.STRIPE_PUBLISHABLE_KEY
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for small events',
    price: 0,
    priceId: null,
    features: [
      '2 events per month',
      '3 social platforms',
      'Basic templates',
      '7-day analytics',
      'Email support',
    ],
    limits: {
      events: 2,
      platforms: 3,
      analytics: 7,
      storage: 100, // MB
    },
  },
  BASIC: {
    id: 'basic',
    name: 'Local Pro',
    description: 'Ideal for regular event organizers',
    price: 2900, // $29.00 in cents
    priceId: process.env.STRIPE_PRICE_ID_BASIC,
    features: [
      '10 events per month',
      'All platforms',
      'Premium templates',
      '30-day analytics',
      'Local SEO tools',
      'Priority support',
    ],
    limits: {
      events: 10,
      platforms: -1, // unlimited
      analytics: 30,
      storage: 1000, // MB
    },
  },
  PRO: {
    id: 'pro',
    name: 'Business',
    description: 'For growing businesses',
    price: 7900, // $79.00 in cents
    priceId: process.env.STRIPE_PRICE_ID_PRO,
    features: [
      'Unlimited events',
      'Multi-location support',
      'Custom branding',
      'API access',
      'Advanced analytics',
      'Phone support',
    ],
    limits: {
      events: -1, // unlimited
      platforms: -1, // unlimited
      analytics: -1, // unlimited
      storage: 5000, // MB
    },
  },
  BUSINESS: {
    id: 'business',
    name: 'Enterprise',
    description: 'For large organizations',
    price: 19900, // $199.00 in cents
    priceId: process.env.STRIPE_PRICE_ID_BUSINESS,
    features: [
      'White-label option',
      'Multiple users',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
    ],
    limits: {
      events: -1, // unlimited
      platforms: -1, // unlimited
      analytics: -1, // unlimited
      storage: 20000, // MB
    },
  },
} as const

// Utility functions
export async function createStripeCustomer(email: string, name?: string, organizationId?: string) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organizationId: organizationId || '',
      },
    })
    return customer
  } catch (error) {
    console.error('Error creating Stripe customer:', error)
    throw error
  }
}

export async function createSubscription(
  customerId: string,
  priceId: string,
  organizationId: string
) {
  try {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        organizationId,
      },
    })
    return subscription
  } catch (error) {
    console.error('Error creating subscription:', error)
    throw error
  }
}

export async function createPaymentIntent(
  amount: number,
  currency = 'usd',
  metadata: Record<string, string> = {}
) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    })
    return paymentIntent
  } catch (error) {
    console.error('Error creating payment intent:', error)
    throw error
  }
}

export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  priceId: string
  customerId?: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  try {
    const sessionData: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: customerId ? undefined : 'always',
    }

    if (customerId) {
      sessionData.customer = customerId
    }

    const session = await stripe.checkout.sessions.create(sessionData)
    return session
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

export async function createPortalSession(customerId: string, returnUrl: string) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })
    return session
  } catch (error) {
    console.error('Error creating portal session:', error)
    throw error
  }
}

export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
    return subscription
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return subscription
  } catch (error) {
    console.error('Error reactivating subscription:', error)
    throw error
  }
}

export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    })
    return updatedSubscription
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

export async function retrieveSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    })
    return subscription
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    throw error
  }
}

export async function getUpcomingInvoice(customerId: string, subscriptionId?: string) {
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
      subscription: subscriptionId,
    })
    return invoice
  } catch (error) {
    console.error('Error retrieving upcoming invoice:', error)
    throw error
  }
}

// Event ticket payment functions
export async function createTicketPaymentIntent({
  amount,
  eventId,
  ticketTierId,
  userId,
  organizationId,
}: {
  amount: number
  eventId: string
  ticketTierId: string
  userId: string
  organizationId: string
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        type: 'ticket_purchase',
        eventId,
        ticketTierId,
        userId,
        organizationId,
      },
      automatic_payment_methods: { enabled: true },
      receipt_email: undefined, // Will be set when user provides email
    })
    return paymentIntent
  } catch (error) {
    console.error('Error creating ticket payment intent:', error)
    throw error
  }
}

export async function createTicketCheckoutSession({
  ticketTiers,
  eventId,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata = {},
}: {
  ticketTiers: Array<{ id: string; name: string; price: number; quantity: number }>
  eventId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
}) {
  try {
    // Create line items for each ticket tier
    const lineItems = ticketTiers.map((tier) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: tier.name,
          metadata: {
            eventId,
            ticketTierId: tier.id,
          },
        },
        unit_amount: tier.price,
      },
      quantity: tier.quantity,
    }))

    const sessionData: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'ticket_purchase',
        eventId,
        ...metadata,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_creation: 'always',
    }

    if (customerEmail) {
      sessionData.customer_email = customerEmail
    }

    const session = await stripe.checkout.sessions.create(sessionData)
    return session
  } catch (error) {
    console.error('Error creating ticket checkout session:', error)
    throw error
  }
}

// Webhook verification
export function verifyWebhookSignature(body: string, signature: string) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable')
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
    return event
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    throw error
  }
}