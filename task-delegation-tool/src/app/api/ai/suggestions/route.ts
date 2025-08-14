import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { taskIntelligence } from '@/services/ai/task-intelligence'
import { z } from 'zod'

const suggestionSchema = z.object({
  taskId: z.string(),
  candidateUserIds: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if organization has AI features enabled
    const organization = await prisma.organization.findUnique({
      where: { id: session.user.organizationId },
      select: { aiFeatures: true, planType: true },
    })

    if (!organization?.aiFeatures) {
      return NextResponse.json({ 
        error: 'AI features not available for this organization plan' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { taskId, candidateUserIds } = suggestionSchema.parse(body)

    // Get the task
    const task = await prisma.task.findUnique({
      where: { 
        id: taskId,
        organizationId: session.user.organizationId,
      },
      include: {
        team: true,
        delegator: true,
        assignee: true,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check permission
    if (task.delegatorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Get candidate users
    let candidateUsers
    if (candidateUserIds && candidateUserIds.length > 0) {
      candidateUsers = await prisma.user.findMany({
        where: {
          id: { in: candidateUserIds },
          organizationId: session.user.organizationId,
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          skills: true,
          productivityScore: true,
          workloadCapacity: true,
          averageTaskTime: true,
          completionRate: true,
          qualityScore: true,
          collaborationScore: true,
          cognitiveLoadThreshold: true,
        },
      })
    } else {
      // Get all potential assignees from team or organization
      candidateUsers = await prisma.user.findMany({
        where: {
          organizationId: session.user.organizationId,
          isActive: true,
          id: { not: session.user.id }, // Exclude delegator
          ...(task.teamId && {
            teamMemberships: {
              some: {
                teamId: task.teamId,
              },
            },
          }),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
          skills: true,
          productivityScore: true,
          workloadCapacity: true,
          averageTaskTime: true,
          completionRate: true,
          qualityScore: true,
          collaborationScore: true,
          cognitiveLoadThreshold: true,
        },
      })
    }

    if (candidateUsers.length === 0) {
      return NextResponse.json({ 
        error: 'No candidate users available for assignment suggestions' 
      }, { status: 400 })
    }

    // Initialize AI engine and get suggestions
    await taskIntelligence.initialize()
    const suggestions = await taskIntelligence.getAssignmentSuggestions(
      task,
      candidateUsers,
      session.user.organizationId
    )

    // Get workload analysis for suggested assignee
    let workloadAnalysis = null
    if (suggestions.suggestedAssignee) {
      try {
        workloadAnalysis = await taskIntelligence.analyzeWorkload(
          suggestions.suggestedAssignee,
          session.user.organizationId
        )
      } catch (error) {
        console.error('Error analyzing workload:', error)
      }
    }

    // Get cognitive load analysis for suggested assignee
    let cognitiveLoad = null
    if (suggestions.suggestedAssignee) {
      try {
        cognitiveLoad = await taskIntelligence.calculateCognitiveLoad(
          suggestions.suggestedAssignee,
          session.user.organizationId
        )
      } catch (error) {
        console.error('Error calculating cognitive load:', error)
      }
    }

    // Store AI insight
    await prisma.aiInsight.create({
      data: {
        organizationId: session.user.organizationId,
        insightType: 'OPTIMIZATION_SUGGESTION',
        subjectId: taskId,
        subjectType: 'task',
        confidence: suggestions.confidence,
        data: {
          suggestions,
          workloadAnalysis,
          cognitiveLoad,
          generatedAt: new Date().toISOString(),
        },
        actionable: true,
      },
    })

    return NextResponse.json({
      suggestions,
      workloadAnalysis,
      cognitiveLoad,
      metadata: {
        candidateCount: candidateUsers.length,
        aiConfidence: suggestions.confidence,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error generating AI suggestions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const insightType = searchParams.get('type')

    // Get recent AI insights for the organization
    const where: any = {
      organizationId: session.user.organizationId,
      dismissed: false,
    }

    if (userId) where.subjectId = userId
    if (insightType) where.insightType = insightType

    const insights = await prisma.aiInsight.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching AI insights:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}