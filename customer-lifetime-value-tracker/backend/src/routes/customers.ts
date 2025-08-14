import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Validation schemas
const createCustomerSchema = z.object({
  externalId: z.string().optional(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  acquisitionChannel: z.string().optional(),
  acquisitionCost: z.number().positive().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// Customer routes plugin
const customerRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get all customers for company
  fastify.get('/', {
    preHandler: authenticate,
    schema: {
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          search: { type: 'string' },
          segment: { type: 'string' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { page = 1, limit = 20, search, segment, status } = request.query;
      
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where: any = { companyId };
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      if (segment) {
        where.currentSegment = segment;
      }
      
      if (status) {
        where.status = status;
      }
      
      // Get customers and total count
      const [customers, total] = await Promise.all([
        fastify.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          include: {
            _count: {
              select: { transactions: true, clvCalculations: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        fastify.prisma.customer.count({ where }),
      ]);
      
      reply.send({
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      fastify.log.error('Get customers error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Get single customer
  fastify.get('/:id', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      
      const customer = await fastify.prisma.customer.findFirst({
        where: { id, companyId },
        include: {
          transactions: {
            orderBy: { transactionDate: 'desc' },
            take: 10,
          },
          clvCalculations: {
            orderBy: { calculationDate: 'desc' },
            take: 1,
          },
          _count: {
            select: { transactions: true },
          },
        },
      });
      
      if (!customer) {
        return reply.code(404).send({
          error: 'Customer not found',
          statusCode: 404,
        });
      }
      
      reply.send({ customer });
    } catch (error) {
      fastify.log.error('Get customer error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Create customer
  fastify.post('/', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const body = createCustomerSchema.parse(request.body);
      
      // Check for duplicate external ID
      if (body.externalId) {
        const existing = await fastify.prisma.customer.findFirst({
          where: {
            companyId,
            externalId: body.externalId,
          },
        });
        
        if (existing) {
          return reply.code(409).send({
            error: 'Customer with this external ID already exists',
            statusCode: 409,
          });
        }
      }
      
      const customer = await fastify.prisma.customer.create({
        data: {
          ...body,
          companyId,
        },
      });
      
      reply.code(201).send({ customer });
    } catch (error) {
      fastify.log.error('Create customer error:', error);
      
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
  
  // Update customer
  fastify.put('/:id', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      const body = updateCustomerSchema.parse(request.body);
      
      // Check if customer exists
      const existing = await fastify.prisma.customer.findFirst({
        where: { id, companyId },
      });
      
      if (!existing) {
        return reply.code(404).send({
          error: 'Customer not found',
          statusCode: 404,
        });
      }
      
      const customer = await fastify.prisma.customer.update({
        where: { id },
        data: body,
      });
      
      reply.send({ customer });
    } catch (error) {
      fastify.log.error('Update customer error:', error);
      
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
  
  // Delete customer
  fastify.delete('/:id', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      
      // Check if customer exists
      const existing = await fastify.prisma.customer.findFirst({
        where: { id, companyId },
      });
      
      if (!existing) {
        return reply.code(404).send({
          error: 'Customer not found',
          statusCode: 404,
        });
      }
      
      await fastify.prisma.customer.delete({
        where: { id },
      });
      
      reply.code(204).send();
    } catch (error) {
      fastify.log.error('Delete customer error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
};

export default customerRoutes;