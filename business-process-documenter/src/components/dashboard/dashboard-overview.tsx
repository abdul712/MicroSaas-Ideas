'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatTime } from '@/lib/utils';

interface DashboardData {
  totalProcesses: number;
  recentProcesses: any[];
  recentExecutions: any[];
  stats: {
    totalExecutions: number;
    completedExecutions: number;
    avgExecutionTime: number;
  };
}

interface DashboardOverviewProps {
  data: DashboardData;
}

export default function DashboardOverview({ data }: DashboardOverviewProps) {
  const {
    totalProcesses,
    recentProcesses,
    recentExecutions,
    stats,
  } = data;

  const completionRate = stats.totalExecutions > 0 
    ? Math.round((stats.completedExecutions / stats.totalExecutions) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's an overview of your process documentation.
          </p>
        </div>
        <Link href="/dashboard/processes/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Process
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProcesses}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Execution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(stats.avgExecutionTime)}</div>
            <p className="text-xs text-muted-foreground">
              -8% from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Processes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Processes
              <Link href="/dashboard/processes">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Your most recently updated processes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProcesses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No processes yet. Create your first process to get started!</p>
                <Link href="/dashboard/processes/new" className="mt-4 inline-block">
                  <Button>Create Process</Button>
                </Link>
              </div>
            ) : (
              recentProcesses.map((process) => (
                <div key={process.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-sm">{process.title}</h4>
                      <Badge variant={process.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {process.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{process._count.steps} steps</span>
                      <span>{process._count.executions} executions</span>
                      <span>Updated {formatDate(process.updatedAt)}</span>
                    </div>
                  </div>
                  <Link href={`/dashboard/processes/${process.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              <Link href="/dashboard/analytics">
                <Button variant="outline" size="sm">View Analytics</Button>
              </Link>
            </CardTitle>
            <CardDescription>
              Latest process executions and activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentExecutions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No activity yet. Start executing processes to see activity here!</p>
              </div>
            ) : (
              recentExecutions.map((execution) => (
                <div key={execution.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      execution.status === 'COMPLETED' ? 'bg-green-500' :
                      execution.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                      execution.status === 'FAILED' ? 'bg-red-500' : 'bg-gray-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{execution.process.title}</p>
                      <p className="text-xs text-gray-500">
                        by {execution.user.name || execution.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      execution.status === 'COMPLETED' ? 'default' :
                      execution.status === 'IN_PROGRESS' ? 'secondary' : 'destructive'
                    }>
                      {execution.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(execution.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks to help you get started with process documentation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/processes/new">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <PlusCircle className="h-8 w-8 text-blue-600 mb-2" />
                <h4 className="font-medium">Create Process</h4>
                <p className="text-sm text-gray-600">Document a new business process</p>
              </div>
            </Link>

            <Link href="/dashboard/templates">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <FileText className="h-8 w-8 text-green-600 mb-2" />
                <h4 className="font-medium">Browse Templates</h4>
                <p className="text-sm text-gray-600">Start with industry templates</p>
              </div>
            </Link>

            <Link href="/dashboard/team">
              <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <Users className="h-8 w-8 text-purple-600 mb-2" />
                <h4 className="font-medium">Invite Team</h4>
                <p className="text-sm text-gray-600">Collaborate with your team</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}