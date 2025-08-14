import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import { rateLimit } from 'express-rate-limit'

const router = Router()
const prisma = new PrismaClient()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
})

// Register endpoint
router.post('/register', 
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    body('name').trim().isLength({ min: 2 }),
    body('organizationName').optional().trim().isLength({ min: 2 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        })
      }

      const { email, password, name, organizationName } = req.body

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(409).json({ 
          error: 'User already exists' 
        })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create organization if provided
      let organizationId = null
      if (organizationName) {
        const organization = await prisma.organization.create({
          data: {
            name: organizationName,
            plan: 'STARTER'
          }
        })
        organizationId = organization.id
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          organizationId,
          role: organizationId ? 'ORGANIZATION_ADMIN' : 'USER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          organizationId: true
        }
      })

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          organizationId: user.organizationId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      logger.info('User registered successfully', { userId: user.id, email: user.email })

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      })

    } catch (error) {
      logger.error('Registration failed', { error })
      res.status(500).json({ 
        error: 'Internal server error' 
      })
    }
  }
)

// Login endpoint
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        })
      }

      const { email, password } = req.body

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          organization: true
        }
      })

      if (!user || !user.password) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        })
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Invalid credentials' 
        })
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          organizationId: user.organizationId 
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      )

      logger.info('User logged in successfully', { userId: user.id, email: user.email })

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organization: user.organization
        },
        token
      })

    } catch (error) {
      logger.error('Login failed', { error })
      res.status(500).json({ 
        error: 'Internal server error' 
      })
    }
  }
)

// Get current user endpoint
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organization: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        organization: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    res.json({ user })

  } catch (error) {
    logger.error('Get current user failed', { error })
    res.status(401).json({ error: 'Invalid token' })
  }
})

// Logout endpoint (mainly for client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

export { router as authRoutes }