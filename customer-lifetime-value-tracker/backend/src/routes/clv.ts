import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// CLV calculation schemas
const calculateClvSchema = z.object({
  customerId: z.string().optional(),
  method: z.enum(['historical', 'predictive', 'cohort']).default('historical'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// CLV routes plugin
const clvRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get CLV overview for company
  fastify.get('/overview', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      
      // Get latest CLV calculations
      const latestCalculations = await fastify.prisma.clvCalculation.findMany({
        where: { companyId },
        orderBy: { calculationDate: 'desc' },
        take: 1000, // Limit for performance
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              currentSegment: true,
              status: true,
            },
          },
        },
      });
      
      // Calculate aggregate metrics
      const totalClv = latestCalculations.reduce(
        (sum, calc) => sum + Number(calc.totalClv), 
        0
      );
      
      const averageClv = latestCalculations.length > 0 
        ? totalClv / latestCalculations.length 
        : 0;
      
      const highValueCustomers = latestCalculations.filter(
        calc => Number(calc.totalClv) > averageClv * 2
      ).length;
      
      const atRiskCustomers = latestCalculations.filter(
        calc => calc.churnProbability && Number(calc.churnProbability) > 0.7
      ).length;
      
      // Group by segments
      const segmentMetrics = latestCalculations.reduce((acc: any, calc) => {
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
      Object.keys(segmentMetrics).forEach(segment => {
        segmentMetrics[segment].averageClv = 
          segmentMetrics[segment].totalClv / segmentMetrics[segment].count;
      });
      
      reply.send({
        overview: {
          totalCustomers: latestCalculations.length,
          totalClv,
          averageClv,
          highValueCustomers,
          atRiskCustomers,
        },
        segmentMetrics,
        topCustomers: latestCalculations
          .sort((a, b) => Number(b.totalClv) - Number(a.totalClv))
          .slice(0, 10),
      });
    } catch (error) {
      fastify.log.error('CLV overview error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Get CLV for specific customer
  fastify.get('/customers/:customerId', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { customerId } = request.params;
      
      // Verify customer belongs to company
      const customer = await fastify.prisma.customer.findFirst({
        where: { id: customerId, companyId },
      });
      
      if (!customer) {
        return reply.code(404).send({
          error: 'Customer not found',
          statusCode: 404,
        });
      }
      
      // Get CLV calculation history
      const clvHistory = await fastify.prisma.clvCalculation.findMany({
        where: { customerId, companyId },
        orderBy: { calculationDate: 'desc' },
      });
      
      // Get transactions for calculation
      const transactions = await fastify.prisma.transaction.findMany({
        where: { customerId, companyId },
        orderBy: { transactionDate: 'desc' },
      });
      
      // Calculate basic metrics
      const totalRevenue = transactions.reduce(
        (sum, tx) => sum + Number(tx.amount), 
        0
      );
      
      const firstPurchase = transactions
        .sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime())[0];
      
      const lastPurchase = transactions
        .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())[0];
      
      const daysSinceFirstPurchase = firstPurchase 
        ? Math.floor((new Date().getTime() - firstPurchase.transactionDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      const averageOrderValue = transactions.length > 0 
        ? totalRevenue / transactions.length 
        : 0;
      
      const purchaseFrequency = daysSinceFirstPurchase > 0 
        ? transactions.length / daysSinceFirstPurchase * 30 // per month
        : 0;
      
      reply.send({
        customer,
        clvHistory,
        metrics: {
          totalRevenue,
          averageOrderValue,
          purchaseFrequency,
          totalTransactions: transactions.length,
          daysSinceFirstPurchase,
          daysSinceLastPurchase: lastPurchase 
            ? Math.floor((new Date().getTime() - lastPurchase.transactionDate.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
        transactions: transactions.slice(0, 20), // Latest 20 transactions
      });
    } catch (error) {
      fastify.log.error('Customer CLV error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Calculate/recalculate CLV
  fastify.post('/calculate', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const body = calculateClvSchema.parse(request.body);
      
      // If specific customer ID provided, calculate for that customer only
      if (body.customerId) {
        const customer = await fastify.prisma.customer.findFirst({
          where: { id: body.customerId, companyId },
        });
        
        if (!customer) {
          return reply.code(404).send({
            error: 'Customer not found',
            statusCode: 404,
          });
        }
        
        const clv = await calculateCustomerClv(
          fastify, 
          customer.id, 
          companyId, 
          body.method
        );
        
        reply.send({ clv });
      } else {
        // Calculate for all customers in company
        const customers = await fastify.prisma.customer.findMany({
          where: { companyId, status: 'active' },
        });
        
        const results = await Promise.all(
          customers.map(customer => 
            calculateCustomerClv(fastify, customer.id, companyId, body.method)
          )
        );
        
        reply.send({
          message: `CLV calculated for ${results.length} customers`,
          results: results.filter(Boolean),
        });
      }
    } catch (error) {
      fastify.log.error('CLV calculation error:', error);
      
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors,
          statusCode: 400,
        });
      }
      
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Get CLV trends
  fastify.get('/trends', {
    preHandler: authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          period: { type: 'string', enum: ['7d', '30d', '90d', '1y'], default: '30d' },
          segment: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { period = '30d', segment } = request.query;
      
      // Calculate date range
      const days = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365,
      }[period];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // Build where clause
      const where: any = {
        companyId,
        calculationDate: { gte: startDate },
      };
      
      if (segment) {
        where.customer = {
          currentSegment: segment,
        };
      }
      
      // Get CLV calculations over time
      const calculations = await fastify.prisma.clvCalculation.findMany({
        where,
        include: {
          customer: {
            select: { currentSegment: true },
          },
        },
        orderBy: { calculationDate: 'asc' },
      });
      
      // Group by date
      const trends = calculations.reduce((acc: any, calc) => {
        const date = calc.calculationDate.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = {
            date,
            totalClv: 0,
            count: 0,
            averageClv: 0,
          };
        }
        acc[date].totalClv += Number(calc.totalClv);
        acc[date].count++;
        return acc;
      }, {});
      
      // Calculate averages
      Object.keys(trends).forEach(date => {
        trends[date].averageClv = trends[date].totalClv / trends[date].count;
      });
      
      reply.send({
        trends: Object.values(trends),
        period,
        segment,
      });
    } catch (error) {
      fastify.log.error('CLV trends error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
};

// Helper function to calculate CLV for a customer
async function calculateCustomerClv(
  fastify: any, 
  customerId: string, 
  companyId: string, 
  method: string
) {
  try {
    // Get customer transactions
    const transactions = await fastify.prisma.transaction.findMany({
      where: { customerId, companyId },
      orderBy: { transactionDate: 'asc' },
    });
    
    if (transactions.length === 0) {
      return null;
    }
    
    // Calculate historical CLV
    const totalRevenue = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount), 
      0
    );
    
    const firstTransaction = transactions[0];
    const lastTransaction = transactions[transactions.length - 1];
    
    const daysBetween = Math.floor(
      (lastTransaction.transactionDate.getTime() - firstTransaction.transactionDate.getTime()) 
      / (1000 * 60 * 60 * 24)
    );
    
    const averageOrderValue = totalRevenue / transactions.length;
    const purchaseFrequency = daysBetween > 0 ? transactions.length / daysBetween * 30 : 0; // per month
    const customerLifespan = Math.max(daysBetween / 30, 1); // in months, minimum 1
    
    // Simple historical CLV calculation
    const historicalValue = totalRevenue;
    
    // Simple predictive CLV (multiply by estimated future months)
    const predictedValue = method === 'predictive' 
      ? averageOrderValue * purchaseFrequency * 12 // next 12 months
      : 0;
    
    const totalClv = historicalValue + predictedValue;
    
    // Simple churn probability (based on days since last purchase)
    const daysSinceLastPurchase = Math.floor(
      (new Date().getTime() - lastTransaction.transactionDate.getTime()) 
      / (1000 * 60 * 60 * 24)
    );
    
    const churnProbability = Math.min(daysSinceLastPurchase / 90, 1); // 0-1 scale
    
    // Save calculation
    const clvCalculation = await fastify.prisma.clvCalculation.upsert({
      where: {
        companyId_customerId_calculationDate: {
          companyId,
          customerId,
          calculationDate: new Date(),
        },
      },
      update: {
        historicalValue,
        predictedValue: method === 'predictive' ? predictedValue : null,
        totalClv,
        predictionConfidence: method === 'predictive' ? 0.7 : null,
        churnProbability,
        calculationMethod: method,
        modelVersion: '1.0',
      },
      create: {
        companyId,
        customerId,
        calculationDate: new Date(),
        historicalValue,
        predictedValue: method === 'predictive' ? predictedValue : null,
        totalClv,
        predictionConfidence: method === 'predictive' ? 0.7 : null,
        churnProbability,
        calculationMethod: method,
        modelVersion: '1.0',
      },
    });
    
    return clvCalculation;
  } catch (error) {
    console.error('CLV calculation error for customer', customerId, error);
    return null;
  }
}

export default clvRoutes;