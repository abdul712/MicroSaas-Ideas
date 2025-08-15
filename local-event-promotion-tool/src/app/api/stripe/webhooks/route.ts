import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, verifyWebhookSignature } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('No stripe-signature header found')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    let event: Stripe.Event
    try {
      event = verifyWebhookSignature(body, signature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('Received Stripe webhook:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Handling subscription created:', subscription.id)

  const organizationId = subscription.metadata.organizationId
  if (!organizationId) {
    console.error('No organizationId in subscription metadata')
    return
  }

  try {
    // Get subscription plan from price ID
    const plan = getSubscriptionPlanFromPriceId(subscription.items.data[0]?.price.id)
    
    await prisma.subscription.upsert({
      where: { stripeSubscriptionId: subscription.id },
      update: {
        status: subscription.status.toUpperCase() as any,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
      create: {
        organizationId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscription.items.data[0]?.price.id,
        status: subscription.status.toUpperCase() as any,
        plan: plan,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        eventsLimit: getEventLimitForPlan(plan),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    })

    // Update organization plan
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        plan: plan,
        planExpires: new Date(subscription.current_period_end * 1000),
      },
    })

    console.log('Successfully handled subscription created')
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Handling subscription updated:', subscription.id)

  try {
    const plan = getSubscriptionPlanFromPriceId(subscription.items.data[0]?.price.id)
    
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status.toUpperCase() as any,
        plan: plan,
        stripePriceId: subscription.items.data[0]?.price.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        eventsLimit: getEventLimitForPlan(plan),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      },
    })

    // Update organization plan
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { organizationId: true },
    })

    if (sub?.organizationId) {
      await prisma.organization.update({
        where: { id: sub.organizationId },
        data: {
          plan: plan,
          planExpires: new Date(subscription.current_period_end * 1000),
        },
      })
    }

    console.log('Successfully handled subscription updated')
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deleted:', subscription.id)

  try {
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELLED',
        canceledAt: new Date(),
      },
    })

    // Downgrade organization to free plan
    const sub = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
      select: { organizationId: true },
    })

    if (sub?.organizationId) {
      await prisma.organization.update({
        where: { id: sub.organizationId },
        data: {
          plan: 'FREE',
          planExpires: null,
        },
      })
    }

    console.log('Successfully handled subscription deleted')
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Handling payment succeeded:', invoice.id)

  try {
    // Update subscription status if it's a subscription invoice
    if (invoice.subscription) {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'ACTIVE' },
      })
    }

    console.log('Successfully handled payment succeeded')
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling payment failed:', invoice.id)

  try {
    // Update subscription status if it's a subscription invoice
    if (invoice.subscription) {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'PAST_DUE' },
      })
    }

    console.log('Successfully handled payment failed')
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout completed:', session.id)

  try {
    const metadata = session.metadata || {}
    
    // Handle ticket purchases
    if (metadata.type === 'ticket_purchase') {
      const eventId = metadata.eventId
      
      if (eventId && session.payment_intent) {
        // The actual ticket creation will be handled by the payment_intent.succeeded webhook
        console.log('Ticket purchase checkout completed for event:', eventId)
      }
    }

    console.log('Successfully handled checkout completed')
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Handling payment intent succeeded:', paymentIntent.id)

  try {
    const metadata = paymentIntent.metadata || {}
    
    // Handle ticket purchases
    if (metadata.type === 'ticket_purchase') {
      const { eventId, ticketTierId, userId, organizationId } = metadata
      
      if (eventId && ticketTierId && userId) {
        // Create ticket record
        const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
        
        await prisma.ticket.create({
          data: {
            ticketTierId,
            eventId,
            userId,
            ticketNumber,
            status: 'VALID',
            price: paymentIntent.amount,
            fees: Math.round(paymentIntent.amount * 0.029 + 30), // Stripe fees
          },
        })

        // Update ticket tier sold count
        await prisma.ticketTier.update({
          where: { id: ticketTierId },
          data: {
            sold: { increment: 1 },
          },
        })

        console.log('Successfully created ticket for payment intent:', paymentIntent.id)
      }
    }

    console.log('Successfully handled payment intent succeeded')
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Handling customer created:', customer.id)
  // Customer data is already handled in the application flow
  // This is just for logging/analytics purposes
}

// Helper functions
function getSubscriptionPlanFromPriceId(priceId?: string): 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS' {
  if (!priceId) return 'FREE'
  
  if (priceId === process.env.STRIPE_PRICE_ID_BASIC) return 'BASIC'
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'PRO'
  if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) return 'BUSINESS'
  
  return 'FREE'
}

function getEventLimitForPlan(plan: string): number {
  switch (plan) {
    case 'FREE': return 2
    case 'BASIC': return 10
    case 'PRO': return -1 // unlimited
    case 'BUSINESS': return -1 // unlimited
    default: return 2
  }
}