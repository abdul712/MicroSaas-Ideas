import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const assignScheduleSchema = z.object({
  shiftId: z.string(),
  userId: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {
      shift: {
        organizationId: session.user.organizationId,
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (startDate && endDate) {
      whereClause.shift.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        shift: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            hourlyRate: true,
          },
        },
      },
      orderBy: {
        shift: {
          startTime: 'asc',
        },
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
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
    const validatedData = assignScheduleSchema.parse(body);

    // Verify shift belongs to organization
    const shift = await prisma.shift.findFirst({
      where: {
        id: validatedData.shiftId,
        organizationId: session.user.organizationId,
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found or access denied" },
        { status: 404 }
      );
    }

    // Verify user belongs to organization
    const user = await prisma.user.findFirst({
      where: {
        id: validatedData.userId,
        organizationId: session.user.organizationId,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Employee not found or access denied" },
        { status: 404 }
      );
    }

    // Check for conflicts
    const conflictingSchedule = await prisma.schedule.findFirst({
      where: {
        userId: validatedData.userId,
        shift: {
          AND: [
            {
              startTime: {
                lt: shift.endTime,
              },
            },
            {
              endTime: {
                gt: shift.startTime,
              },
            },
          ],
        },
      },
    });

    if (conflictingSchedule) {
      return NextResponse.json(
        { error: "Employee has conflicting shift during this time" },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: {
        shiftId_userId: {
          shiftId: validatedData.shiftId,
          userId: validatedData.userId,
        },
      },
    });

    if (existingSchedule) {
      return NextResponse.json(
        { error: "Employee is already assigned to this shift" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        shiftId: validatedData.shiftId,
        userId: validatedData.userId,
        status: validatedData.status || "DRAFT",
      },
      include: {
        shift: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            hourlyRate: true,
          },
        },
      },
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}