import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    organizationId?: string
  }
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
      
      // Verify user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true,
          organizationId: true
        }
      })

      if (!user) {
        return res.status(401).json({ 
          error: 'Access denied. User not found.' 
        })
      }

      req.user = user
      next()

    } catch (jwtError) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token.' 
      })
    }

  } catch (error) {
    logger.error('Auth middleware error', { error })
    res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied. Authentication required.' 
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      })
    }

    next()
  }
}

export const requireOrganization = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.organizationId) {
    return res.status(403).json({ 
      error: 'Access denied. Organization membership required.' 
    })
  }
  next()
}