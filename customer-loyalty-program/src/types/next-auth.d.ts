import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'
    }
  }

  interface User {
    role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'CUSTOMER' | 'BUSINESS_OWNER' | 'ADMIN'
  }
}