import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, handleSubscriptionStatusChange } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('Processing webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const previousAttributes = event.data.previous_attributes as Partial<Stripe.Subscription>;
        await handleSubscriptionStatusChange({ subscription, previousAttributes });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerCreated(customer);
        break;
      }

      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerUpdated(customer);
        break;
      }

      case 'customer.deleted': {
        const customer = event.data.object as Stripe.Customer;
        await handleCustomerDeleted(customer);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.metadata?.userId;
    const organizationId = session.metadata?.organizationId;

    if (!userId) {
      console.error('No userId in checkout session metadata');
      return;
    }

    // Update customer ID in subscription if needed
    if (session.customer && session.subscription) {
      if (organizationId) {
        await prisma.organizationSubscription.updateMany({
          where: {
            organizationId,
            stripeSubscriptionId: session.subscription as string,
          },
          data: {
            stripeCustomerId: session.customer as string,
          },
        });
      } else {
        await prisma.subscription.updateMany({
          where: {
            userId,
            stripeSubscriptionId: session.subscription as string,
          },
          data: {
            stripeCustomerId: session.customer as string,
          },
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        organizationId: organizationId || undefined,
        type: 'CHECKOUT_COMPLETED',
        description: 'Checkout session completed successfully',
        metadata: {
          sessionId: session.id,
          subscriptionId: session.subscription,
          customerId: session.customer,
          amountTotal: session.amount_total,
        },
      },
    });

    console.log('Checkout completed for user:', userId);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata.userId;
    const organizationId = subscription.metadata.organizationId;

    if (!userId) {
      console.error('No userId in subscription metadata');
      return;
    }

    // Update subscription status to cancelled
    if (organizationId) {
      await prisma.organizationSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { 
          status: 'CANCELED',
          plan: 'FREE',
          credits: 20,
          maxCredits: 20,
        },
      });
    } else {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { 
          status: 'CANCELED',
          plan: 'FREE',
          credits: 20,
          maxCredits: 20,
        },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        organizationId: organizationId || undefined,
        type: 'SUBSCRIPTION_CANCELLED',
        description: 'Subscription cancelled',
        metadata: {
          subscriptionId: subscription.id,
          cancelledAt: new Date().toISOString(),
        },
      },
    });

    console.log('Subscription cancelled for user:', userId);
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription || !invoice.customer) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const userId = subscription.metadata.userId;
    const organizationId = subscription.metadata.organizationId;

    if (!userId) return;

    // Create invoice record
    const invoiceData = {
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status || 'paid',
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    };

    if (organizationId) {
      const orgSubscription = await prisma.organizationSubscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (orgSubscription) {
        await prisma.organizationInvoice.create({
          data: {
            ...invoiceData,
            subscriptionId: orgSubscription.id,
          },
        });
      }
    } else {
      const userSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (userSubscription) {
        await prisma.invoice.create({
          data: {
            ...invoiceData,
            subscriptionId: userSubscription.id,
          },
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        organizationId: organizationId || undefined,
        type: 'PAYMENT_SUCCEEDED',
        description: `Payment succeeded for ${invoice.amount_paid / 100} ${invoice.currency.toUpperCase()}`,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        },
      },
    });

    console.log('Invoice payment succeeded for user:', userId);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    if (!invoice.subscription) return;

    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const userId = subscription.metadata.userId;
    const organizationId = subscription.metadata.organizationId;

    if (!userId) return;

    // Update subscription status
    if (organizationId) {
      await prisma.organizationSubscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    } else {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'PAST_DUE' },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        organizationId: organizationId || undefined,
        type: 'PAYMENT_FAILED',
        description: `Payment failed for ${invoice.amount_due / 100} ${invoice.currency.toUpperCase()}`,
        metadata: {
          invoiceId: invoice.id,
          amount: invoice.amount_due,
          currency: invoice.currency,
          attemptCount: invoice.attempt_count,
        },
      },
    });

    console.log('Invoice payment failed for user:', userId);
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  try {
    const userId = customer.metadata.userId;
    const organizationId = customer.metadata.organizationId;

    if (!userId) return;

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        organizationId: organizationId || undefined,
        type: 'CUSTOMER_CREATED',
        description: 'Stripe customer created',
        metadata: {
          customerId: customer.id,
          email: customer.email,
        },
      },
    });

    console.log('Customer created for user:', userId);
  } catch (error) {
    console.error('Error handling customer created:', error);
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  try {
    const userId = customer.metadata.userId;
    if (!userId) return;

    console.log('Customer updated for user:', userId);
  } catch (error) {
    console.error('Error handling customer updated:', error);
  }
}

async function handleCustomerDeleted(customer: Stripe.Customer) {
  try {
    const userId = customer.metadata.userId;
    const organizationId = customer.metadata.organizationId;

    if (!userId) return;

    // Update subscriptions to remove Stripe customer ID
    if (organizationId) {
      await prisma.organizationSubscription.updateMany({
        where: { stripeCustomerId: customer.id },
        data: { stripeCustomerId: null },
      });
    } else {
      await prisma.subscription.updateMany({
        where: { stripeCustomerId: customer.id },
        data: { stripeCustomerId: null },
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId,
        organizationId: organizationId || undefined,
        type: 'CUSTOMER_DELETED',
        description: 'Stripe customer deleted',
        metadata: {
          customerId: customer.id,
        },
      },
    });

    console.log('Customer deleted for user:', userId);
  } catch (error) {
    console.error('Error handling customer deleted:', error);
  }
}