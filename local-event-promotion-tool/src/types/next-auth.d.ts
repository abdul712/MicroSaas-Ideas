import { DefaultSession, DefaultUser } from 'next-auth'
import { SubscriptionPlan, OrganizationRole } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      organizations: {
        id: string
        name: string
        slug: string
        logo: string | null
        plan: SubscriptionPlan
        role: OrganizationRole
      }[]
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    accessToken?: string
    refreshToken?: string
    provider?: string
  }
}