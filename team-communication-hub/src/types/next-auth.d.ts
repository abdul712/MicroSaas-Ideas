import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      username: string
      firstName: string
      lastName: string
      avatarUrl?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
    password?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
}