import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const type = searchParams.get('type') // opportunity, risk, anomaly, etc.
    const severity = searchParams.get('severity') // critical, high, medium, low
    const limit = parseInt(searchParams.get('limit') || '50')
    const showDismissed = searchParams.get('showDismissed') === 'true'

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const where: any = {
      organizationId,
      isDismissed: showDismissed ? undefined : false
    }

    if (type) {
      where.type = type
    }

    if (severity) {
      where.severity = severity
    }

    const insights = await prisma.insight.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' }, // Critical first
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Group insights by type for better organization
    const groupedInsights = insights.reduce((acc, insight) => {
      if (!acc[insight.type]) {
        acc[insight.type] = []
      }
      acc[insight.type].push(insight)
      return acc
    }, {} as Record<string, typeof insights>)

    return NextResponse.json({
      insights,
      groupedInsights,
      counts: {
        total: insights.length,
        critical: insights.filter(i => i.severity === 'critical').length,
        high: insights.filter(i => i.severity === 'high').length,
        medium: insights.filter(i => i.severity === 'medium').length,
        low: insights.filter(i => i.severity === 'low').length,
      }
    })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      organizationId, 
      type, 
      severity, 
      title, 
      description,
      metrics,
      recommendations,
      potentialImpact
    } = body

    if (!organizationId || !type || !severity || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify user has access to this organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: session.user.id
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const insight = await prisma.insight.create({
      data: {
        organizationId,
        userId: session.user.id,
        type,
        severity,
        title,
        description,
        metrics: metrics || {},
        recommendations: recommendations || {},
        potentialImpact: potentialImpact || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(insight, { status: 201 })
  } catch (error) {
    console.error('Error creating insight:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}