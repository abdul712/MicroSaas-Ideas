import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createShiftSchema = z.object({
  title: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  roleRequired: z.string().optional(),
  minStaff: z.number().min(1).default(1),
  maxStaff: z.number().min(1).default(1),
  description: z.string().optional(),
  locationId: z.string(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.object({
    frequency: z.enum(["daily", "weekly", "monthly"]),
    interval: z.number().min(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  color: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const locationId = searchParams.get("locationId");

    const whereClause: any = {
      organizationId: session.user.organizationId,
    };

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (locationId) {
      whereClause.locationId = locationId;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        schedules: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json({ shifts });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createShiftSchema.parse(body);

    // Validate that location belongs to the organization
    const location = await prisma.location.findFirst({
      where: {
        id: validatedData.locationId,
        organizationId: session.user.organizationId,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: "Location not found or access denied" },
        { status: 404 }
      );
    }

    // Validate shift times
    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: "End time must be after start time" },
        { status: 400 }
      );
    }

    const shift = await prisma.shift.create({
      data: {
        title: validatedData.title,
        startTime,
        endTime,
        roleRequired: validatedData.roleRequired,
        minStaff: validatedData.minStaff,
        maxStaff: validatedData.maxStaff,
        description: validatedData.description,
        locationId: validatedData.locationId,
        organizationId: session.user.organizationId,
        isRecurring: validatedData.isRecurring,
        recurringPattern: validatedData.recurringPattern || null,
        color: validatedData.color,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        schedules: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ shift });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating shift:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}