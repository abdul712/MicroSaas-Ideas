import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { taskIntelligence } from '@/services/ai/task-intelligence'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  teamId: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  dueDate: z.string().datetime().optional(),
  skillRequirements: z.array(z.string()).optional(),
  storyPoints: z.number().int().min(1).max(20).optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  blockedReason: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const assigneeId = searchParams.get('assigneeId')
    const teamId = searchParams.get('teamId')
    const priority = searchParams.get('priority')

    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (teamId) where.teamId = teamId
    if (priority) where.priority = priority

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          delegator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
              skills: true,
              workloadCapacity: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          updates: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 5,
          },
          attachments: true,
          timeEntries: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // Initialize AI engine
    await taskIntelligence.initialize()

    // Create initial task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        organizationId: session.user.organizationId,
        delegatorId: session.user.id,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        skillRequirements: validatedData.skillRequirements || [],
        storyPoints: validatedData.storyPoints || 1,
      },
      include: {
        delegator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            skills: true,
            workloadCapacity: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Get AI analysis for the task
    try {
      const intelligence = await taskIntelligence.analyzeTask(task)
      
      // Update task with AI predictions
      const updatedTask = await prisma.task.update({
        where: { id: task.id },
        data: {
          complexityScore: intelligence.complexityScore,
          estimatedDuration: intelligence.estimatedDuration,
          predictedCompletion: intelligence.predictedCompletion,
          aiConfidence: intelligence.confidence,
          skillRequirements: intelligence.skillRequirements,
          dependencies: intelligence.dependencies,
          riskFactors: intelligence.riskFactors,
        },
        include: {
          delegator: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
            },
          },
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatar: true,
              skills: true,
              workloadCapacity: true,
            },
          },
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          updates: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          attachments: true,
          timeEntries: true,
        },
      })

      // Create initial task update
      await prisma.taskUpdate.create({
        data: {
          taskId: task.id,
          userId: session.user.id,
          updateType: 'STATUS_CHANGE',
          content: 'Task created with AI analysis',
          newValue: 'PENDING',
        },
      })

      // If no assignee specified and AI features enabled, get assignment suggestions
      if (!validatedData.assigneeId && session.user.organization?.aiFeatures) {
        try {
          // Get potential assignees from the team or organization
          const candidateUsers = await prisma.user.findMany({
            where: {
              organizationId: session.user.organizationId,
              isActive: true,
              id: { not: session.user.id }, // Exclude delegator
              ...(validatedData.teamId && {
                teamMemberships: {
                  some: {
                    teamId: validatedData.teamId,
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

          if (candidateUsers.length > 0) {
            const suggestions = await taskIntelligence.getAssignmentSuggestions(
              updatedTask,
              candidateUsers,
              session.user.organizationId
            )

            // Create AI insight
            await prisma.aiInsight.create({
              data: {
                organizationId: session.user.organizationId,
                insightType: 'OPTIMIZATION_SUGGESTION',
                subjectId: task.id,
                subjectType: 'task',
                confidence: suggestions.confidence,
                data: suggestions,
                actionable: true,
              },
            })
          }
        } catch (aiError) {
          console.error('AI assignment suggestion error:', aiError)
          // Continue without AI suggestions
        }
      }

      return NextResponse.json(updatedTask, { status: 201 })
    } catch (aiError) {
      console.error('AI analysis error:', aiError)
      // Return task without AI analysis if AI fails
      return NextResponse.json(task, { status: 201 })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const validatedData = updateTaskSchema.parse(updateData)

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 })
    }

    // Check if user has permission to update this task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        delegatorId: true,
        assigneeId: true,
        organizationId: true,
        status: true,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (
      existingTask.organizationId !== session.user.organizationId ||
      (existingTask.delegatorId !== session.user.id && existingTask.assigneeId !== session.user.id)
    ) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Track changes for audit log
    const changes: Record<string, any> = {}
    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        changes[key] = value
      }
    })

    // Update the task
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        ...(validatedData.status === 'COMPLETED' && { completedAt: new Date() }),
        ...(validatedData.status === 'BLOCKED' && validatedData.blockedReason && { blockedAt: new Date() }),
        updatedAt: new Date(),
      },
      include: {
        delegator: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            skills: true,
            workloadCapacity: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        updates: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        attachments: true,
        timeEntries: true,
      },
    })

    // Create update log
    for (const [key, value] of Object.entries(changes)) {
      await prisma.taskUpdate.create({
        data: {
          taskId: id,
          userId: session.user.id,
          updateType: key.toUpperCase().includes('STATUS') ? 'STATUS_CHANGE' : 
                     key.toUpperCase().includes('ASSIGNMENT') ? 'ASSIGNMENT' :
                     key.toUpperCase().includes('PRIORITY') ? 'PRIORITY_CHANGE' :
                     key.toUpperCase().includes('DUE') ? 'DUE_DATE_CHANGE' : 'COMMENT',
          content: `Updated ${key}`,
          previousValue: key in existingTask ? String(existingTask[key as keyof typeof existingTask]) : undefined,
          newValue: String(value),
        },
      })
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}