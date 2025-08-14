import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId: string;
    role: string;
    permissions: string[];
  };
  organization?: {
    id: string;
    name: string;
    plan: string;
    limits: any;
  };
}

export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
  sessionId?: string;
  type: 'access' | 'refresh';
}

export class AuthService {
  static generateTokens(payload: Omit<JWTPayload, 'type'>) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401, 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Invalid token', 401, 'INVALID_TOKEN');
      }
      throw new AppError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED');
    }
  }

  static async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: userId,
          organizationId,
          deletedAt: null,
        },
        select: {
          role: true,
        },
      });

      if (!user) {
        return [];
      }

      // Define role-based permissions
      const rolePermissions: Record<string, string[]> = {
        admin: [
          'users:read', 'users:write', 'users:delete',
          'organizations:read', 'organizations:write',
          'integrations:read', 'integrations:write', 'integrations:delete',
          'dashboards:read', 'dashboards:write', 'dashboards:delete', 'dashboards:share',
          'analytics:read', 'analytics:write',
          'teams:read', 'teams:write', 'teams:delete',
          'billing:read', 'billing:write',
          'audit:read',
        ],
        manager: [
          'users:read',
          'integrations:read', 'integrations:write',
          'dashboards:read', 'dashboards:write', 'dashboards:share',
          'analytics:read', 'analytics:write',
          'teams:read', 'teams:write',
        ],
        analyst: [
          'dashboards:read', 'dashboards:write',
          'analytics:read',
          'teams:read',
        ],
        viewer: [
          'dashboards:read',
          'analytics:read',
        ],
      };

      return rolePermissions[user.role] || rolePermissions.viewer;
    } catch (error) {
      logger.error('Error fetching user permissions:', error);
      return [];
    }
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);
    const payload = AuthService.verifyToken(token);

    if (payload.type !== 'access') {
      throw new AppError('Invalid token type', 401, 'INVALID_TOKEN_TYPE');
    }

    // Fetch user and organization data
    const user = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        organizationId: payload.organizationId,
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            limits: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!user || user.organization?.deletedAt) {
      throw new AppError('User not found or organization deleted', 401, 'USER_NOT_FOUND');
    }

    // Check if organization is active
    if (user.organization.subscriptionStatus === 'canceled') {
      throw new AppError('Organization subscription canceled', 403, 'SUBSCRIPTION_CANCELED');
    }

    // Get user permissions
    const permissions = await AuthService.getUserPermissions(user.id, user.organizationId);

    // Attach user and organization to request
    req.user = {
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
      permissions,
    };

    req.organization = {
      id: user.organization.id,
      name: user.organization.name,
      plan: user.organization.subscriptionPlan,
      limits: user.organization.limits,
    };

    // Log successful authentication
    logger.debug(`User authenticated: ${user.email} (${user.id})`);

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    
    logger.error('Authentication error:', error);
    next(new AppError('Authentication failed', 401, 'AUTH_FAILED'));
  }
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    if (!req.user.permissions.includes(permission)) {
      return next(new AppError('Insufficient permissions', 403, 'INSUFFICIENT_PERMISSIONS'));
    }

    next();
  };
};

export const requireRole = (role: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTH_REQUIRED'));
    }

    const allowedRoles = Array.isArray(role) ? role : [role];
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient role', 403, 'INSUFFICIENT_ROLE'));
    }

    next();
  };
};

// Middleware for optional authentication (won't fail if no token)
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      await authMiddleware(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    // For optional auth, we continue even if authentication fails
    next();
  }
};

// Rate limiting based on user/organization
export const userBasedRateLimit = (req: AuthRequest): string => {
  if (req.user) {
    return `user:${req.user.id}`;
  }
  
  // Fall back to IP-based rate limiting for unauthenticated requests
  return `ip:${req.ip}`;
};

// Check organization limits
export const checkOrganizationLimits = (resource: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.organization) {
      return next(new AppError('Organization context required', 400, 'ORG_CONTEXT_REQUIRED'));
    }

    const limits = req.organization.limits;
    
    // Example: Check API call limits
    if (resource === 'api_calls') {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      
      // This would typically be stored in Redis or database
      // For now, we'll just check the basic limit
      const monthlyLimit = limits.api_calls_per_month || 10000;
      
      // In a real implementation, you'd check current usage from cache/database
      // const currentUsage = await getMonthlyApiUsage(req.organization.id, currentMonth);
      // if (currentUsage >= monthlyLimit) {
      //   return next(new AppError('API call limit exceeded', 429, 'LIMIT_EXCEEDED'));
      // }
    }

    next();
  };
};

// Middleware to validate organization context
export const validateOrganizationContext = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // If organization ID is provided in params, validate it matches user's org
  const orgIdParam = req.params.organizationId || req.body.organizationId;
  
  if (orgIdParam && req.user && orgIdParam !== req.user.organizationId) {
    return next(new AppError('Organization access denied', 403, 'ORG_ACCESS_DENIED'));
  }

  next();
};