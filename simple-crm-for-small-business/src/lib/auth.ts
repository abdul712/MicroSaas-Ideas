import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  email: string;
  role: string;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

// Generate JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Extract token from request headers
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check for token in cookies
  const tokenCookie = request.cookies.get('auth-token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

// Get current user from request
export async function getCurrentUser(request: NextRequest): Promise<AuthUser | null> {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        tenantId: payload.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

// Middleware helper for API route protection
export async function requireAuth(request: NextRequest): Promise<{ user: AuthUser } | { error: string }> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    return { error: 'Authentication required' };
  }

  return { user };
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest): Promise<{ user: AuthUser } | { error: string }> => {
    const authResult = await requireAuth(request);
    
    if ('error' in authResult) {
      return authResult;
    }

    if (!allowedRoles.includes(authResult.user.role)) {
      return { error: 'Insufficient permissions' };
    }

    return authResult;
  };
}

// Common role constants
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
} as const;

// Permission helpers
export function canManageUsers(role: string): boolean {
  return role === ROLES.ADMIN;
}

export function canManageSettings(role: string): boolean {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
}

export function canViewAllContacts(role: string): boolean {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
}

export function canManageDeals(role: string): boolean {
  return [ROLES.ADMIN, ROLES.MANAGER].includes(role);
}

// Generate a secure random password
export function generateSecurePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}

// Create a new user session
export async function createUserSession(email: string, password: string): Promise<{
  user: AuthUser;
  token: string;
} | { error: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { email, isActive: true },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      return { error: 'Invalid credentials' };
    }

    if (user.tenant.status !== 'active') {
      return { error: 'Account is suspended' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { error: 'Invalid credentials' };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken({
      userId: user.id,
      tenantId: user.tenantId,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    };
  } catch (error) {
    console.error('Error creating user session:', error);
    return { error: 'Authentication failed' };
  }
}