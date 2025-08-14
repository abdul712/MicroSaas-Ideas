import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { config } from '../config/config'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    organizationId: string
    role: string
  }
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Skip auth for health checks and public routes
    if (
      req.path.startsWith('/health') ||
      req.path.startsWith('/api/webhooks') ||
      req.path === '/api/auth/login' ||
      req.path === '/api/auth/register' ||
      req.path === '/api/auth/refresh'
    ) {
      return next()
    }

    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required',
      })
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string
      organizationId: string
    }

    // Get user from database to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            status: true,
            plan: true,
            trialEndsAt: true,
          },
        },
      },
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
      })
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'User account is not active',
      })
    }

    if (user.organization.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Organization account is not active',
      })
    }

    // Check if trial has expired for non-paid plans
    if (
      user.organization.plan === 'starter' &&
      user.organization.trialEndsAt &&
      new Date() > user.organization.trialEndsAt
    ) {
      return res.status(402).json({
        success: false,
        message: 'Trial period has expired. Please upgrade your plan.',
        code: 'TRIAL_EXPIRED',
      })
    }

    // Add user information to request
    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    }

    next()

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      })
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    logger.error('Authentication middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    })
  }
}

// Role-based access control middleware
export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated',
      })
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      })
    }

    next()
  }
}

// Owner/admin only middleware
export const requireOwnerOrAdmin = requireRole(['owner', 'admin'])

// Admin only middleware
export const requireOwner = requireRole(['owner'])

export { AuthenticatedRequest }