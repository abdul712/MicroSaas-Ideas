import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      accountId: string
      accountSlug: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    accountId: string
    accountSlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: string
    accountId: string
    accountSlug: string
  }
}