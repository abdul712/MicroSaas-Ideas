import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/utils';
import { z } from 'zod';

const createCardSchema = z.object({
  templateId: z.string(),
  fields: z.array(z.object({
    fieldType: z.enum(['name', 'title', 'company', 'phone', 'email', 'website', 'social', 'address', 'bio', 'custom']),
    label: z.string(),
    value: z.string(),
    order: z.number(),
    isVisible: z.boolean().default(true),
  })),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cards = await prisma.card.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        template: true,
        fields: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            views: true,
            connections: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ cards });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCardSchema.parse(body);

    // Generate unique slug
    let slug = generateSlug();
    let existing = await prisma.card.findUnique({ where: { slug } });
    
    while (existing) {
      slug = generateSlug();
      existing = await prisma.card.findUnique({ where: { slug } });
    }

    // Create card with fields
    const card = await prisma.card.create({
      data: {
        userId: session.user.id,
        templateId: validatedData.templateId,
        slug,
        fields: {
          create: validatedData.fields,
        },
      },
      include: {
        template: true,
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error('Error creating card:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}