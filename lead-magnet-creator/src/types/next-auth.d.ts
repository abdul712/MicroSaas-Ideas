import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      organizationId: string
      organization: {
        id: string
        name: string
        slug: string
        subscription: string
        planLimits: Record<string, any>
        usage: Record<string, any>
      }
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    organizationId: string
    organization?: {
      id: string
      name: string
      slug: string
      subscription: string
      planLimits: Record<string, any>
      usage: Record<string, any>
    }
    password?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    organizationId: string
    organization: {
      id: string
      name: string
      slug: string
      subscription: string
      planLimits: Record<string, any>
      usage: Record<string, any>
    }
  }
}