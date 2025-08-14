import { 
  hasRole, 
  requireAuth, 
  requireRole, 
  hasOrganizationAccess,
  getUserCredits,
  deductCredits,
  addCredits,
  hasActiveSubscription,
  getSubscriptionTier,
  canAccessFeature,
  checkRateLimit
} from '../auth';
import { UserRole } from '@prisma/client';
import { prisma } from '../prisma';

// Mock prisma
jest.mock('../prisma');
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth Utilities', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.USER,
      organizationId: 'org-123',
      subscription: {
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        creditsRemaining: 500
      }
    }
  };

  const mockAdminSession = {
    user: {
      ...mockSession.user,
      role: UserRole.ADMIN
    }
  };

  const mockSuperAdminSession = {
    user: {
      ...mockSession.user,
      role: UserRole.SUPER_ADMIN
    }
  };

  describe('hasRole', () => {
    it('should return true for exact role match', () => {
      expect(hasRole(mockSession, UserRole.USER)).toBe(true);
      expect(hasRole(mockAdminSession, UserRole.ADMIN)).toBe(true);
      expect(hasRole(mockSuperAdminSession, UserRole.SUPER_ADMIN)).toBe(true);
    });

    it('should return true for higher role than required', () => {
      expect(hasRole(mockAdminSession, UserRole.USER)).toBe(true);
      expect(hasRole(mockSuperAdminSession, UserRole.USER)).toBe(true);
      expect(hasRole(mockSuperAdminSession, UserRole.ADMIN)).toBe(true);
    });

    it('should return false for lower role than required', () => {
      expect(hasRole(mockSession, UserRole.ADMIN)).toBe(false);
      expect(hasRole(mockSession, UserRole.SUPER_ADMIN)).toBe(false);
      expect(hasRole(mockAdminSession, UserRole.SUPER_ADMIN)).toBe(false);
    });

    it('should return false for null session', () => {
      expect(hasRole(null, UserRole.USER)).toBe(false);
    });

    it('should return false for session without user', () => {
      expect(hasRole({} as any, UserRole.USER)).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should return true for valid session', () => {
      expect(requireAuth(mockSession)).toBe(true);
    });

    it('should return false for null session', () => {
      expect(requireAuth(null)).toBe(false);
    });

    it('should return false for session without user', () => {
      expect(requireAuth({} as any)).toBe(false);
    });
  });

  describe('requireRole', () => {
    it('should return true for authenticated user with correct role', () => {
      expect(requireRole(mockSession, UserRole.USER)).toBe(true);
      expect(requireRole(mockAdminSession, UserRole.USER)).toBe(true);
    });

    it('should return false for unauthenticated user', () => {
      expect(requireRole(null, UserRole.USER)).toBe(false);
    });

    it('should return false for authenticated user with insufficient role', () => {
      expect(requireRole(mockSession, UserRole.ADMIN)).toBe(false);
    });
  });

  describe('hasOrganizationAccess', () => {
    beforeEach(() => {
      mockPrisma.organizationMember.findFirst.mockReset();
    });

    it('should return true for organization member', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: 'user-123',
        organizationId: 'org-123',
        role: 'EDITOR',
        invitedBy: 'admin-123',
        joinedAt: new Date(),
        updatedAt: new Date()
      });

      const result = await hasOrganizationAccess('user-123', 'org-123');
      expect(result).toBe(true);
      expect(mockPrisma.organizationMember.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          organizationId: 'org-123'
        }
      });
    });

    it('should return false for non-member', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue(null);

      const result = await hasOrganizationAccess('user-123', 'org-456');
      expect(result).toBe(false);
    });

    it('should check role requirements', async () => {
      mockPrisma.organizationMember.findFirst.mockResolvedValue({
        id: 'member-123',
        userId: 'user-123',
        organizationId: 'org-123',
        role: 'EDITOR',
        invitedBy: 'admin-123',
        joinedAt: new Date(),
        updatedAt: new Date()
      });

      // EDITOR should have access for VIEWER role
      expect(await hasOrganizationAccess('user-123', 'org-123', 'VIEWER')).toBe(true);
      // EDITOR should have access for EDITOR role
      expect(await hasOrganizationAccess('user-123', 'org-123', 'EDITOR')).toBe(true);
      // EDITOR should NOT have access for ADMIN role
      expect(await hasOrganizationAccess('user-123', 'org-123', 'ADMIN')).toBe(false);
    });

    it('should handle database errors', async () => {
      mockPrisma.organizationMember.findFirst.mockRejectedValue(new Error('Database error'));

      const result = await hasOrganizationAccess('user-123', 'org-123');
      expect(result).toBe(false);
    });
  });

  describe('Credit Management', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockReset();
      mockPrisma.user.update.mockReset();
      mockPrisma.user.updateMany.mockReset();
    });

    describe('getUserCredits', () => {
      it('should return user credit balance', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
          id: 'user-123',
          creditBalance: 250,
          email: 'test@example.com',
          name: 'Test User',
          image: null,
          role: UserRole.USER,
          emailVerified: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          totalCreditsUsed: 50,
          lastActivityAt: new Date(),
          preferences: null,
          timezone: 'UTC',
          language: 'en'
        });

        const credits = await getUserCredits('user-123');
        expect(credits).toBe(250);
      });

      it('should return 0 for non-existent user', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const credits = await getUserCredits('non-existent');
        expect(credits).toBe(0);
      });

      it('should handle database errors', async () => {
        mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

        const credits = await getUserCredits('user-123');
        expect(credits).toBe(0);
      });
    });

    describe('deductCredits', () => {
      it('should successfully deduct credits when sufficient balance', async () => {
        mockPrisma.user.updateMany.mockResolvedValue({ count: 1 });

        const result = await deductCredits('user-123', 10);
        expect(result).toBe(true);
        expect(mockPrisma.user.updateMany).toHaveBeenCalledWith({
          where: {
            id: 'user-123',
            creditBalance: { gte: 10 }
          },
          data: {
            creditBalance: { decrement: 10 },
            totalCreditsUsed: { increment: 10 }
          }
        });
      });

      it('should fail to deduct credits when insufficient balance', async () => {
        mockPrisma.user.updateMany.mockResolvedValue({ count: 0 });

        const result = await deductCredits('user-123', 1000);
        expect(result).toBe(false);
      });

      it('should handle database errors', async () => {
        mockPrisma.user.updateMany.mockRejectedValue(new Error('Database error'));

        const result = await deductCredits('user-123', 10);
        expect(result).toBe(false);
      });
    });

    describe('addCredits', () => {
      it('should successfully add credits', async () => {
        mockPrisma.user.update.mockResolvedValue({} as any);

        await addCredits('user-123', 100);
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: 'user-123' },
          data: {
            creditBalance: { increment: 100 }
          }
        });
      });

      it('should throw error on database failure', async () => {
        mockPrisma.user.update.mockRejectedValue(new Error('Database error'));

        await expect(addCredits('user-123', 100)).rejects.toThrow('Database error');
      });
    });
  });

  describe('Subscription Helpers', () => {
    describe('hasActiveSubscription', () => {
      it('should return true for active subscription', () => {
        expect(hasActiveSubscription(mockSession)).toBe(true);
      });

      it('should return false for inactive subscription', () => {
        const inactiveSession = {
          user: {
            ...mockSession.user,
            subscription: {
              tier: 'FREE',
              status: 'INACTIVE',
              creditsRemaining: 0
            }
          }
        };
        expect(hasActiveSubscription(inactiveSession)).toBe(false);
      });

      it('should return false for null session', () => {
        expect(hasActiveSubscription(null)).toBe(false);
      });
    });

    describe('getSubscriptionTier', () => {
      it('should return subscription tier', () => {
        expect(getSubscriptionTier(mockSession)).toBe('PROFESSIONAL');
      });

      it('should return FREE for null session', () => {
        expect(getSubscriptionTier(null)).toBe('FREE');
      });

      it('should return FREE for session without subscription', () => {
        const freeSession = {
          user: {
            ...mockSession.user,
            subscription: undefined
          }
        };
        expect(getSubscriptionTier(freeSession)).toBe('FREE');
      });
    });

    describe('canAccessFeature', () => {
      it('should allow basic generation for all tiers', () => {
        expect(canAccessFeature(mockSession, 'basic_generation')).toBe(true);
        
        const freeSession = {
          user: {
            ...mockSession.user,
            subscription: { tier: 'FREE', status: 'ACTIVE', creditsRemaining: 20 }
          }
        };
        expect(canAccessFeature(freeSession, 'basic_generation')).toBe(true);
      });

      it('should restrict advanced features to paid tiers', () => {
        const freeSession = {
          user: {
            ...mockSession.user,
            subscription: { tier: 'FREE', status: 'ACTIVE', creditsRemaining: 20 }
          }
        };
        
        expect(canAccessFeature(freeSession, 'brand_voices')).toBe(false);
        expect(canAccessFeature(freeSession, 'team_collaboration')).toBe(false);
        expect(canAccessFeature(freeSession, 'white_label')).toBe(false);
      });

      it('should allow premium features for paid tiers', () => {
        expect(canAccessFeature(mockSession, 'brand_voices')).toBe(true);
        expect(canAccessFeature(mockSession, 'team_collaboration')).toBe(true);
      });

      it('should restrict agency features to agency tier', () => {
        expect(canAccessFeature(mockSession, 'white_label')).toBe(false);
        
        const agencySession = {
          user: {
            ...mockSession.user,
            subscription: { tier: 'AGENCY', status: 'ACTIVE', creditsRemaining: 5000 }
          }
        };
        expect(canAccessFeature(agencySession, 'white_label')).toBe(true);
      });
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockPrisma.auditLog.count.mockReset();
    });

    it('should allow requests within rate limit', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(5); // Less than limit

      const result = await checkRateLimit('user-123', 'caption_generation', 60000, 10);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4); // 10 - 5 - 1
    });

    it('should block requests exceeding rate limit', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(10); // At limit

      const result = await checkRateLimit('user-123', 'caption_generation', 60000, 10);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.auditLog.count.mockRejectedValue(new Error('Database error'));

      const result = await checkRateLimit('user-123', 'caption_generation');
      
      expect(result.allowed).toBe(true); // Default to allowing on error
      expect(result.remaining).toBe(10); // Default max requests
    });

    it('should use correct time window', async () => {
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const windowStart = now - windowMs;

      mockPrisma.auditLog.count.mockResolvedValue(3);

      await checkRateLimit('user-123', 'test_action', windowMs, 5);

      expect(mockPrisma.auditLog.count).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          action: 'test_action',
          createdAt: {
            gte: expect.any(Date)
          }
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions with missing user properties', () => {
      const incompleteSession = {
        user: {
          id: 'user-123',
          email: 'test@example.com'
        }
      } as any;

      expect(hasRole(incompleteSession, UserRole.USER)).toBe(false);
      expect(getSubscriptionTier(incompleteSession)).toBe('FREE');
      expect(hasActiveSubscription(incompleteSession)).toBe(false);
    });

    it('should handle invalid subscription data', () => {
      const invalidSession = {
        user: {
          ...mockSession.user,
          subscription: {
            tier: 'INVALID_TIER',
            status: 'UNKNOWN_STATUS',
            creditsRemaining: -1
          }
        }
      };

      expect(getSubscriptionTier(invalidSession)).toBe('INVALID_TIER');
      expect(hasActiveSubscription(invalidSession)).toBe(false);
    });
  });
});