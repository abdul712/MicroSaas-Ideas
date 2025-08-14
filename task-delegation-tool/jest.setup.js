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
    return ''
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

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  ready: jest.fn().mockResolvedValue(undefined),
  sequential: jest.fn().mockReturnValue({
    add: jest.fn(),
    compile: jest.fn(),
    predict: jest.fn().mockReturnValue({
      data: jest.fn().mockResolvedValue([0.5]),
      dispose: jest.fn(),
    }),
    dispose: jest.fn(),
  }),
  layers: {
    dense: jest.fn().mockReturnValue({}),
    dropout: jest.fn().mockReturnValue({}),
    batchNormalization: jest.fn().mockReturnValue({}),
  },
  train: {
    adam: jest.fn().mockReturnValue({}),
  },
  tensor2d: jest.fn().mockReturnValue({
    dispose: jest.fn(),
  }),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    taskUpdate: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    aiInsight: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}))

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Global test setup
beforeAll(() => {
  // Setup global test environment
})

afterAll(() => {
  // Cleanup global test environment
})

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
})

// Add custom matchers
expect.extend({
  toBeValidTaskStatus(received) {
    const validStatuses = ['PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED', 'CANCELLED']
    const pass = validStatuses.includes(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid task status`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid task status`,
        pass: false,
      }
    }
  },
  
  toBeValidPriority(received) {
    const validPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
    const pass = validPriorities.includes(received)
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid priority`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be a valid priority`,
        pass: false,
      }
    }
  },
})

// Mock ResizeObserver for charts
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Suppress console warnings during tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})