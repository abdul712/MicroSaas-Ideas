import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '../middleware'
import { startOfMonth, endOfMonth, subMonths } from 'date-fns'

// GET /api/dashboard - Get dashboard statistics
export const GET = withAuth(async (request: NextRequest, user: any) => {
  try {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)

    // Get basic stats
    const [
      totalInvoices,
      totalRevenue,
      totalOutstanding,
      totalOverdue,
      recentInvoices,
    ] = await Promise.all([
      // Total invoices count
      prisma.invoice.count({
        where: { userId: user.id }
      }),

      // Total revenue (paid invoices)
      prisma.invoice.aggregate({
        where: {
          userId: user.id,
          status: 'PAID'
        },
        _sum: { total: true }
      }),

      // Total outstanding (sent invoices not paid)
      prisma.invoice.aggregate({
        where: {
          userId: user.id,
          status: { in: ['SENT', 'VIEWED'] }
        },
        _sum: { dueAmount: true }
      }),

      // Total overdue (past due date and not paid)
      prisma.invoice.aggregate({
        where: {
          userId: user.id,
          status: { in: ['SENT', 'VIEWED', 'OVERDUE'] },
          dueDate: { lt: now }
        },
        _sum: { dueAmount: true }
      }),

      // Recent invoices
      prisma.invoice.findMany({
        where: { userId: user.id },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    // Invoice status breakdown
    const invoicesByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: { userId: user.id },
      _count: true,
    })

    const statusCounts = {
      draft: 0,
      sent: 0,
      viewed: 0,
      paid: 0,
      overdue: 0,
      cancelled: 0,
    }

    invoicesByStatus.forEach(group => {
      const status = group.status.toLowerCase()
      statusCounts[status as keyof typeof statusCounts] = group._count
    })

    // Monthly revenue for the last 12 months
    const monthlyRevenueData = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i))
      const monthEnd = endOfMonth(subMonths(now, i))

      const monthRevenue = await prisma.invoice.aggregate({
        where: {
          userId: user.id,
          status: 'PAID',
          paidDate: {
            gte: monthStart,
            lte: monthEnd,
          }
        },
        _sum: { total: true }
      })

      monthlyRevenueData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue._sum.total || 0,
      })
    }

    // Top clients by total paid
    const topClients = await prisma.client.findMany({
      where: { 
        userId: user.id,
        invoices: {
          some: {
            status: 'PAID'
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        invoices: {
          where: { status: 'PAID' },
          select: { total: true }
        }
      },
      take: 5,
    })

    const topClientsWithTotals = topClients.map(client => ({
      ...client,
      totalPaid: client.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0),
      invoiceCount: client.invoices.length,
    })).sort((a, b) => b.totalPaid - a.totalPaid)

    // Calculate average invoice value
    const averageInvoiceValue = totalInvoices > 0 
      ? Number(totalRevenue._sum.total || 0) / totalInvoices 
      : 0

    const dashboardStats = {
      totalInvoices,
      totalRevenue: Number(totalRevenue._sum.total || 0),
      totalOutstanding: Number(totalOutstanding._sum.dueAmount || 0),
      totalOverdue: Number(totalOverdue._sum.dueAmount || 0),
      averageInvoiceValue,
      statusCounts,
      recentInvoices,
      monthlyRevenue: monthlyRevenueData,
      topClients: topClientsWithTotals,
    }

    return NextResponse.json({
      success: true,
      data: dashboardStats
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
})