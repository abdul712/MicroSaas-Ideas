'use client'

import { useState } from 'react'
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, calculatePercentage } from '@/lib/utils'

interface Budget {
  id: string
  name: string
  amount: number
  spent: number
  category: string
  period: 'monthly' | 'quarterly' | 'yearly'
  status: 'on-track' | 'warning' | 'exceeded'
}

const mockBudgets: Budget[] = [
  {
    id: '1',
    name: 'Monthly Meals',
    amount: 800,
    spent: 640,
    category: 'Meals & Entertainment',
    period: 'monthly',
    status: 'on-track',
  },
  {
    id: '2',
    name: 'Travel Budget',
    amount: 2000,
    spent: 1850,
    category: 'Travel',
    period: 'monthly',
    status: 'warning',
  },
  {
    id: '3',
    name: 'Office Supplies',
    amount: 300,
    spent: 125,
    category: 'Office Expenses',
    period: 'monthly',
    status: 'on-track',
  },
  {
    id: '4',
    name: 'Software & Tools',
    amount: 500,
    spent: 545,
    category: 'Software & Tools',
    period: 'monthly',
    status: 'exceeded',
  },
]

export function BudgetOverview() {
  const [budgets] = useState<Budget[]>(mockBudgets)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'exceeded':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getTextColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'exceeded':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0)
  const overallPercentage = calculatePercentage(totalSpent, totalBudget)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Overview</CardTitle>
          <CardDescription>
            Track your spending against budgets
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Budget Summary */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Budget</span>
            <span className="text-sm text-muted-foreground">
              {overallPercentage}% used
            </span>
          </div>
          <div className="budget-progress-bar">
            <div
              className="budget-progress-fill bg-primary"
              style={{ width: `${Math.min(overallPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-muted-foreground">
              {formatCurrency(totalSpent)} spent
            </span>
            <span className="font-medium">
              {formatCurrency(totalBudget)} total
            </span>
          </div>
        </div>

        {/* Individual Budgets */}
        <div className="space-y-4">
          {budgets.map((budget) => {
            const percentage = calculatePercentage(budget.spent, budget.amount)
            const remaining = budget.amount - budget.spent
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{budget.name}</span>
                    {budget.status === 'warning' && (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    {budget.status === 'exceeded' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${getTextColor(budget.status)}`}>
                    {percentage}%
                  </span>
                </div>
                
                <div className="budget-progress-bar">
                  <div
                    className={`budget-progress-fill ${getStatusColor(budget.status)}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(budget.spent)} spent</span>
                  <span>
                    {remaining >= 0 
                      ? `${formatCurrency(remaining)} remaining`
                      : `${formatCurrency(Math.abs(remaining))} over budget`
                    }
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Budget Insights */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="font-medium text-sm">Budget Insights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categories on track</span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                {budgets.filter(b => b.status === 'on-track').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Categories over budget</span>
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-500" />
                {budgets.filter(b => b.status === 'exceeded').length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total savings potential</span>
              <span className="font-medium text-green-600">
                {formatCurrency(Math.max(0, totalBudget - totalSpent))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}