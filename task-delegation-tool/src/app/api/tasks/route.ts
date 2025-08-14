import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AITaskService } from '@/ai/task-intelligence'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  projectId: z.string().optional(),
  teamId: z.string().optional(),
  assigneeId: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).default('medium'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  skillsRequired: z.array(z.string()).default([]),
  estimatedHours: z.number().positive().optional(),
})

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'blocked', 'completed', 'cancelled']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigneeId = searchParams.get('assigneeId')
    const projectId = searchParams.get('projectId')
    const teamId = searchParams.get('teamId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build filter conditions
    const where: any = {
      organizationId: session.user.organizationId,
    }

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (projectId) where.projectId = projectId
    if (teamId) where.teamId = teamId
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get tasks with AI insights
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, avatar: true }
          },
          assignee: {
            select: { id: true, name: true, email: true, avatar: true, skills: true, capacityHours: true }
          },
          project: {
            select: { id: true, name: true, status: true }
          },
          team: {
            select: { id: true, name: true }
          },
          updates: {
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          comments: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          _count: {
            select: { comments: true, updates: true }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ])

    // Add AI insights for each task
    const tasksWithAI = await Promise.all(
      tasks.map(async (task) => {
        try {
          const aiInsights = await AITaskService.getTaskInsights(task)
          return {
            ...task,
            aiInsights,
          }
        } catch (error) {
          console.error('Failed to get AI insights for task:', task.id, error)
          return {
            ...task,
            aiInsights: null,
          }
        }
      })
    )

    return NextResponse.json({
      tasks: tasksWithAI,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })

  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // AI-powered assignee suggestion if not provided
    let finalAssigneeId = validatedData.assigneeId
    if (!finalAssigneeId && validatedData.skillsRequired.length > 0) {
      const suggestion = await AITaskService.suggestAssignee({
        organizationId: session.user.organizationId,
        skillsRequired: validatedData.skillsRequired,
        priority: validatedData.priority,
        estimatedHours: validatedData.estimatedHours,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      })
      
      finalAssigneeId = suggestion?.userId
    }

    // AI complexity analysis
    const complexityAnalysis = await AITaskService.analyzeComplexity({
      title: validatedData.title,
      description: validatedData.description || '',
      skillsRequired: validatedData.skillsRequired,
    })

    // Create task
    const task = await prisma.task.create({
      data: {
        ...validatedData,
        assigneeId: finalAssigneeId,
        organizationId: session.user.organizationId,
        creatorId: session.user.id,
        complexity: complexityAnalysis.complexity,
        confidenceScore: complexityAnalysis.confidence,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        tags: validatedData.tags,
        skillsRequired: validatedData.skillsRequired,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true }
        },
        team: {
          select: { id: true, name: true }
        },
      },
    })

    // Create delegation record if assigned
    if (finalAssigneeId && finalAssigneeId !== session.user.id) {
      const matchScore = await AITaskService.calculateMatchScore(task.id, finalAssigneeId)
      
      await prisma.delegation.create({
        data: {
          taskId: task.id,
          delegatorId: session.user.id,
          assigneeId: finalAssigneeId,
          matchScore: matchScore.overall,
          riskScore: matchScore.riskScore,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'task_created',
        resource: 'task',
        resourceId: task.id,
        metadata: {
          title: task.title,
          assigneeId: finalAssigneeId,
          priority: task.priority,
          aiAssigned: !validatedData.assigneeId && !!finalAssigneeId,
        },
      },
    })

    // Get AI insights for the new task
    const aiInsights = await AITaskService.getTaskInsights(task)

    return NextResponse.json({
      ...task,
      aiInsights,
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('id')
    
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignee: true, creator: true }
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (existingTask.organizationId !== session.user.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check permissions for update
    const canUpdate = 
      existingTask.creatorId === session.user.id ||
      existingTask.assigneeId === session.user.id ||
      ['admin', 'manager'].includes(session.user.role)

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
        ...(validatedData.status === 'completed' && { completedAt: new Date() }),
        ...(validatedData.status === 'in_progress' && !existingTask.startedAt && { startedAt: new Date() }),
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true }
        },
        team: {
          select: { id: true, name: true }
        },
      },
    })

    // Create task update record
    await prisma.taskUpdate.create({
      data: {
        taskId: taskId,
        userId: session.user.id,
        type: 'status_change',
        content: `Task updated`,
        previousValue: existingTask.status,
        newValue: validatedData.status || existingTask.status,
        metadata: validatedData,
      },
    })

    // Update performance metrics if task completed
    if (validatedData.status === 'completed' && existingTask.assigneeId) {
      const actualHours = existingTask.startedAt 
        ? (updatedTask.completedAt!.getTime() - existingTask.startedAt.getTime()) / (1000 * 60 * 60)
        : undefined

      await prisma.taskPerformance.upsert({
        where: {
          taskId_userId: {
            taskId: taskId,
            userId: existingTask.assigneeId,
          },
        },
        create: {
          taskId: taskId,
          userId: existingTask.assigneeId,
          actualHours,
          estimatedHours: existingTask.estimatedHours,
          onTimeCompletion: !updatedTask.dueDate || updatedTask.completedAt! <= updatedTask.dueDate,
          qualityScore: 4.0, // Default, can be updated later
        },
        update: {
          actualHours,
          onTimeCompletion: !updatedTask.dueDate || updatedTask.completedAt! <= updatedTask.dueDate,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        organizationId: session.user.organizationId,
        userId: session.user.id,
        action: 'task_updated',
        resource: 'task',
        resourceId: taskId,
        metadata: {
          changes: validatedData,
          previousStatus: existingTask.status,
        },
      },
    })

    // Get AI insights for updated task
    const aiInsights = await AITaskService.getTaskInsights(updatedTask)

    return NextResponse.json({
      ...updatedTask,
      aiInsights,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}