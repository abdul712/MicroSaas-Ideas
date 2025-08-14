import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  businessName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, businessName } = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and business in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: UserRole.OWNER,
        },
      });

      // Create default business if provided
      let business = null;
      if (businessName) {
        business = await tx.business.create({
          data: {
            name: businessName,
            userId: user.id,
          },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: "USER_REGISTRATION",
          resource: "USER",
          resourceId: user.id,
          newData: {
            email: user.email,
            name: user.name,
            businessName: businessName || null,
          },
        },
      });

      return { user, business };
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        business: result.business ? {
          id: result.business.id,
          name: result.business.name,
        } : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}