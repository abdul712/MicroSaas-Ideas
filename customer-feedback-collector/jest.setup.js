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
    return {
      get: jest.fn(),
      getAll: jest.fn(),
      has: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      entries: jest.fn(),
      forEach: jest.fn(),
      toString: jest.fn(),
    }
  },
  usePathname() {
    return '/'
  },
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    survey: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    response: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
  createTenantClient: jest.fn(() => ({
    survey: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}))

// Mock OpenAI
jest.mock('@/lib/openai', () => ({
  analyzeSentiment: jest.fn().mockResolvedValue({
    overallScore: 0.5,
    sentiment: 'POSITIVE',
    confidence: 0.8,
    emotions: {
      joy: 0.6,
      anger: 0.1,
      fear: 0.1,
      sadness: 0.1,
      surprise: 0.1,
      disgust: 0.0,
    },
    topics: ['product quality'],
    keywords: ['good', 'quality'],
    language: 'en',
  }),
  generateResponseSummary: jest.fn().mockResolvedValue({
    keyInsights: ['Overall positive feedback'],
    actionItems: ['Continue quality focus'],
    overallTheme: 'Quality satisfaction',
    urgency: 'LOW',
  }),
  categorizeResponse: jest.fn().mockResolvedValue(['Product Quality']),
}))

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimiters: {
    api: {
      limit: jest.fn().mockResolvedValue({
        success: true,
        remaining: 99,
        resetTime: Date.now() + 900000,
      }),
    },
    auth: {
      limit: jest.fn().mockResolvedValue({
        success: true,
        remaining: 9,
        resetTime: Date.now() + 900000,
      }),
    },
  },
  getClientIdentifier: jest.fn().mockReturnValue('127.0.0.1'),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Setup test database if needed
beforeAll(async () => {
  // Any global setup
})

afterAll(async () => {
  // Any global teardown
})