'use client'

import { useState } from 'react'
import { MoreHorizontal, Receipt, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Expense {
  id: string
  title: string
  amount: number
  date: string
  category: string
  status: 'pending' | 'approved' | 'rejected'
  merchant?: string
  hasReceipt: boolean
}

const mockExpenses: Expense[] = [
  {
    id: '1',
    title: 'Lunch with client',
    amount: 85.50,
    date: '2024-01-15',
    category: 'Meals & Entertainment',
    status: 'approved',
    merchant: 'The Grill Restaurant',
    hasReceipt: true,
  },
  {
    id: '2',
    title: 'Office supplies',
    amount: 124.99,
    date: '2024-01-14',
    category: 'Office Expenses',
    status: 'pending',
    merchant: 'Staples',
    hasReceipt: true,
  },
  {
    id: '3',
    title: 'Software subscription',
    amount: 29.99,
    date: '2024-01-14',
    category: 'Software & Tools',
    status: 'approved',
    merchant: 'Adobe Creative Cloud',
    hasReceipt: false,
  },
  {
    id: '4',
    title: 'Taxi to airport',
    amount: 45.00,
    date: '2024-01-13',
    category: 'Travel',
    status: 'approved',
    merchant: 'Uber',
    hasReceipt: true,
  },
  {
    id: '5',
    title: 'Conference registration',
    amount: 299.00,
    date: '2024-01-12',
    category: 'Training & Development',
    status: 'pending',
    merchant: 'TechConf 2024',
    hasReceipt: true,
  },
]

export function RecentExpenses() {
  const [expenses] = useState<Expense[]>(mockExpenses)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'rejected':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20'
    }
  }

  const handleEdit = (expenseId: string) => {
    console.log('Edit expense:', expenseId)
    // Navigate to edit page or open modal
  }

  const handleDelete = (expenseId: string) => {
    console.log('Delete expense:', expenseId)
    // Show confirmation dialog and delete
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>
            Your latest expense entries and their status
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  {expense.hasReceipt ? (
                    <Receipt className="h-5 w-5 text-primary" />
                  ) : (
                    <div className="w-5 h-5 rounded bg-muted" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {expense.title}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}
                    >
                      {expense.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{expense.category}</span>
                    <span>•</span>
                    <span>{formatDate(expense.date)}</span>
                    {expense.merchant && (
                      <>
                        <span>•</span>
                        <span className="truncate">{expense.merchant}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatCurrency(expense.amount)}
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(expense.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(expense.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No expenses found</p>
              <p className="text-sm">Start by adding your first expense</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}