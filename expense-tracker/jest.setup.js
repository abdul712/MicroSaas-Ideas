// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Import Jest DOM matchers
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn(() => Promise.resolve()),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      pop: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(() => Promise.resolve()),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    }
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(() => Promise.resolve(null)),
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
      count: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    expense: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    receipt: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
  testConnection: jest.fn(() => Promise.resolve({ success: true, message: 'Test connection successful' })),
  handlePrismaError: jest.fn(),
}))

// Mock file upload and OCR services
jest.mock('@/lib/ocr', () => ({
  getReceiptProcessor: jest.fn(() => ({
    processReceipt: jest.fn(() => Promise.resolve('mock-receipt-id')),
    initialize: jest.fn(() => Promise.resolve()),
    cleanup: jest.fn(() => Promise.resolve()),
  })),
  ReceiptProcessor: jest.fn(),
}))

// Mock storage service
jest.mock('@/lib/storage', () => ({
  storageService: {
    upload: jest.fn(() => Promise.resolve('https://mock-storage.com/file.jpg')),
    delete: jest.fn(() => Promise.resolve()),
    getSignedUrl: jest.fn(() => Promise.resolve('https://mock-storage.com/signed-url')),
    exists: jest.fn(() => Promise.resolve(true)),
    generateKey: jest.fn(() => 'mock-key'),
  },
  uploadToS3: jest.fn(() => Promise.resolve('https://mock-storage.com/file.jpg')),
  deleteFromS3: jest.fn(() => Promise.resolve()),
  getSignedUrl: jest.fn(() => Promise.resolve('https://mock-storage.com/signed-url')),
  validateFile: jest.fn(() => ({ isValid: true, fileType: 'image/jpeg', fileSize: 1024 })),
}))

// Mock Redis for rate limiting
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    exists: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(1)),
    incr: jest.fn(() => Promise.resolve(1)),
    ttl: jest.fn(() => Promise.resolve(3600)),
    ping: jest.fn(() => Promise.resolve('PONG')),
    pipeline: jest.fn(() => ({
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      exec: jest.fn(() => Promise.resolve([[null, 1], [null, 1], [null, 3600]])),
    })),
    on: jest.fn(),
  }))
})

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  ratelimit: {
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 900000,
    })),
  },
  authRateLimit: {
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 5,
      remaining: 4,
      reset: Date.now() + 900000,
    })),
  },
  uploadRateLimit: {
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 50,
      remaining: 49,
      reset: Date.now() + 3600000,
    })),
  },
  ocrRateLimit: {
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 3600000,
    })),
  },
  withRateLimit: jest.fn(() => Promise.resolve({
    success: true,
    limit: 100,
    remaining: 99,
    reset: Date.now() + 900000,
  })),
}))

// Mock AWS S3
jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => ({
    upload: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({
        Location: 'https://mock-s3-bucket.s3.amazonaws.com/mock-file.jpg',
        ETag: '"mock-etag"',
        Bucket: 'mock-bucket',
        Key: 'mock-key',
      })),
    })),
    deleteObject: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve()),
    })),
    getSignedUrlPromise: jest.fn(() => Promise.resolve('https://mock-signed-url.com')),
    headObject: jest.fn(() => ({
      promise: jest.fn(() => Promise.resolve({
        ContentLength: 1024,
        ContentType: 'image/jpeg',
      })),
    })),
  })),
}))

// Mock crypto for consistent tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'mock-uuid-1234-5678-9abc-def0',
    randomBytes: (size) => Buffer.alloc(size, 0),
    createHash: (algorithm) => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn(() => 'mock-hash'),
    }),
    scryptSync: jest.fn(() => Buffer.alloc(32, 1)),
    createCipher: jest.fn(() => ({
      update: jest.fn(() => 'encrypted-part'),
      final: jest.fn(() => 'final-part'),
      setAAD: jest.fn(),
      getAuthTag: jest.fn(() => Buffer.alloc(16, 2)),
    })),
    createDecipher: jest.fn(() => ({
      update: jest.fn(() => 'decrypted-part'),
      final: jest.fn(() => 'final-part'),
      setAAD: jest.fn(),
      setAuthTag: jest.fn(),
    })),
  },
})

// Global test timeout
jest.setTimeout(30000)

// Suppress console warnings during tests (optional)
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('ReactDOMTestUtils.act') ||
      args[0].includes('Warning: ')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})