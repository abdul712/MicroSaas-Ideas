import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import GitHubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import { prisma } from '@/lib/prisma'
import { Adapter } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,public_profile,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
        },
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.FROM_EMAIL || 'noreply@eventpro.com',
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Get user's organizations
        const organizations = await prisma.organizationMember.findMany({
          where: { userId: user.id },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                plan: true,
              },
            },
          },
        })
        
        session.user.organizations = organizations.map(member => ({
          id: member.organization.id,
          name: member.organization.name,
          slug: member.organization.slug,
          logo: member.organization.logo,
          plan: member.organization.plan,
          role: member.role,
        }))
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      
      // Store social media tokens for later use
      if (account && account.access_token) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.provider = account.provider
        
        // Store social media integration
        if (account.provider === 'facebook' || account.provider === 'google') {
          try {
            await prisma.socialIntegration.upsert({
              where: {
                organizationId_platform: {
                  organizationId: user.id, // This would need to be the organization ID
                  platform: account.provider.toUpperCase() as any,
                },
              },
              update: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                isActive: true,
              },
              create: {
                organizationId: user.id, // This would need to be the organization ID
                platform: account.provider.toUpperCase() as any,
                platformUserId: account.providerAccountId,
                username: profile?.name || profile?.login,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : null,
                scopes: account.scope?.split(' ') || [],
                isActive: true,
              },
            })
          } catch (error) {
            console.error('Failed to store social integration:', error)
          }
        }
      }
      
      return token
    },
    async signIn({ user, account, profile, email, credentials }) {
      // Allow sign in
      return true
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/onboarding',
  },
  events: {
    async createUser({ user }) {
      // Send welcome email
      console.log('New user created:', user.email)
      
      // Create default organization for new user
      try {
        const organization = await prisma.organization.create({
          data: {
            name: `${user.name || user.email}'s Organization`,
            slug: `${user.name || user.email}`.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now(),
            email: user.email,
            plan: 'FREE',
            members: {
              create: {
                userId: user.id,
                role: 'OWNER',
              },
            },
          },
        })
        
        console.log('Default organization created:', organization.id)
      } catch (error) {
        console.error('Failed to create default organization:', error)
      }
    },
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', user.email)
      
      // Track sign in analytics
      try {
        await prisma.userAnalytics.upsert({
          where: {
            userId_date: {
              userId: user.id,
              date: new Date(),
            },
          },
          update: {
            features: {
              signIn: true,
            },
          },
          create: {
            userId: user.id,
            date: new Date(),
            features: {
              signIn: true,
            },
          },
        })
      } catch (error) {
        console.error('Failed to track sign in analytics:', error)
      }
    },
    async signOut({ session, token }) {
      console.log('User signed out')
    },
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}