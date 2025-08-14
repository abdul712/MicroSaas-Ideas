import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPaymentIntent } from '@/lib/stripe'
import { z } from 'zod'

const createPaymentIntentSchema = z.object({
  invoiceId: z.string().cuid('Invalid invoice ID'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createPaymentIntentSchema.parse(body)

    const { invoiceId, amount, currency } = validatedData

    // Find the invoice and verify it exists
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        user: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Verify the amount matches the due amount
    if (Number(invoice.dueAmount) !== amount) {
      return NextResponse.json(
        { success: false, error: 'Payment amount does not match invoice due amount' },
        { status: 400 }
      )
    }

    // Create payment intent with Stripe
    const paymentIntent = await createPaymentIntent(
      amount,
      currency,
      {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: invoice.client.email,
        userEmail: invoice.user.email,
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
      }
    })

  } catch (error) {
    console.error('Create payment intent error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}