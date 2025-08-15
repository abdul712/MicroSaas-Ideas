'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, CreditCard, DollarSign, FileText, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentExpenses } from '@/components/dashboard/recent-expenses'
import { BudgetOverview } from '@/components/dashboard/budget-overview'
import { QuickActions } from '@/components/dashboard/quick-actions'

interface DashboardMetrics {
  totalExpenses: number
  monthlyExpenses: number
  pendingExpenses: number
  categoriesCount: number
  monthlyChange: number
  weeklyChange: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalExpenses: 0,
    monthlyExpenses: 0,
    pendingExpenses: 0,
    categoriesCount: 0,
    monthlyChange: 0,
    weeklyChange: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call - replace with actual API call
    const fetchMetrics = async () => {
      try {
        // Mock data for demonstration
        setMetrics({
          totalExpenses: 12485.50,
          monthlyExpenses: 3240.75,
          pendingExpenses: 8,
          categoriesCount: 12,
          monthlyChange: 12.5,
          weeklyChange: -5.2,
        })
      } catch (error) {
        console.error('Failed to fetch metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchMetrics()
    }
  }, [session])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to view your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth/signin'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {session.user.name}</h1>
            <p className="text-muted-foreground">
              Here's an overview of your financial activity
            </p>
          </div>
          <QuickActions />
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                +{metrics.monthlyChange}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.monthlyExpenses)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center">
                {metrics.weeklyChange > 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                )}
                {Math.abs(metrics.weeklyChange)}% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingExpenses}</div>
              <p className="text-xs text-muted-foreground">
                Expenses awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="metric-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.categoriesCount}</div>
              <p className="text-xs text-muted-foreground">
                Active expense categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Data */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ExpenseChart />
          </div>
          <div className="space-y-6">
            <BudgetOverview />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentExpenses />
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Your expense summary for this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average per day</span>
                <span className="text-sm">{formatCurrency(metrics.monthlyExpenses / 30)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Largest expense</span>
                <span className="text-sm">{formatCurrency(485.20)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Most used category</span>
                <span className="text-sm">Meals & Entertainment</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Tax deductible</span>
                <span className="text-sm">{formatCurrency(1240.50)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}