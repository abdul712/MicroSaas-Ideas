import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

import { prisma } from '../utils/prisma';
import { cache } from '../utils/redis';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number, and special character'),
  body('firstName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('First name is required'),
  body('lastName')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Last name is required'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Register endpoint
router.post('/register', authLimiter, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password, firstName, lastName, company } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email',
        code: 'USER_EXISTS',
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'USER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Store session in Redis
    const sessionKey = `session:${user.id}:${Date.now()}`;
    await cache.set(sessionKey, token, 7 * 24 * 60 * 60); // 7 days

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionKey,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token,
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'REGISTRATION_ERROR',
    });
  }
});

// Login endpoint
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email, password, rememberMe } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password!);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Generate JWT token
    const expiresIn = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn }
    );

    // Store session in Redis
    const sessionKey = `session:${user.id}:${Date.now()}`;
    const sessionTTL = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
    await cache.set(sessionKey, token, sessionTTL);

    // Create session record
    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionKey,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent') || '',
        expiresAt: new Date(Date.now() + sessionTTL * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Prepare user response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      subscription: user.subscriptions[0] || null,
      createdAt: user.createdAt,
    };

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      user: userResponse,
      token,
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'LOGIN_ERROR',
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      // Decode token to get session info
      const decoded = jwt.decode(token) as any;
      if (decoded?.userId) {
        // Remove all sessions for this user
        await prisma.session.deleteMany({
          where: { userId: decoded.userId },
        });

        // Remove from Redis (pattern-based deletion)
        // In production, you might want to maintain a session mapping
        const sessionKeys = await cache.hgetall(`user_sessions:${decoded.userId}`);
        if (sessionKeys) {
          const keys = Object.values(sessionKeys);
          await Promise.all(keys.map(key => cache.del(key as string)));
          await cache.del(`user_sessions:${decoded.userId}`);
        }
      }
    }

    logger.info(`User logged out: ${(req as any).user?.email}`);

    res.json({
      message: 'Logout successful',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'LOGOUT_ERROR',
    });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        projects: {
          select: {
            id: true,
            name: true,
            domain: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      subscription: user.subscriptions[0] || null,
      recentProjects: user.projects,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    res.json({
      user: userResponse,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'GET_USER_ERROR',
    });
  }
});

// Update profile
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('avatar').optional().isURL(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { firstName, lastName, avatar } = req.body;
    const userId = (req as any).user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(avatar && { avatar }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    logger.info(`Profile updated: ${updatedUser.email}`);

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'UPDATE_PROFILE_ERROR',
    });
  }
});

// Change password
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters with uppercase, lowercase, number, and special character'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, password: true },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password!);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD',
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Invalidate all sessions except current one
    await prisma.session.deleteMany({
      where: { 
        userId,
        token: { not: req.headers.authorization?.split(' ')[1] || '' }
      },
    });

    logger.info(`Password changed: ${user.email}`);

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Change password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'CHANGE_PASSWORD_ERROR',
    });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'MISSING_REFRESH_TOKEN',
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token: newToken,
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN',
    });
  }
});

// Verify email (placeholder)
router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const { token } = req.body;

    // In a real implementation, you'd verify the email verification token
    // For now, this is a placeholder
    
    res.json({
      message: 'Email verification endpoint - not implemented yet',
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'EMAIL_VERIFICATION_ERROR',
    });
  }
});

// Forgot password (placeholder)
router.post('/forgot-password', authLimiter, [
  body('email').isEmail().normalizeEmail(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { email } = req.body;

    // In a real implementation, you'd send a password reset email
    // For now, this is a placeholder
    
    logger.info(`Password reset requested for: ${email}`);

    res.json({
      message: 'If an account with that email exists, we sent you a password reset link',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'FORGOT_PASSWORD_ERROR',
    });
  }
});

export default router;