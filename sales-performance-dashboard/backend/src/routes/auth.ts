import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthService, authMiddleware } from '../middleware/auth';
import { authRateLimit } from '../middleware/rateLimit';
import { validate, authSchemas } from '../middleware/validation';
import { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ConflictError 
} from '../utils/errors';
import { logger, loggers } from '../utils/logger';
import { config } from '../config';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user and organization
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - organizationName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               organizationName:
 *                 type: string
 *               timezone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User and organization created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', 
  authRateLimit,
  validate({ body: authSchemas.register }),
  async (req, res) => {
    const { email, password, firstName, lastName, organizationName, timezone } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists', 'email');
    }

    // Check if organization name already exists
    const existingOrg = await prisma.organization.findFirst({
      where: { name: organizationName, deletedAt: null }
    });

    if (existingOrg) {
      throw new ConflictError('An organization with this name already exists', 'organizationName');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          subscriptionPlan: 'starter',
          subscriptionStatus: 'trialing',
          settings: {},
          limits: {
            users: 5,
            integrations: 3,
            data_retention_months: 12,
            api_calls_per_month: 10000,
          },
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'admin', // First user is always admin
          organizationId: organization.id,
          emailVerified: false,
          timezone: timezone || 'UTC',
          preferences: {},
        },
      });

      return { user, organization };
    });

    // Generate tokens
    const tokens = AuthService.generateTokens({
      userId: result.user.id,
      organizationId: result.organization.id,
      email: result.user.email,
      role: result.user.role,
    });

    // Log successful registration
    loggers.business.userCreated(result.user.id, result.user.email, result.organization.id);
    loggers.business.organizationCreated(result.organization.id, result.organization.name, result.user.id);

    // Return user data (excluding sensitive information)
    res.status(201).json({
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
        timezone: result.user.timezone,
        createdAt: result.user.createdAt,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        subscriptionPlan: result.organization.subscriptionPlan,
        subscriptionStatus: result.organization.subscriptionStatus,
      },
      tokens,
    });
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               rememberMe:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login',
  authRateLimit,
  validate({ body: authSchemas.login }),
  async (req, res) => {
    const { email, password, rememberMe } = req.body;

    // Find user with organization
    const user = await prisma.user.findFirst({
      where: { 
        email, 
        deletedAt: null,
        organization: {
          deletedAt: null,
        },
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      loggers.auth.failed(email, req.ip, 'User not found');
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if organization is active
    if (user.organization?.subscriptionStatus === 'canceled') {
      loggers.auth.failed(email, req.ip, 'Organization subscription canceled');
      throw new AuthenticationError('Organization subscription is canceled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      loggers.auth.failed(email, req.ip, 'Invalid password');
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const tokens = AuthService.generateTokens({
      userId: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log successful login
    loggers.auth.login(user.id, user.email, req.ip);

    // Return user data
    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        timezone: user.timezone,
        lastLogin: user.lastLogin,
      },
      organization: user.organization,
      tokens,
    });
  }
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh',
  validate({ body: authSchemas.refreshToken }),
  async (req, res) => {
    const { refreshToken } = req.body;

    try {
      const payload = AuthService.verifyToken(refreshToken);

      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Invalid token type');
      }

      // Verify user still exists and is active
      const user = await prisma.user.findFirst({
        where: { 
          id: payload.userId,
          organizationId: payload.organizationId,
          deletedAt: null,
          organization: {
            deletedAt: null,
          },
        },
        include: {
          organization: {
            select: {
              subscriptionStatus: true,
            },
          },
        },
      });

      if (!user || user.organization?.subscriptionStatus === 'canceled') {
        throw new AuthenticationError('User or organization not found');
      }

      // Generate new access token
      const tokens = AuthService.generateTokens({
        userId: payload.userId,
        organizationId: payload.organizationId,
        email: payload.email,
        role: payload.role,
      });

      // Log token refresh
      loggers.auth.tokenRefresh(payload.userId, payload.email);

      res.json({
        accessToken: tokens.accessToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
      });
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Authentication required
 */
router.post('/logout',
  authMiddleware,
  async (req, res) => {
    const user = (req as any).user;

    // In a more sophisticated implementation, you would:
    // 1. Blacklist the current access token
    // 2. Remove the refresh token from storage
    // 3. Clear any session data

    // Log logout
    loggers.auth.logout(user.id, user.email);

    res.json({
      message: 'Logged out successfully',
    });
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get('/me',
  authMiddleware,
  async (req, res) => {
    const user = (req as any).user;
    const organization = (req as any).organization;

    // Get full user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        timezone: true,
        preferences: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      user: userData,
      organization,
      permissions: user.permissions,
    });
  }
);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 */
router.post('/change-password',
  authMiddleware,
  validate({ body: authSchemas.changePassword }),
  async (req, res) => {
    const user = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    // Get current user with password hash
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!userData?.passwordHash) {
      throw new AuthenticationError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Log password change
    loggers.security.configChange('password', 'REDACTED', 'REDACTED', user.id);

    res.json({
      message: 'Password changed successfully',
    });
  }
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent (if email exists)
 */
router.post('/forgot-password',
  authRateLimit,
  validate({ body: authSchemas.forgotPassword }),
  async (req, res) => {
    const { email } = req.body;

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    // Always return success to prevent email enumeration
    // In a real implementation, you would send a reset email if the user exists
    
    if (user) {
      // Generate reset token and save to database
      // Send reset email
      logger.info(`Password reset requested for user: ${user.id}`);
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid verification token
 */
router.post('/verify-email',
  async (req, res) => {
    const { token } = req.body;

    if (!token) {
      throw new ValidationError('Verification token is required');
    }

    // In a real implementation, you would:
    // 1. Verify the token
    // 2. Find the user associated with the token
    // 3. Mark email as verified
    // 4. Remove the verification token

    res.json({
      message: 'Email verified successfully',
    });
  }
);

export default router;