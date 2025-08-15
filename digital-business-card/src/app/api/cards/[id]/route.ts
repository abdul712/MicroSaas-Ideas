import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCardSchema = z.object({
  fields: z.array(z.object({
    id: z.string().optional(),
    fieldType: z.enum(['name', 'title', 'company', 'phone', 'email', 'website', 'social', 'address', 'bio', 'custom']),
    label: z.string(),
    value: z.string(),
    order: z.number(),
    isVisible: z.boolean().default(true),
  })).optional(),
  isPrimary: z.boolean().optional(),
  isActive: z.boolean().optional(),
  customCss: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const card = await prisma.card.findUnique({
      where: { id: params.id },
      include: {
        template: true,
        fields: {
          orderBy: { order: 'asc' },
        },
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateCardSchema.parse(body);

    // Verify card ownership
    const existingCard = await prisma.card.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingCard || existingCard.userId !== session.user.id) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    // Update card
    const updateData: any = {};
    
    if (validatedData.isPrimary !== undefined) updateData.isPrimary = validatedData.isPrimary;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.customCss !== undefined) updateData.customCss = validatedData.customCss;

    const card = await prisma.card.update({
      where: { id: params.id },
      data: updateData,
      include: {
        template: true,
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    // Update fields if provided
    if (validatedData.fields) {
      // Delete existing fields and create new ones
      await prisma.cardField.deleteMany({
        where: { cardId: params.id },
      });

      await prisma.cardField.createMany({
        data: validatedData.fields.map(field => ({
          cardId: params.id,
          fieldType: field.fieldType,
          label: field.label,
          value: field.value,
          order: field.order,
          isVisible: field.isVisible,
        })),
      });
    }

    return NextResponse.json({ card });
  } catch (error) {
    console.error('Error updating card:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify card ownership
    const existingCard = await prisma.card.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });

    if (!existingCard || existingCard.userId !== session.user.id) {
      return NextResponse.json({ error: 'Card not found or unauthorized' }, { status: 404 });
    }

    await prisma.card.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}