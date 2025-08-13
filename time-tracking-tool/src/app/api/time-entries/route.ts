import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTimeEntrySchema = z.object({
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  duration: z.number().optional(),
  projectId: z.string(),
  taskId: z.string().optional(),
  isBillable: z.boolean().default(true),
  workspaceId: z.string(),
})

const querySchema = z.object({
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isBillable: z.string().optional(),
  page: z.string().default('1'),
  limit: z.string().default('20'),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = querySchema.parse(Object.fromEntries(searchParams))

    const page = parseInt(query.page)
    const limit = parseInt(query.limit)
    const skip = (page - 1) * limit

    const where: any = {
      userId: session.user.id,
    }

    if (query.projectId) {
      where.projectId = query.projectId
    }

    if (query.taskId) {
      where.taskId = query.taskId
    }

    if (query.isBillable !== undefined) {
      where.isBillable = query.isBillable === 'true'
    }

    if (query.startDate || query.endDate) {
      where.startTime = {}
      if (query.startDate) {
        where.startTime.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        where.startTime.lte = new Date(query.endDate)
      }
    }

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          project: {
            include: {
              client: true,
            },
          },
          task: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          activities: {
            orderBy: {
              timestamp: 'asc',
            },
          },
        },
        orderBy: {
          startTime: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.timeEntry.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: timeEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching time entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
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
    const data = createTimeEntrySchema.parse(body)

    // Verify user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        workspaceId: data.workspaceId,
      },
      include: {
        workspace: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    })

    if (!project || project.workspace.members.length === 0) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Calculate duration if not provided
    let duration = data.duration
    if (!duration && data.endTime) {
      const start = new Date(data.startTime)
      const end = new Date(data.endTime)
      duration = Math.floor((end.getTime() - start.getTime()) / 1000)
    }

    // Verify task belongs to project if provided
    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: data.taskId,
          projectId: data.projectId,
        },
      })

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found or does not belong to project' },
          { status: 400 }
        )
      }
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        description: data.description,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : null,
        duration,
        projectId: data.projectId,
        taskId: data.taskId,
        isBillable: data.isBillable,
        userId: session.user.id,
        workspaceId: data.workspaceId,
      },
      include: {
        project: {
          include: {
            client: true,
          },
        },
        task: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'TimeEntry',
        entityId: timeEntry.id,
        userId: session.user.id,
        changes: {
          timeEntry: {
            id: timeEntry.id,
            duration,
            projectId: data.projectId,
            taskId: data.taskId,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: timeEntry,
      message: 'Time entry created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating time entry:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}