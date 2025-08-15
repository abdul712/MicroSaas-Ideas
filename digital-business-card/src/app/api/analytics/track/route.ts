import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const trackViewSchema = z.object({
  cardId: z.string(),
  viewerIp: z.string().optional(),
  userAgent: z.string().optional(),
  location: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional(),
  }).optional(),
  device: z.enum(['mobile', 'desktop', 'tablet']).optional(),
  referrer: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = trackViewSchema.parse(body);

    // Verify card exists
    const card = await prisma.card.findUnique({
      where: { id: validatedData.cardId },
      select: { id: true },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Create view record
    const cardView = await prisma.cardView.create({
      data: {
        cardId: validatedData.cardId,
        viewerIp: validatedData.viewerIp,
        userAgent: validatedData.userAgent,
        location: validatedData.location,
        device: validatedData.device,
        referrer: validatedData.referrer,
        timestamp: new Date(),
      },
    });

    // Update daily analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.analytics.upsert({
      where: {
        cardId_metricType_date: {
          cardId: validatedData.cardId,
          metricType: 'views',
          date: today,
        },
      },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        cardId: validatedData.cardId,
        userId: card.id, // This should be the actual userId
        metricType: 'views',
        value: 1,
        date: today,
      },
    });

    return NextResponse.json({ success: true, viewId: cardView.id });
  } catch (error) {
    console.error('Error tracking view:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}