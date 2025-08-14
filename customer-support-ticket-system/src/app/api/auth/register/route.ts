import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { generateId, slugify, isValidEmail } from '@/lib/utils'

const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2).max(100).optional(),
  organizationSlug: z.string().min(2).max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, organizationName, organizationSlug } = registerSchema.parse(body)

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Generate organization slug
    const orgSlug = organizationSlug || slugify(organizationName || `${name}'s Organization`)
    
    // Check if organization slug is available
    const existingOrg = await prisma.organization.findUnique({
      where: { slug: orgSlug },
    })

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already taken' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName || `${name}'s Organization`,
          slug: orgSlug,
          description: 'Customer support organization',
          settings: {
            timezone: 'UTC',
            businessHours: {
              start: '09:00',
              end: '17:00',
              days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            },
            notifications: {
              email: true,
              slack: false,
              webhook: false,
            },
          },
        },
      })

      // Create admin user
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash: hashedPassword,
          role: 'ADMIN',
          organizationId: organization.id,
        },
      })

      // Create default team
      await tx.team.create({
        data: {
          name: 'Support Team',
          description: 'Main support team',
          organizationId: organization.id,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: 'LEAD',
            },
          },
        },
      })

      // Create default tags
      const defaultTags = [
        { name: 'Bug', color: '#ef4444' },
        { name: 'Feature Request', color: '#3b82f6' },
        { name: 'Question', color: '#10b981' },
        { name: 'Urgent', color: '#f59e0b' },
      ]

      await tx.tag.createMany({
        data: defaultTags.map(tag => ({
          ...tag,
          organizationId: organization.id,
        })),
      })

      // Create default SLA rules
      await tx.sLARule.createMany({
        data: [
          {
            name: 'Urgent Priority',
            priority: 'URGENT',
            firstResponseMinutes: 60, // 1 hour
            resolutionMinutes: 240, // 4 hours
            organizationId: organization.id,
          },
          {
            name: 'High Priority',
            priority: 'HIGH',
            firstResponseMinutes: 240, // 4 hours
            resolutionMinutes: 480, // 8 hours
            organizationId: organization.id,
          },
          {
            name: 'Normal Priority',
            priority: 'NORMAL',
            firstResponseMinutes: 480, // 8 hours
            resolutionMinutes: 1440, // 24 hours
            organizationId: organization.id,
          },
          {
            name: 'Low Priority',
            priority: 'LOW',
            firstResponseMinutes: 1440, // 24 hours
            resolutionMinutes: 4320, // 72 hours
            organizationId: organization.id,
          },
        ],
      })

      // Create default canned responses
      const defaultCannedResponses = [
        {
          title: 'Welcome Message',
          content: 'Thank you for contacting our support team. We have received your request and will get back to you shortly.',
          shortcut: 'welcome',
        },
        {
          title: 'Issue Resolved',
          content: 'Great news! We have resolved your issue. Please let us know if you need any further assistance.',
          shortcut: 'resolved',
        },
        {
          title: 'More Information Needed',
          content: 'To better assist you, could you please provide more details about the issue you\'re experiencing?',
          shortcut: 'moreinfo',
        },
      ]

      await tx.cannedResponse.createMany({
        data: defaultCannedResponses.map(response => ({
          ...response,
          organizationId: organization.id,
          createdById: user.id,
        })),
      })

      return { organization, user }
    })

    return NextResponse.json({
      message: 'Account created successfully',
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}