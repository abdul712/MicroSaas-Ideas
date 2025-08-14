import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      subscriptionTier: string
      creditsRemaining: number
      organizations: {
        id: string
        name: string
        slug: string
        role: string
      }[]
    }
  }

  interface User {
    id: string
    subscriptionTier: string
    creditsRemaining: number
    organizations: {
      id: string
      name: string
      slug: string
      role: string
    }[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string
    subscriptionTier: string
    creditsRemaining: number
    organizations: {
      id: string
      name: string
      slug: string
      role: string
    }[]
  }
}