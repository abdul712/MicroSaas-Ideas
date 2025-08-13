import { FastifyPluginAsync } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  companyName: z.string().min(1).max(255),
  industry: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

// Auth routes plugin
const authRoutes: FastifyPluginAsync = async (fastify, opts) => {
  // Register new user and company
  fastify.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'firstName', 'lastName', 'companyName'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 100 },
          firstName: { type: 'string', minLength: 1, maxLength: 100 },
          lastName: { type: 'string', minLength: 1, maxLength: 100 },
          companyName: { type: 'string', minLength: 1, maxLength: 255 },
          industry: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                companyId: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = registerSchema.parse(request.body);
      
      // Check if user already exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email: body.email },
      });
      
      if (existingUser) {
        return reply.code(409).send({
          error: 'User already exists with this email',
          statusCode: 409,
        });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(body.password, 12);
      
      // Create company slug from name
      const slug = body.companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      
      // Check if company slug exists
      let finalSlug = slug;
      let counter = 1;
      while (await fastify.prisma.company.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${slug}-${counter}`;
        counter++;
      }
      
      // Create company and user in transaction
      const result = await fastify.prisma.$transaction(async (tx) => {
        const company = await tx.company.create({
          data: {
            name: body.companyName,
            slug: finalSlug,
            industry: body.industry,
          },
        });
        
        const user = await tx.user.create({
          data: {
            email: body.email,
            passwordHash,
            firstName: body.firstName,
            lastName: body.lastName,
            role: 'admin',
            companyId: company.id,
          },
        });
        
        return { company, user };
      });
      
      // Generate tokens
      const accessToken = fastify.jwt.sign({
        userId: result.user.id,
        companyId: result.company.id,
        role: result.user.role,
      });
      
      const refreshToken = fastify.jwt.sign({
        userId: result.user.id,
        type: 'refresh',
      }, { expiresIn: '7d' });
      
      // Store refresh token in Redis
      await fastify.redis.setex(
        `refresh_token:${result.user.id}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );
      
      reply.code(201).send({
        message: 'User registered successfully',
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          role: result.user.role,
          companyId: result.company.id,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      fastify.log.error('Registration error:', error);
      
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
  
  // Login user
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                role: { type: 'string' },
                companyId: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const body = loginSchema.parse(request.body);
      
      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email: body.email },
        include: { company: true },
      });
      
      if (!user || !user.isActive) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          statusCode: 401,
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(body.password, user.passwordHash);
      if (!isValidPassword) {
        return reply.code(401).send({
          error: 'Invalid credentials',
          statusCode: 401,
        });
      }
      
      // Update last login
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
      
      // Generate tokens
      const accessToken = fastify.jwt.sign({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      });
      
      const refreshToken = fastify.jwt.sign({
        userId: user.id,
        type: 'refresh',
      }, { expiresIn: '7d' });
      
      // Store refresh token in Redis
      await fastify.redis.setex(
        `refresh_token:${user.id}`,
        7 * 24 * 60 * 60, // 7 days
        refreshToken
      );
      
      reply.send({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          companyId: user.companyId,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      fastify.log.error('Login error:', error);
      
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
  
  // Refresh access token
  fastify.post('/refresh', async (request, reply) => {
    try {
      const body = refreshSchema.parse(request.body);
      
      // Verify refresh token
      const decoded = fastify.jwt.verify(body.refreshToken) as any;
      
      if (decoded.type !== 'refresh') {
        return reply.code(401).send({
          error: 'Invalid refresh token',
          statusCode: 401,
        });
      }
      
      // Check if refresh token exists in Redis
      const storedToken = await fastify.redis.get(`refresh_token:${decoded.userId}`);
      if (storedToken !== body.refreshToken) {
        return reply.code(401).send({
          error: 'Invalid refresh token',
          statusCode: 401,
        });
      }
      
      // Get user
      const user = await fastify.prisma.user.findUnique({
        where: { id: decoded.userId },
      });
      
      if (!user || !user.isActive) {
        return reply.code(401).send({
          error: 'User not found or inactive',
          statusCode: 401,
        });
      }
      
      // Generate new access token
      const accessToken = fastify.jwt.sign({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
      });
      
      reply.send({
        accessToken,
      });
    } catch (error) {
      fastify.log.error('Refresh token error:', error);
      
      reply.code(401).send({
        error: 'Invalid refresh token',
        statusCode: 401,
      });
    }
  });
  
  // Logout user
  fastify.post('/logout', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
  }, async (request, reply) => {
    try {
      const user = request.user as any;
      
      // Remove refresh token from Redis
      await fastify.redis.del(`refresh_token:${user.userId}`);
      
      reply.send({
        message: 'Logout successful',
      });
    } catch (error) {
      fastify.log.error('Logout error:', error);
      
      reply.code(500).send({
        error: 'Internal server error',
        statusCode: 500,
      });
    }
  });
};

export default authRoutes;