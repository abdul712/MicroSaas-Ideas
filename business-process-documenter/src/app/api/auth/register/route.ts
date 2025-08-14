import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const { name, email, password, organizationName } = await request.json();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Create organization first
    const organizationSlug = generateSlug(organizationName);
    const organization = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: organizationSlug,
        planType: "STARTER",
      },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "ADMIN",
        organizationId: organization.id,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}