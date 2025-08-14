import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Analytics schemas
const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  segment: z.string().optional(),
  metric: z.enum(['revenue', 'clv', 'churn', 'acquisition']).optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

// Analytics routes plugin
const analyticsRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get dashboard analytics
  fastify.get('/dashboard', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      
      // Get date ranges
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      // Get customers and transactions
      const [
        totalCustomers,
        activeCustomers,
        newCustomersLast30Days,
        totalTransactions,
        recentTransactions,
        latestClvCalculations,
      ] = await Promise.all([
        fastify.prisma.customer.count({
          where: { companyId },
        }),
        fastify.prisma.customer.count({
          where: { companyId, status: 'active' },
        }),
        fastify.prisma.customer.count({
          where: {
            companyId,
            createdAt: { gte: thirtyDaysAgo },
          },
        }),
        fastify.prisma.transaction.count({
          where: { companyId },
        }),
        fastify.prisma.transaction.findMany({
          where: {
            companyId,
            transactionDate: { gte: thirtyDaysAgo },
          },
          include: {
            customer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { transactionDate: 'desc' },
          take: 10,
        }),
        fastify.prisma.clvCalculation.findMany({
          where: { companyId },
          orderBy: { calculationDate: 'desc' },
          take: 1000, // Limit for performance
          include: {
            customer: {
              select: {
                currentSegment: true,
                status: true,
              },
            },
          },
        }),
      ]);
      
      // Calculate revenue metrics
      const totalRevenue = recentTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );
      
      const averageOrderValue = totalTransactions > 0 
        ? totalRevenue / recentTransactions.length 
        : 0;
      
      // Calculate CLV metrics
      const totalClv = latestClvCalculations.reduce(
        (sum, calc) => sum + Number(calc.totalClv),
        0
      );
      
      const averageClv = latestClvCalculations.length > 0 
        ? totalClv / latestClvCalculations.length 
        : 0;
      
      const highValueCustomers = latestClvCalculations.filter(
        calc => Number(calc.totalClv) > averageClv * 1.5
      ).length;
      
      const atRiskCustomers = latestClvCalculations.filter(
        calc => calc.churnProbability && Number(calc.churnProbability) > 0.7
      ).length;
      
      // Calculate previous period for comparison
      const previousPeriodTransactions = await fastify.prisma.transaction.findMany({
        where: {
          companyId,
          transactionDate: {
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo,
          },
        },
      });
      
      const previousRevenue = previousPeriodTransactions.reduce(
        (sum, tx) => sum + Number(tx.amount),
        0
      );
      
      const revenueGrowth = previousRevenue > 0 
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      
      // Segment breakdown
      const segmentStats = latestClvCalculations.reduce((acc: any, calc) => {
        const segment = calc.customer.currentSegment || 'Unknown';
        if (!acc[segment]) {
          acc[segment] = {
            count: 0,
            totalClv: 0,
            averageClv: 0,
          };
        }
        acc[segment].count++;
        acc[segment].totalClv += Number(calc.totalClv);
        return acc;
      }, {});
      
      // Calculate average CLV per segment
      Object.keys(segmentStats).forEach(segment => {
        segmentStats[segment].averageClv = 
          segmentStats[segment].totalClv / segmentStats[segment].count;
      });
      
      reply.send({
        overview: {
          totalCustomers,
          activeCustomers,
          newCustomersLast30Days,
          totalTransactions,
          totalRevenue,
          averageOrderValue,
          totalClv,
          averageClv,
          highValueCustomers,
          atRiskCustomers,
          revenueGrowth,
        },
        segmentStats,
        recentActivity: {
          transactions: recentTransactions,
          topCustomers: latestClvCalculations
            .sort((a, b) => Number(b.totalClv) - Number(a.totalClv))
            .slice(0, 5),
        },
      });
    } catch (error) {
      fastify.log.error('Dashboard analytics error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Get time-series analytics
  fastify.get('/timeseries', {
    preHandler: authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          metric: { type: 'string', enum: ['revenue', 'clv', 'customers', 'transactions'] },
          groupBy: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { 
        startDate, 
        endDate, 
        metric = 'revenue', 
        groupBy = 'day' 
      } = request.query;
      
      // Set default date range if not provided
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      let data: any[] = [];
      
      if (metric === 'revenue' || metric === 'transactions') {
        // Get transactions in date range
        const transactions = await fastify.prisma.transaction.findMany({
          where: {
            companyId,
            transactionDate: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { transactionDate: 'asc' },
        });
        
        // Group by time period
        const grouped = groupTransactionsByPeriod(transactions, groupBy);
        
        data = Object.entries(grouped).map(([date, transactions]: [string, any]) => ({
          date,
          value: metric === 'revenue' 
            ? transactions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)
            : transactions.length,
          count: transactions.length,
        }));
      } else if (metric === 'clv') {
        // Get CLV calculations in date range
        const clvCalcs = await fastify.prisma.clvCalculation.findMany({
          where: {
            companyId,
            calculationDate: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { calculationDate: 'asc' },
        });
        
        const grouped = groupClvByPeriod(clvCalcs, groupBy);
        
        data = Object.entries(grouped).map(([date, calcs]: [string, any]) => ({
          date,
          value: calcs.reduce((sum: number, calc: any) => sum + Number(calc.totalClv), 0),
          averageClv: calcs.length > 0 
            ? calcs.reduce((sum: number, calc: any) => sum + Number(calc.totalClv), 0) / calcs.length 
            : 0,
          count: calcs.length,
        }));
      } else if (metric === 'customers') {
        // Get new customers in date range
        const customers = await fastify.prisma.customer.findMany({
          where: {
            companyId,
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { createdAt: 'asc' },
        });
        
        const grouped = groupCustomersByPeriod(customers, groupBy);
        
        data = Object.entries(grouped).map(([date, customers]: [string, any]) => ({
          date,
          value: customers.length,
          count: customers.length,
        }));
      }
      
      reply.send({
        metric,
        groupBy,
        startDate: start,
        endDate: end,
        data,
      });
    } catch (error) {
      fastify.log.error('Time-series analytics error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Get cohort analysis
  fastify.get('/cohorts', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      
      // Get all customers with their first purchase date
      const customers = await fastify.prisma.customer.findMany({
        where: { companyId },
        include: {
          transactions: {
            orderBy: { transactionDate: 'asc' },
            take: 1,
          },
        },
      });
      
      // Group customers by cohort (month of first purchase)
      const cohorts: { [key: string]: any } = {};
      
      customers.forEach(customer => {
        if (customer.transactions.length > 0) {
          const firstPurchase = customer.transactions[0].transactionDate;
          const cohortKey = `${firstPurchase.getFullYear()}-${String(firstPurchase.getMonth() + 1).padStart(2, '0')}`;
          
          if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = {
              cohort: cohortKey,
              size: 0,
              customers: [],
            };
          }
          
          cohorts[cohortKey].size++;
          cohorts[cohortKey].customers.push(customer.id);
        }
      });
      
      // Calculate retention for each cohort
      const cohortData = await Promise.all(
        Object.values(cohorts).map(async (cohort: any) => {
          // Get transactions for this cohort over time
          const transactions = await fastify.prisma.transaction.findMany({
            where: {
              companyId,
              customerId: { in: cohort.customers },
            },
            orderBy: { transactionDate: 'asc' },
          });
          
          // Calculate monthly retention
          const retentionData = calculateCohortRetention(cohort, transactions);
          
          return {
            ...cohort,
            ...retentionData,
          };
        })
      );
      
      reply.send({
        cohorts: cohortData.sort((a, b) => a.cohort.localeCompare(b.cohort)),
      });
    } catch (error) {
      fastify.log.error('Cohort analysis error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Export analytics data
  fastify.get('/export', {
    preHandler: authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['customers', 'transactions', 'clv'], default: 'customers' },
          format: { type: 'string', enum: ['csv', 'json'], default: 'csv' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { type = 'customers', format = 'csv', startDate, endDate } = request.query;
      
      let data: any[] = [];
      let filename = '';
      
      // Build date filter if provided
      const dateFilter = startDate && endDate ? {
        gte: new Date(startDate),
        lte: new Date(endDate),
      } : undefined;
      
      if (type === 'customers') {
        data = await fastify.prisma.customer.findMany({
          where: {
            companyId,
            ...(dateFilter && { createdAt: dateFilter }),
          },
          include: {
            _count: {
              select: { transactions: true },
            },
            clvCalculations: {
              orderBy: { calculationDate: 'desc' },
              take: 1,
            },
          },
        });
        filename = `customers_${new Date().toISOString().split('T')[0]}`;
      } else if (type === 'transactions') {
        data = await fastify.prisma.transaction.findMany({
          where: {
            companyId,
            ...(dateFilter && { transactionDate: dateFilter }),
          },
          include: {
            customer: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });
        filename = `transactions_${new Date().toISOString().split('T')[0]}`;
      } else if (type === 'clv') {
        data = await fastify.prisma.clvCalculation.findMany({
          where: {
            companyId,
            ...(dateFilter && { calculationDate: dateFilter }),
          },
          include: {
            customer: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                currentSegment: true,
              },
            },
          },
        });
        filename = `clv_${new Date().toISOString().split('T')[0]}`;
      }
      
      if (format === 'csv') {
        const csv = convertToCSV(data);
        
        reply
          .header('Content-Type', 'text/csv')
          .header('Content-Disposition', `attachment; filename="${filename}.csv"`)
          .send(csv);
      } else {
        reply
          .header('Content-Type', 'application/json')
          .header('Content-Disposition', `attachment; filename="${filename}.json"`)
          .send(data);
      }
    } catch (error) {
      fastify.log.error('Export analytics error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
};

// Helper functions
function groupTransactionsByPeriod(transactions: any[], groupBy: string) {
  return transactions.reduce((acc: any, tx) => {
    const date = formatDateByPeriod(tx.transactionDate, groupBy);
    if (!acc[date]) acc[date] = [];
    acc[date].push(tx);
    return acc;
  }, {});
}

function groupClvByPeriod(clvCalcs: any[], groupBy: string) {
  return clvCalcs.reduce((acc: any, calc) => {
    const date = formatDateByPeriod(calc.calculationDate, groupBy);
    if (!acc[date]) acc[date] = [];
    acc[date].push(calc);
    return acc;
  }, {});
}

function groupCustomersByPeriod(customers: any[], groupBy: string) {
  return customers.reduce((acc: any, customer) => {
    const date = formatDateByPeriod(customer.createdAt, groupBy);
    if (!acc[date]) acc[date] = [];
    acc[date].push(customer);
    return acc;
  }, {});
}

function formatDateByPeriod(date: Date, groupBy: string): string {
  if (groupBy === 'day') {
    return date.toISOString().split('T')[0];
  } else if (groupBy === 'week') {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  } else if (groupBy === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return date.toISOString().split('T')[0];
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateCohortRetention(cohort: any, transactions: any[]) {
  // This is a simplified retention calculation
  // In a real implementation, you'd calculate month-over-month retention
  const totalRevenue = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const averageClv = cohort.size > 0 ? totalRevenue / cohort.size : 0;
  
  return {
    totalRevenue,
    averageClv,
    retentionData: [], // TODO: Implement detailed retention calculation
  };
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');
  
  return csvContent;
}

export default analyticsRoutes;