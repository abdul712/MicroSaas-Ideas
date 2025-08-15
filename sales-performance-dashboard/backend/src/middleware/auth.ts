import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { StatusCodes } from 'http-status-codes'
import { prisma } from '@/config/database'
import { cache, CacheKeys, CacheTTL } from '@/config/redis'
import { logger } from '@/utils/logger'
import { AuthError, UnauthorizedError, ForbiddenError } from '@/utils/errors'

// JWT payload interface
export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
  permissions: string[]
  type: 'access' | 'refresh'
  iat: number
  exp: number
}

// Extended Request interface with user context
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    tenantId: string
    permissions: string[]
  }
  tenant?: {
    id: string
    name: string
    plan: string
    settings: any
  }
}

// JWT configuration
const JWT_CONFIG = {
  ACCESS_SECRET: process.env.JWT_SECRET || 'your-access-token-secret',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
  ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  ISSUER: process.env.JWT_ISSUER || 'sales-dashboard-api',
  AUDIENCE: process.env.JWT_AUDIENCE || 'sales-dashboard-app'
}

// Generate access token
export const generateAccessToken = (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_CONFIG.ACCESS_SECRET,
    {
      expiresIn: JWT_CONFIG.ACCESS_EXPIRY,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: 'HS256'
    }
  )
}

// Generate refresh token
export const generateRefreshToken = (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>): string => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_CONFIG.REFRESH_SECRET,
    {
      expiresIn: JWT_CONFIG.REFRESH_EXPIRY,
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithm: 'HS256'
    }
  )
}

// Generate token pair
export const generateTokenPair = (payload: Omit<JWTPayload, 'type' | 'iat' | 'exp'>) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    expiresIn: JWT_CONFIG.ACCESS_EXPIRY
  }
}

// Verify access token
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: ['HS256']
    }) as JWTPayload

    if (decoded.type !== 'access') {
      throw new AuthError('Invalid token type')
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token')
    }
    throw error
  }
}

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.REFRESH_SECRET, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
      algorithms: ['HS256']
    }) as JWTPayload

    if (decoded.type !== 'refresh') {
      throw new AuthError('Invalid token type')
    }

    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Refresh token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid refresh token')
    }
    throw error
  }
}

// Extract token from request headers
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization
  
  if (!authHeader) {
    return null
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}

// Get user from cache or database
const getUserWithPermissions = async (userId: string): Promise<any> => {
  // Try cache first
  const cacheKey = CacheKeys.USER(userId)
  let user = await cache.get(cacheKey)

  if (!user) {
    // Fetch from database
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            tenant: true
          }
        },
        role: {
          include: {
            permissions: true
          }
        }
      }
    })

    if (!user) {
      return null
    }

    // Transform and cache
    const transformedUser = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      tenantId: user.organization.tenantId,
      organizationId: user.organizationId,
      permissions: user.role.permissions.map((p: any) => p.name),
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      tenant: {
        id: user.organization.tenant.id,
        name: user.organization.tenant.name,
        plan: user.organization.tenant.plan,
        settings: user.organization.tenant.settings
      }
    }

    await cache.set(cacheKey, transformedUser, CacheTTL.MEDIUM)
    return transformedUser
  }

  return user
}

// Authentication middleware
export const authentication = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for public routes
    const publicRoutes = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/health',
      '/docs'
    ]

    if (publicRoutes.some(route => req.path.startsWith(route))) {
      return next()
    }

    const token = extractToken(req)
    
    if (!token) {
      throw new UnauthorizedError('Access token required')
    }

    // Verify token
    const decoded = verifyAccessToken(token)

    // Check if token is blacklisted
    const blacklistKey = `blacklist:${token}`
    const isBlacklisted = await cache.exists(blacklistKey)
    
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked')
    }

    // Get user with permissions
    const user = await getUserWithPermissions(decoded.userId)
    
    if (!user) {
      throw new UnauthorizedError('User not found')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is inactive')
    }

    // Add user context to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      permissions: user.permissions
    }

    req.tenant = user.tenant

    logger.debug('User authenticated', {
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      path: req.path
    })

    next()
  } catch (error) {
    logger.error('Authentication failed', {
      error: error.message,
      path: req.path,
      ip: req.ip
    })

    if (error instanceof AuthError || error instanceof UnauthorizedError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: error.message,
        code: 'UNAUTHORIZED'
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    })
  }
}

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required')
      }

      if (!req.user.permissions.includes(permission)) {
        logger.warn('Permission denied', {
          userId: req.user.id,
          requiredPermission: permission,
          userPermissions: req.user.permissions,
          path: req.path
        })
        
        throw new ForbiddenError(`Permission '${permission}' required`)
      }

      next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: error.message,
          code: 'FORBIDDEN'
        })
      }

      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTH_ERROR'
      })
    }
  }
}

// Role-based authorization middleware
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles]
  
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required')
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Role access denied', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.path
        })
        
        throw new ForbiddenError(`Role '${allowedRoles.join(' or ')}' required`)
      }

      next()
    } catch (error) {
      if (error instanceof ForbiddenError) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: error.message,
          code: 'FORBIDDEN'
        })
      }

      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authorization error',
        code: 'AUTH_ERROR'
      })
    }
  }
}

// Blacklist token utility
export const blacklistToken = async (token: string, expiresIn?: number): Promise<void> => {
  const blacklistKey = `blacklist:${token}`
  const ttl = expiresIn || CacheTTL.VERY_LONG
  
  await cache.set(blacklistKey, true, ttl)
}

// Refresh token rotation
export const refreshTokenRotation = async (oldRefreshToken: string, userId: string): Promise<any> => {
  try {
    // Verify old refresh token
    const decoded = verifyRefreshToken(oldRefreshToken)
    
    if (decoded.userId !== userId) {
      throw new AuthError('Invalid refresh token')
    }

    // Get user with current data
    const user = await getUserWithPermissions(userId)
    
    if (!user || !user.isActive) {
      throw new AuthError('User not found or inactive')
    }

    // Blacklist old refresh token
    await blacklistToken(oldRefreshToken)

    // Generate new token pair
    const tokenPair = generateTokenPair({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    })

    // Update last login
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    })

    return {
      ...tokenPair,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId
      }
    }
  } catch (error) {
    logger.error('Token refresh failed', { userId, error: error.message })
    throw error
  }
}

// Session management
export const createSession = async (userId: string, metadata: any = {}): Promise<string> => {
  const sessionId = jwt.sign(
    { userId, ...metadata },
    JWT_CONFIG.ACCESS_SECRET,
    { expiresIn: '24h' }
  )

  const sessionKey = CacheKeys.SESSION(sessionId)
  await cache.set(sessionKey, { userId, ...metadata }, CacheTTL.VERY_LONG)

  return sessionId
}

export const destroySession = async (sessionId: string): Promise<void> => {
  const sessionKey = CacheKeys.SESSION(sessionId)
  await cache.delete(sessionKey)
}

export default authentication