import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { constructWebhookEvent, formatAmountFromStripe } from '@/lib/stripe'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata.invoiceId
    
    if (!invoiceId) {
      console.error('No invoice ID in payment intent metadata')
      return
    }

    // Find the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, user: true },
    })

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`)
      return
    }

    const paymentAmount = formatAmountFromStripe(
      paymentIntent.amount_received,
      paymentIntent.currency
    )

    // Create payment record and update invoice
    await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          userId: invoice.userId,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          amount: paymentAmount,
          currency: paymentIntent.currency.toUpperCase(),
          method: 'STRIPE',
          status: 'COMPLETED',
          stripePaymentId: paymentIntent.id,
          transactionId: paymentIntent.latest_charge as string,
          paidDate: new Date(),
          processedDate: new Date(),
          metadata: {
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge,
          },
        },
      })

      // Update invoice
      const newPaidAmount = Number(invoice.paidAmount) + paymentAmount
      const newDueAmount = Number(invoice.total) - newPaidAmount
      const isFullyPaid = newDueAmount <= 0

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: Math.max(0, newDueAmount),
          status: isFullyPaid ? 'PAID' : invoice.status,
          paidDate: isFullyPaid ? new Date() : invoice.paidDate,
        },
      })

      // Create notification
      await tx.notification.create({
        data: {
          userId: invoice.userId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: `Payment of ${paymentAmount} ${paymentIntent.currency.toUpperCase()} received for invoice ${invoice.invoiceNumber}`,
          data: {
            invoiceId: invoice.id,
            paymentAmount,
            currency: paymentIntent.currency.toUpperCase(),
          },
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: invoice.userId,
          action: 'PAYMENT_RECEIVED',
          entity: 'Payment',
          entityId: invoice.id,
          details: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            amount: paymentAmount,
            currency: paymentIntent.currency.toUpperCase(),
            method: 'STRIPE',
            stripePaymentIntentId: paymentIntent.id,
          },
        },
      })
    })

    console.log(`Payment processed successfully for invoice ${invoice.invoiceNumber}`)

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    const invoiceId = paymentIntent.metadata.invoiceId
    
    if (!invoiceId) {
      console.error('No invoice ID in payment intent metadata')
      return
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { user: true },
    })

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId}`)
      return
    }

    // Create notification about failed payment
    await prisma.notification.create({
      data: {
        userId: invoice.userId,
        type: 'PAYMENT_FAILED',
        title: 'Payment Failed',
        message: `Payment failed for invoice ${invoice.invoiceNumber}. Client may need to try again.`,
        data: {
          invoiceId: invoice.id,
          stripePaymentIntentId: paymentIntent.id,
          failureReason: paymentIntent.last_payment_error?.message,
        },
      },
    })

    console.log(`Payment failed for invoice ${invoice.invoiceNumber}`)

  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const invoiceId = session.metadata?.invoiceId
    
    if (!invoiceId) {
      console.error('No invoice ID in checkout session metadata')
      return
    }

    // The payment intent succeeded event will handle the actual payment processing
    // This is just for additional tracking if needed
    console.log(`Checkout session completed for invoice ${invoiceId}`)

  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}