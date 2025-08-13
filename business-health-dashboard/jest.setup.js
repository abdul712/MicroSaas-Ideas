import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Auth0
jest.mock('@auth0/nextjs-auth0/client', () => ({
  useUser: () => ({
    user: {
      sub: 'auth0|123456789',
      name: 'Test User',
      email: 'test@example.com',
    },
    error: null,
    isLoading: false,
  }),
  UserProvider: ({ children }) => children,
}))

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NODE_ENV = 'test'