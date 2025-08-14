import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import { config } from '../config/config'
import { logger } from '../utils/logger'
import { sendWelcomeEmail } from '../services/email-service'
import { createAuditLog } from '../services/audit-service'

const router = express.Router()
const prisma = new PrismaClient()

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().isLength({ min: 1 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1 }).withMessage('Last name is required'),
  body('organizationName').trim().isLength({ min: 1 }).withMessage('Organization name is required'),
]

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]

// Helper functions
function generateTokens(userId: string, organizationId: string) {
  const accessToken = jwt.sign(
    { userId, organizationId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  )
  
  const refreshToken = jwt.sign(
    { userId, organizationId },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  )
  
  return { accessToken, refreshToken }
}

// Routes
router.post('/register', registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      })
    }

    const { email, password, firstName, lastName, organizationName, industry } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create organization and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          industry: industry || null,
          plan: 'starter',
          status: 'active',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
        },
      })

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          hashedPassword,
          role: 'owner',
          status: 'active',
          organizationId: organization.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
              plan: true,
              status: true,
              trialEndsAt: true,
            },
          },
        },
      })

      return { user, organization }
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(result.user.id, result.user.organizationId)

    // Create audit log
    await createAuditLog({
      organizationId: result.user.organizationId,
      userId: result.user.id,
      action: 'create',
      resource: 'user',
      resourceId: result.user.id,
    })

    // Send welcome email (async)
    sendWelcomeEmail(result.user.email, result.user.firstName).catch(error => {
      logger.error('Failed to send welcome email:', error)
    })

    logger.info(`New user registered: ${email}`)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    })

  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed',
    })
  }
})

router.post('/login', loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array(),
      })
    }

    const { email, password } = req.body

    // Find user with organization
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            plan: true,
            status: true,
            trialEndsAt: true,
          },
        },
      },
    })

    if (!user || !user.hashedPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    // Check user and organization status
    if (user.status !== 'active' || user.organization.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active',
      })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.organizationId)

    // Create audit log
    await createAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      action: 'view',
      resource: 'login',
    })

    // Remove sensitive data
    const { hashedPassword, ...userWithoutPassword } = user

    logger.info(`User logged in: ${email}`)

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    })

  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed',
    })
  }
})

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
      })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      userId: string
      organizationId: string
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })

    if (!user || user.status !== 'active' || user.organization.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
      })
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(
      user.id,
      user.organizationId
    )

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      },
    })

  } catch (error) {
    logger.error('Token refresh error:', error)
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    })
  }
})

router.post('/logout', async (req, res) => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just return success and let the client handle token removal
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    })

  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    })
  }
})

router.get('/me', async (req, res) => {
  try {
    const userId = req.user?.id
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
            domain: true,
            industry: true,
            plan: true,
            status: true,
            trialEndsAt: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    res.json({
      success: true,
      data: { user },
    })

  } catch (error) {
    logger.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to get user information',
    })
  }
})

export default router