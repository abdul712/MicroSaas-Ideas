import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma, handlePrismaError } from '@/lib/prisma';

const updateContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string().uuid().optional(),
  leadSource: z.string().optional(),
  status: z.enum(['active', 'inactive', 'unqualified']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  socialLinkedin: z.string().url().optional(),
  socialTwitter: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  ownerId: z.string().uuid().optional(),
});

// GET /api/contacts/[id] - Get a specific contact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const contactId = params.id;

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: user.tenantId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            website: true,
            phone: true,
            email: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        deals: {
          include: {
            pipelineStage: {
              select: {
                id: true,
                name: true,
                colorHex: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        activities: {
          include: {
            creator: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
        tasks: {
          where: {
            status: {
              not: 'completed',
            },
          },
          include: {
            assignee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            dueDate: 'asc',
          },
        },
        _count: {
          select: {
            deals: true,
            activities: true,
            tasks: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);

  } catch (error) {
    console.error('Get contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const contactId = params.id;
    const body = await request.json();

    // Validate input
    const validatedData = updateContactSchema.parse(body);

    // Check if contact exists and belongs to tenant
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: user.tenantId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check if company exists (if provided)
    if (validatedData.companyId) {
      const company = await prisma.company.findFirst({
        where: {
          id: validatedData.companyId,
          tenantId: user.tenantId,
        },
      });

      if (!company) {
        return NextResponse.json(
          { error: 'Company not found' },
          { status: 404 }
        );
      }
    }

    // Check if new owner exists (if provided)
    if (validatedData.ownerId) {
      const owner = await prisma.user.findFirst({
        where: {
          id: validatedData.ownerId,
          tenantId: user.tenantId,
          isActive: true,
        },
      });

      if (!owner) {
        return NextResponse.json(
          { error: 'Owner not found' },
          { status: 404 }
        );
      }
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        ...validatedData,
        updatedBy: user.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            deals: true,
            activities: true,
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json(contact);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    // Handle Prisma errors
    const prismaError = handlePrismaError(error);
    if (prismaError.error) {
      return NextResponse.json(prismaError, { status: 400 });
    }

    console.error('Update contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const contactId = params.id;

    // Check if contact exists and belongs to tenant
    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        tenantId: user.tenantId,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Delete contact (cascade will handle related records)
    await prisma.contact.delete({
      where: {
        id: contactId,
      },
    });

    return NextResponse.json({ message: 'Contact deleted successfully' });

  } catch (error) {
    // Handle Prisma errors
    const prismaError = handlePrismaError(error);
    if (prismaError.error) {
      return NextResponse.json(prismaError, { status: 400 });
    }

    console.error('Delete contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}