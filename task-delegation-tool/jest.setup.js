import '@testing-library/jest-dom'
import { jest } from '@jest/globals'
import { TextEncoder, TextDecoder } from 'util'

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn().mockResolvedValue(undefined),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}))

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        organizationId: 'test-org-id',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  SessionProvider: ({ children }) => children,
}))

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
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
    },
    $disconnect: jest.fn(),
  },
}))

// Mock Redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    ping: jest.fn().mockResolvedValue('PONG'),
  },
  RedisService: {
    setCache: jest.fn(),
    getCache: jest.fn(),
    deleteCache: jest.fn(),
    setUserPresence: jest.fn(),
    getUserPresence: jest.fn(),
    publishTaskUpdate: jest.fn(),
    checkRateLimit: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 100,
      resetTime: Date.now() + 3600000,
    }),
  },
}))

// Mock AI service
jest.mock('@/ai/task-intelligence', () => ({
  AITaskService: {
    analyzeComplexity: jest.fn().mockResolvedValue({
      complexity: 0.5,
      confidence: 0.8,
      factors: {
        textComplexity: 0.4,
        skillRequirement: 0.6,
        estimatedEffort: 0.5,
        dependencies: 0.3,
      },
    }),
    suggestAssignee: jest.fn().mockResolvedValue({
      userId: 'suggested-user-id',
      matchScore: 0.85,
      confidence: 0.9,
      reasons: ['Strong skill match', 'Available capacity'],
      risk: 0.2,
    }),
    calculateMatchScore: jest.fn().mockResolvedValue({
      overall: 0.85,
      confidence: 0.9,
      skillMatch: 0.9,
      availability: 0.8,
      performance: 0.85,
      riskScore: 0.2,
    }),
    getTaskInsights: jest.fn().mockResolvedValue({
      riskScore: 0.3,
      completionProbability: 0.85,
      suggestedDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      cognitiveLoadImpact: 0.4,
      flowStateOptimal: true,
      recommendations: ['Task appears well-structured'],
    }),
  },
}))

// Mock React Query
jest.mock('react-query', () => ({
  useQuery: jest.fn().mockReturnValue({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useMutation: jest.fn().mockReturnValue({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
  }),
  QueryClient: jest.fn().mockImplementation(() => ({
    getQueryData: jest.fn(),
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
}))

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    toasts: [],
    dismiss: jest.fn(),
  }),
}))

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    fit: jest.fn(),
    predict: jest.fn(),
    evaluate: jest.fn(),
  })),
  layers: {
    dense: jest.fn(),
    dropout: jest.fn(),
  },
  loadLayersModel: jest.fn(),
  tensor: jest.fn(),
  dispose: jest.fn(),
}))

// Mock crypto for Node.js
const crypto = require('crypto')

Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => crypto.randomUUID(),
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
  },
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null
  }
  unobserve() {
    return null
  }
  disconnect() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {
    return null
  }
  unobserve() {
    return null
  }
  disconnect() {
    return null
  }
}

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

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

// Mock fetch
global.fetch = jest.fn()

// Suppress console warnings in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
})