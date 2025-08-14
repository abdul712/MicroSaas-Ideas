import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { analyzeFeedback } from '@/lib/ai-analysis'

const submitFeedbackSchema = z.object({
  projectId: z.string().cuid('Invalid project ID'),
  widgetId: z.string().cuid('Invalid widget ID').optional(),
  formId: z.string().cuid('Invalid form ID').optional(),
  type: z.enum(['RATING', 'TEXT', 'NPS', 'CSAT', 'CES', 'SURVEY', 'BUG_REPORT', 'FEATURE_REQUEST']),
  content: z.string().min(1, 'Content is required'),
  rating: z.number().min(1).max(10).optional(),
  metadata: z.record(z.any()).optional(),
  source: z.enum(['WIDGET', 'FORM', 'EMAIL', 'API', 'SMS', 'INTEGRATION']).default('WIDGET'),
  customer: z.object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    phone: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = submitFeedbackSchema.parse(body)

    // Verify project exists and is active
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        status: 'ACTIVE',
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or inactive' },
        { status: 404 }
      )
    }

    // Create or find customer if provided
    let customerId = null
    if (data.customer?.email) {
      const customer = await prisma.customer.upsert({
        where: { email: data.customer.email },
        update: {
          name: data.customer.name || undefined,
          phone: data.customer.phone || undefined,
          metadata: data.customer.metadata || {},
        },
        create: {
          email: data.customer.email,
          name: data.customer.name,
          phone: data.customer.phone,
          metadata: data.customer.metadata || {},
        },
      })
      customerId = customer.id
    }

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        projectId: data.projectId,
        widgetId: data.widgetId,
        formId: data.formId,
        type: data.type,
        content: data.content,
        rating: data.rating,
        metadata: data.metadata || {},
        source: data.source,
        customerId,
        status: 'NEW',
      },
      include: {
        customer: true,
        project: true,
      },
    })

    // Trigger AI analysis asynchronously
    if (project.settings?.autoAnalysis !== false) {
      analyzeFeedback(feedback.id).catch(console.error)
    }

    // Update usage metrics
    await prisma.usageMetric.upsert({
      where: {
        orgId_metric_period: {
          orgId: project.orgId,
          metric: 'FEEDBACK_COLLECTED',
          period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        },
      },
      update: {
        value: {
          increment: 1,
        },
      },
      create: {
        orgId: project.orgId,
        metric: 'FEEDBACK_COLLECTED',
        value: 1,
        period: new Date().toISOString().slice(0, 7),
      },
    })

    return NextResponse.json({
      message: 'Feedback submitted successfully',
      feedback: {
        id: feedback.id,
        type: feedback.type,
        createdAt: feedback.createdAt,
      },
    })
  } catch (error) {
    console.error('Submit feedback error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sentiment = searchParams.get('sentiment')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    const skip = (page - 1) * limit

    const where: any = {
      projectId,
    }

    if (sentiment) {
      where.sentiment = sentiment.toUpperCase()
    }

    if (type) {
      where.type = type.toUpperCase()
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [feedback, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          customer: true,
          analysis: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.feedback.count({ where }),
    ])

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get feedback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}