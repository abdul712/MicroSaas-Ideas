import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch user's tasks and organization data
  const [user, tasks, teamStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true,
        teamMemberships: {
          include: {
            team: true
          }
        }
      }
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: session.user.id },
          { creatorId: session.user.id }
        ]
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        project: {
          select: { id: true, name: true, status: true }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ],
      take: 50
    }),
    prisma.user.count({
      where: {
        organizationId: session.user.organizationId,
        status: 'active'
      }
    })
  ])

  if (!user) {
    redirect('/auth/signin')
  }

  const dashboardData = {
    user,
    tasks,
    stats: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      activeTasks: tasks.filter(t => ['todo', 'in_progress', 'review'].includes(t.status)).length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
      teamMembers: teamStats,
    }
  }

  return (
    <DashboardLayout user={user}>
      <DashboardOverview data={dashboardData} />
    </DashboardLayout>
  )
}