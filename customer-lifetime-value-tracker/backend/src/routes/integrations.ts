import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

// Integration schemas
const createIntegrationSchema = z.object({
  platform: z.enum(['shopify', 'stripe', 'woocommerce', 'square']),
  configuration: z.record(z.any()),
  credentials: z.record(z.string()).optional(),
});

const updateIntegrationSchema = z.object({
  configuration: z.record(z.any()).optional(),
  credentials: z.record(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// Integration routes plugin
const integrationRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Authentication middleware
  const authenticate = async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get all integrations for company
  fastify.get('/', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      
      const integrations = await fastify.prisma.integration.findMany({
        where: { companyId },
        select: {
          id: true,
          platform: true,
          configuration: true,
          isActive: true,
          lastSyncAt: true,
          syncStatus: true,
          errorCount: true,
          createdAt: true,
          updatedAt: true,
          // Exclude encrypted credentials from response
        },
        orderBy: { createdAt: 'desc' },
      });
      
      reply.send({ integrations });
    } catch (error) {
      fastify.log.error('Get integrations error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Get single integration
  fastify.get('/:id', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      
      const integration = await fastify.prisma.integration.findFirst({
        where: { id, companyId },
        select: {
          id: true,
          platform: true,
          configuration: true,
          isActive: true,
          lastSyncAt: true,
          syncStatus: true,
          errorCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      if (!integration) {
        return reply.code(404).send({
          error: 'Integration not found',
          statusCode: 404,
        });
      }
      
      reply.send({ integration });
    } catch (error) {
      fastify.log.error('Get integration error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Create new integration
  fastify.post('/', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const body = createIntegrationSchema.parse(request.body);
      
      // Check if integration for this platform already exists
      const existing = await fastify.prisma.integration.findFirst({
        where: {
          companyId,
          platform: body.platform,
        },
      });
      
      if (existing) {
        return reply.code(409).send({
          error: `Integration for ${body.platform} already exists`,
          statusCode: 409,
        });
      }
      
      // Encrypt credentials if provided
      let credentialsEncrypted = null;
      if (body.credentials) {
        // TODO: Implement proper encryption
        credentialsEncrypted = JSON.stringify(body.credentials);
      }
      
      const integration = await fastify.prisma.integration.create({
        data: {
          companyId,
          platform: body.platform,
          configuration: body.configuration,
          credentialsEncrypted,
        },
        select: {
          id: true,
          platform: true,
          configuration: true,
          isActive: true,
          lastSyncAt: true,
          syncStatus: true,
          errorCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      // TODO: Trigger initial sync
      
      reply.code(201).send({ integration });
    } catch (error) {
      fastify.log.error('Create integration error:', error);
      
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
  
  // Update integration
  fastify.put('/:id', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      const body = updateIntegrationSchema.parse(request.body);
      
      // Check if integration exists
      const existing = await fastify.prisma.integration.findFirst({
        where: { id, companyId },
      });
      
      if (!existing) {
        return reply.code(404).send({
          error: 'Integration not found',
          statusCode: 404,
        });
      }
      
      // Prepare update data
      const updateData: any = {};
      
      if (body.configuration) {
        updateData.configuration = body.configuration;
      }
      
      if (body.credentials) {
        // TODO: Implement proper encryption
        updateData.credentialsEncrypted = JSON.stringify(body.credentials);
      }
      
      if (body.isActive !== undefined) {
        updateData.isActive = body.isActive;
      }
      
      const integration = await fastify.prisma.integration.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          platform: true,
          configuration: true,
          isActive: true,
          lastSyncAt: true,
          syncStatus: true,
          errorCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      
      reply.send({ integration });
    } catch (error) {
      fastify.log.error('Update integration error:', error);
      
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
  
  // Delete integration
  fastify.delete('/:id', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      
      // Check if integration exists
      const existing = await fastify.prisma.integration.findFirst({
        where: { id, companyId },
      });
      
      if (!existing) {
        return reply.code(404).send({
          error: 'Integration not found',
          statusCode: 404,
        });
      }
      
      await fastify.prisma.integration.delete({
        where: { id },
      });
      
      reply.code(204).send();
    } catch (error) {
      fastify.log.error('Delete integration error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Test integration connection
  fastify.post('/:id/test', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      
      const integration = await fastify.prisma.integration.findFirst({
        where: { id, companyId },
      });
      
      if (!integration) {
        return reply.code(404).send({
          error: 'Integration not found',
          statusCode: 404,
        });
      }
      
      // TODO: Implement actual connection testing based on platform
      const testResult = await testIntegrationConnection(integration);
      
      // Update integration status
      await fastify.prisma.integration.update({
        where: { id },
        data: {
          syncStatus: testResult.success ? 'connected' : 'error',
          errorCount: testResult.success ? 0 : integration.errorCount + 1,
        },
      });
      
      reply.send({
        success: testResult.success,
        message: testResult.message,
        details: testResult.details,
      });
    } catch (error) {
      fastify.log.error('Test integration error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Trigger manual sync
  fastify.post('/:id/sync', {
    preHandler: authenticate,
  }, async (request: any, reply) => {
    try {
      const { companyId } = request.user;
      const { id } = request.params;
      
      const integration = await fastify.prisma.integration.findFirst({
        where: { id, companyId },
      });
      
      if (!integration) {
        return reply.code(404).send({
          error: 'Integration not found',
          statusCode: 404,
        });
      }
      
      if (!integration.isActive) {
        return reply.code(400).send({
          error: 'Integration is not active',
          statusCode: 400,
        });
      }
      
      // TODO: Trigger sync job
      await fastify.prisma.integration.update({
        where: { id },
        data: {
          syncStatus: 'syncing',
          lastSyncAt: new Date(),
        },
      });
      
      reply.send({
        message: 'Sync started',
        status: 'syncing',
      });
    } catch (error) {
      fastify.log.error('Sync integration error:', error);
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
  
  // Webhook endpoints for each platform
  fastify.post('/webhooks/shopify', async (request, reply) => {
    try {
      // TODO: Verify Shopify webhook signature
      const payload = request.body;
      
      // Process Shopify webhook
      fastify.log.info('Received Shopify webhook:', payload);
      
      reply.send({ received: true });
    } catch (error) {
      fastify.log.error('Shopify webhook error:', error);
      reply.code(500).send({
        error: 'Webhook processing error',
        statusCode: 500,
      });
    }
  });
  
  fastify.post('/webhooks/stripe', async (request, reply) => {
    try {
      // TODO: Verify Stripe webhook signature
      const payload = request.body;
      
      // Process Stripe webhook
      fastify.log.info('Received Stripe webhook:', payload);
      
      reply.send({ received: true });
    } catch (error) {
      fastify.log.error('Stripe webhook error:', error);
      reply.code(500).send({
        error: 'Webhook processing error',
        statusCode: 500,
      });
    }
  });
};

// Helper function to test integration connection
async function testIntegrationConnection(integration: any) {
  try {
    // TODO: Implement actual connection testing for each platform
    switch (integration.platform) {
      case 'shopify':
        return { success: true, message: 'Shopify connection test successful', details: {} };
      case 'stripe':
        return { success: true, message: 'Stripe connection test successful', details: {} };
      case 'woocommerce':
        return { success: true, message: 'WooCommerce connection test successful', details: {} };
      default:
        return { success: false, message: 'Unknown platform', details: {} };
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'Connection test failed', 
      details: { error: error instanceof Error ? error.message : 'Unknown error' } 
    };
  }
}

export default integrationRoutes;