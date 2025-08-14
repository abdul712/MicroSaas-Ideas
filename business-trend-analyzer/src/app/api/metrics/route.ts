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

    const metrics = await prisma.metric.findMany({
      where: {
        organizationId,
        isActive: true
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true
          }
        },
        _count: {
          select: {
            timeSeriesData: true,
            trends: true,
            predictions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching metrics:', error)
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
      dataSourceId, 
      name, 
      category, 
      unit, 
      aggregationType,
      isCurrency 
    } = body

    if (!organizationId || !name || !category) {
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

    const metric = await prisma.metric.create({
      data: {
        organizationId,
        dataSourceId: dataSourceId || null,
        name,
        category,
        unit: unit || null,
        aggregationType: aggregationType || 'sum',
        isCurrency: isCurrency || false
      },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true
          }
        }
      }
    })

    return NextResponse.json(metric, { status: 201 })
  } catch (error) {
    console.error('Error creating metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}