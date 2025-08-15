import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, createCustomer, STRIPE_PLANS, isValidPlan } from '@/lib/stripe';
import { z } from 'zod';

const createCheckoutSchema = z.object({
  plan: z.string().refine(isValidPlan, 'Invalid plan'),
  organizationId: z.string().optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createCheckoutSchema.parse(body);

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        subscription: true,
        organizationMemberships: validatedData.organizationId ? {
          where: { organizationId: validatedData.organizationId },
          include: {
            organization: {
              include: {
                subscription: true,
              },
            },
          },
        } : false,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check permissions for organization billing
    if (validatedData.organizationId) {
      const membership = user.organizationMemberships.find(
        m => m.organizationId === validatedData.organizationId
      );

      if (!membership || !['owner', 'admin'].includes(membership.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions for organization billing' },
          { status: 403 }
        );
      }
    }

    const plan = STRIPE_PLANS[validatedData.plan as keyof typeof STRIPE_PLANS];
    
    if (!plan.priceId) {
      return NextResponse.json(
        { error: 'Invalid plan - no price ID' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    if (validatedData.organizationId) {
      const orgSubscription = user.organizationMemberships[0]?.organization.subscription;
      if (orgSubscription?.stripeCustomerId) {
        stripeCustomerId = orgSubscription.stripeCustomerId;
      } else {
        const organization = user.organizationMemberships[0]?.organization;
        const customer = await createCustomer({
          email: user.email,
          name: organization?.name,
          userId: session.user.id,
          organizationId: validatedData.organizationId,
        });
        stripeCustomerId = customer.id;
      }
    } else {
      if (user.subscription?.stripeCustomerId) {
        stripeCustomerId = user.subscription.stripeCustomerId;
      } else {
        const customer = await createCustomer({
          email: user.email,
          name: user.name || undefined,
          userId: session.user.id,
        });
        stripeCustomerId = customer.id;
      }
    }

    // Create checkout session
    const baseUrl = request.headers.get('origin') || process.env.APP_URL || 'http://localhost:3000';
    
    const checkoutSession = await createCheckoutSession({
      priceId: plan.priceId,
      customerId: stripeCustomerId,
      userId: session.user.id,
      organizationId: validatedData.organizationId,
      successUrl: validatedData.successUrl || `${baseUrl}/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: validatedData.cancelUrl || `${baseUrl}/dashboard/billing/cancel`,
      trialDays: 14,
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        organizationId: validatedData.organizationId,
        type: 'CHECKOUT_INITIATED',
        description: `Started checkout for ${plan.name} plan`,
        metadata: {
          plan: validatedData.plan,
          sessionId: checkoutSession.id,
          amount: plan.price,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        url: checkoutSession.url,
      },
    });

  } catch (error) {
    console.error('Create checkout error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}