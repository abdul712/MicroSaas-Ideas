import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: string
      organizationId: string
      organization: {
        id: string
        name: string
        domain: string
        plan: string
      }
    } & DefaultSession['user']
  }

  interface User {
    id: string
    role: string
    organizationId: string
    organization: {
      id: string
      name: string
      domain: string
      plan: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    organizationId: string
    organization: {
      id: string
      name: string
      domain: string
      plan: string
    }
  }
}