import { UserRole, MemberRole } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      timezone: string
      onboardingComplete: boolean
      workspaces: {
        id: string
        name: string
        slug: string
        role: MemberRole
      }[]
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    timezone: string
    emailVerified?: Date | null
    onboardingComplete: boolean
    workspaces: {
      id: string
      name: string
      slug: string
      role: MemberRole
    }[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    timezone: string
    onboardingComplete: boolean
    workspaces: {
      id: string
      name: string
      slug: string
      role: MemberRole
    }[]
  }
}