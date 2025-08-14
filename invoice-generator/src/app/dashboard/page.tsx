'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertTriangle, 
  Plus,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DashboardStats } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-1">Welcome back! Here's your business overview.</p>
            </div>
            <div className="flex items-center gap-4">
              <Button asChild>
                <Link href="/invoices/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats?.statusCounts?.paid || 0} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats?.totalOutstanding || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {(stats?.statusCounts?.sent || 0) + (stats?.statusCounts?.viewed || 0)} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats?.totalOverdue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats?.statusCounts?.overdue || 0} overdue invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.totalInvoices || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(stats?.averageInvoiceValue || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Invoices</CardTitle>
              <CardDescription>Your latest invoices and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentInvoices?.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-gray-500">
                          {invoice.client.firstName} {invoice.client.lastName}
                          {invoice.client.company && ` (${invoice.client.company})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(Number(invoice.total), invoice.currency)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                        invoice.status === 'SENT' || invoice.status === 'VIEWED' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                )) || []}
                
                {(!stats?.recentInvoices || stats.recentInvoices.length === 0) && (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first invoice.</p>
                    <div className="mt-6">
                      <Button asChild>
                        <Link href="/invoices/create">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Invoice
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {stats?.recentInvoices && stats.recentInvoices.length > 0 && (
                <div className="mt-6">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/invoices">View All Invoices</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Clients */}
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>Your best clients by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topClients?.slice(0, 5).map((client, index) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.company && (
                          <p className="text-xs text-gray-500">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(client.totalPaid)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.invoiceCount} invoices
                      </p>
                    </div>
                  </div>
                )) || []}
                
                {(!stats?.topClients || stats.topClients.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No clients yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Add clients to start tracking your business relationships.</p>
                    <div className="mt-6">
                      <Button variant="outline" asChild>
                        <Link href="/clients/create">Add Client</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              {stats?.topClients && stats.topClients.length > 0 && (
                <div className="mt-6">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/clients">View All Clients</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to help you manage your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild className="h-auto p-4 flex-col space-y-2">
                <Link href="/invoices/create">
                  <Plus className="h-6 w-6" />
                  <span>Create Invoice</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col space-y-2">
                <Link href="/clients/create">
                  <Users className="h-6 w-6" />
                  <span>Add Client</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col space-y-2">
                <Link href="/reports">
                  <TrendingUp className="h-6 w-6" />
                  <span>View Reports</span>
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="h-auto p-4 flex-col space-y-2">
                <Link href="/settings">
                  <Calendar className="h-6 w-6" />
                  <span>Settings</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}