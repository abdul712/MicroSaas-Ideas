import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { prisma, handlePrismaError, createListQuery } from '@/lib/prisma';

const createContactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  companyId: z.string().uuid().optional(),
  leadSource: z.string().optional(),
  status: z.enum(['active', 'inactive', 'unqualified']).default('active'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  socialLinkedin: z.string().url().optional(),
  socialTwitter: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  customFields: z.record(z.any()).default({}),
});

const listContactsSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.string().optional(),
  ownerId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  tags: z.string().optional(), // comma-separated tags
});

// GET /api/contacts - List contacts with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedParams = listContactsSchema.parse(queryParams);

    // Build filters
    const filters: any = {};
    
    if (validatedParams.status) {
      filters.status = validatedParams.status;
    }
    
    if (validatedParams.ownerId) {
      filters.ownerId = validatedParams.ownerId;
    }
    
    if (validatedParams.companyId) {
      filters.companyId = validatedParams.companyId;
    }
    
    if (validatedParams.tags) {
      const tagArray = validatedParams.tags.split(',').map(tag => tag.trim());
      filters.tags = {
        hasSome: tagArray,
      };
    }

    // Create query with tenant scoping
    const query = createListQuery(user.tenantId, {
      page: validatedParams.page,
      limit: validatedParams.limit,
      search: validatedParams.search,
      sortBy: validatedParams.sortBy,
      sortOrder: validatedParams.sortOrder,
      filters,
    });

    // Override search to include more fields
    if (validatedParams.search) {
      query.where.OR = [
        { firstName: { contains: validatedParams.search, mode: 'insensitive' } },
        { lastName: { contains: validatedParams.search, mode: 'insensitive' } },
        { email: { contains: validatedParams.search, mode: 'insensitive' } },
        { phone: { contains: validatedParams.search, mode: 'insensitive' } },
        { mobile: { contains: validatedParams.search, mode: 'insensitive' } },
        { jobTitle: { contains: validatedParams.search, mode: 'insensitive' } },
        { company: { name: { contains: validatedParams.search, mode: 'insensitive' } } },
      ];
    }

    // Execute query with relations
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        ...query,
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
      }),
      prisma.contact.count({
        where: query.where,
      }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        page: validatedParams.page || 1,
        limit: validatedParams.limit || 10,
        total,
        pages: Math.ceil(total / (validatedParams.limit || 10)),
      },
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const body = await request.json();
    
    // Validate input
    const validatedData = createContactSchema.parse(body);

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

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        tenantId: user.tenantId,
        createdBy: user.id,
        ownerId: user.id, // Default to creator as owner
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

    return NextResponse.json(contact, { status: 201 });

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

    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}