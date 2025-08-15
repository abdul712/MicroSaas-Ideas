import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const insightId = params.id

    // Get the insight and verify access
    const insight = await prisma.insight.findFirst({
      where: {
        id: insightId,
        organization: {
          members: {
            some: {
              userId: session.user.id
            }
          }
        }
      }
    })

    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
    }

    // Toggle dismissed status
    const updatedInsight = await prisma.insight.update({
      where: { id: insightId },
      data: {
        isDismissed: !insight.isDismissed,
        dismissedAt: insight.isDismissed ? null : new Date()
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

    return NextResponse.json(updatedInsight)
  } catch (error) {
    console.error('Error updating insight:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}