'use client'

import { useState, useEffect } from 'react'
import { User, Organization, TeamMember, Team, Task, Project } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Brain,
  Zap,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react'
import { formatRelativeTime, getTaskStatusColor, getPriorityColor } from '@/lib/utils'
import Link from 'next/link'

interface DashboardOverviewProps {
  data: {
    user: User & {
      organization: Organization
      teamMemberships: (TeamMember & { team: Team })[]
    }
    tasks: (Task & {
      creator: { id: string; name: string | null; email: string; avatar: string | null }
      assignee: { id: string; name: string | null; email: string; avatar: string | null } | null
      project: { id: string; name: string; status: string } | null
    })[]
    stats: {
      totalTasks: number
      completedTasks: number
      activeTasks: number
      overdueTasks: number
      teamMembers: number
    }
  }
}

export function DashboardOverview({ data }: DashboardOverviewProps) {
  const [timeOfDay, setTimeOfDay] = useState('')
  const { user, tasks, stats } = data

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setTimeOfDay('Good morning')
    else if (hour < 17) setTimeOfDay('Good afternoon')
    else setTimeOfDay('Good evening')
  }, [])

  const completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0
  const myTasks = tasks.filter(t => t.assigneeId === user.id)
  const delegatedTasks = tasks.filter(t => t.creatorId === user.id && t.assigneeId !== user.id)
  const upcomingTasks = myTasks.filter(t => 
    t.dueDate && 
    new Date(t.dueDate) > new Date() && 
    new Date(t.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
    t.status !== 'completed'
  ).slice(0, 5)

  const aiInsights = {
    workloadStatus: 'optimal',
    predictedCompletions: 8,
    riskTasks: tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length,
    efficiencyScore: 87
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {timeOfDay}, {user.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-indigo-100 mt-1">
              You have {stats.activeTasks} active tasks and {stats.overdueTasks} overdue items to focus on.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="secondary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/dashboard/ai">
                <Brain className="w-4 h-4 mr-2" />
                AI Insights
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completionRate.toFixed(0)}%
              </p>
              <div className="flex items-center mt-1">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600 dark:text-green-400">+12% from last week</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeTasks}</p>
              <div className="flex items-center mt-1">
                <Activity className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-xs text-blue-600 dark:text-blue-400">{myTasks.length} assigned to you</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdueTasks}</p>
              <div className="flex items-center mt-1">
                {stats.overdueTasks > 0 ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-xs text-red-600 dark:text-red-400">Needs attention</span>
                  </>
                ) : (
                  <span className="text-xs text-green-600 dark:text-green-400">All caught up!</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">AI Efficiency</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{aiInsights.efficiencyScore}%</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-xs text-green-600 dark:text-green-400">Optimal workload</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/tasks">View All</Link>
              </Button>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      {task.assignee && (
                        <span>Assigned to {task.assignee.name}</span>
                      )}
                      {task.dueDate && (
                        <span>Due {formatRelativeTime(task.dueDate)}</span>
                      )}
                      {task.project && (
                        <span>{task.project.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</h3>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/ai">
                  <Zap className="w-4 h-4 mr-1" />
                  View All
                </Link>
              </Button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Workload Status</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Your current capacity is optimal</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-green-600 dark:text-green-400 capitalize">
                {aiInsights.workloadStatus}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Predicted Completions</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Expected tasks to complete this week</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {aiInsights.predictedCompletions}
              </span>
            </div>

            {aiInsights.riskTasks > 0 && (
              <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">High Risk Tasks</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Urgent tasks that need attention</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {aiInsights.riskTasks}
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard/ai" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-medium">
                Get personalized AI recommendations →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingTasks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Deadlines</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Tasks due in the next 7 days</p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                      {task.title}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.project && <span>{task.project.name}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {task.dueDate && formatRelativeTime(task.dueDate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}