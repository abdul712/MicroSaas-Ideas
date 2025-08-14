import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { prisma } from "./prisma"
import { logActivity } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user with username derived from email
          const username = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          const uniqueUsername = await generateUniqueUsername(username);

          await prisma.user.create({
            data: {
              email: user.email!,
              username: uniqueUsername,
              displayName: user.name || uniqueUsername,
              avatarUrl: user.image,
              status: 'OFFLINE',
            },
          });
        }

        return true;
      } catch (error) {
        console.error("Error during sign in:", error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      if (user) {
        // Get user data including team memberships
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: {
            teamMembers: {
              where: { status: 'ACTIVE' },
              include: {
                team: {
                  select: {
                    id: true,
                    name: true,
                    subdomain: true,
                    plan: true,
                  },
                },
              },
            },
          },
        });

        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.displayName = dbUser.displayName;
          token.avatarUrl = dbUser.avatarUrl;
          token.teams = dbUser.teamMembers.map(tm => ({
            id: tm.team.id,
            name: tm.team.name,
            subdomain: tm.team.subdomain,
            plan: tm.team.plan,
            role: tm.role,
          }));

          // Log login activity
          await logActivity({
            userId: dbUser.id,
            action: 'USER_LOGIN',
            resourceType: 'user',
            resourceId: dbUser.id,
            metadata: {
              provider: account?.provider,
              userAgent: token.userAgent,
            },
          });
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.username = token.username as string;
        session.user.displayName = token.displayName as string;
        session.user.avatarUrl = token.avatarUrl as string;
        session.user.teams = token.teams as any[];
      }

      return session;
    },
  },
  events: {
    async signOut({ session, token }) {
      if (token?.userId) {
        // Update user status to offline
        await prisma.user.update({
          where: { id: token.userId as string },
          data: { 
            status: 'OFFLINE',
            lastActiveAt: new Date(),
          },
        });

        // Log logout activity
        await logActivity({
          userId: token.userId as string,
          action: 'USER_LOGOUT',
          resourceType: 'user',
          resourceId: token.userId as string,
        });
      }
    },
  },
  debug: process.env.NODE_ENV === "development",
};

async function generateUniqueUsername(baseUsername: string): Promise<string> {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (!existingUser) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;
  }
}

// Authentication helpers
export async function requireAuth(req: Request): Promise<any> {
  // This would be used in API routes to require authentication
  // Implementation depends on how you handle JWT verification
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authentication required');
  }

  const token = authHeader.substring(7);
  
  // Verify JWT token here
  // Return user data if valid, throw error if invalid
  
  return null; // Placeholder
}

export async function getServerSession(req: Request, res: Response) {
  // Server-side session handling
  // This would integrate with NextAuth.js getServerSession
  return null; // Placeholder
}

// Team context helpers
export async function getUserTeamContext(userId: string, teamId?: string) {
  const teamMembership = await prisma.teamMember.findFirst({
    where: {
      userId,
      teamId: teamId || undefined,
      status: 'ACTIVE',
    },
    include: {
      team: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!teamMembership) {
    throw new Error('User is not a member of this team');
  }

  return {
    teamId: teamMembership.team.id,
    subdomain: teamMembership.team.subdomain,
    plan: teamMembership.team.plan,
    role: teamMembership.role,
    settings: teamMembership.team.settings,
  };
}

export async function checkTeamPermission(
  userId: string,
  teamId: string,
  requiredRole: 'GUEST' | 'MEMBER' | 'ADMIN' | 'OWNER'
): Promise<boolean> {
  const roleHierarchy = ['GUEST', 'MEMBER', 'ADMIN', 'OWNER'];
  const requiredLevel = roleHierarchy.indexOf(requiredRole);

  const membership = await prisma.teamMember.findFirst({
    where: {
      userId,
      teamId,
      status: 'ACTIVE',
    },
  });

  if (!membership) {
    return false;
  }

  const userLevel = roleHierarchy.indexOf(membership.role);
  return userLevel >= requiredLevel;
}

export async function checkChannelAccess(
  userId: string,
  channelId: string
): Promise<boolean> {
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!channel) {
    return false;
  }

  // Public channels are accessible to all team members
  if (channel.type === 'PUBLIC') {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        teamId: channel.teamId,
        status: 'ACTIVE',
      },
    });
    return !!teamMember;
  }

  // Private channels require explicit membership
  return channel.members.length > 0;
}