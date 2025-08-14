// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

// Mock Prisma Client
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
    expense: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    receipt: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    category: {
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
      delete: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
  },
  withUserAccess: jest.fn(() => ({})),
  withTenant: jest.fn(() => ({})),
  handlePrismaError: jest.fn(),
}));

// Mock file upload utilities
jest.mock('@/lib/storage', () => ({
  uploadReceiptToStorage: jest.fn().mockResolvedValue({
    url: 'https://example.com/receipt.jpg',
    thumbnailUrl: 'https://example.com/thumb_receipt.jpg',
  }),
  deleteReceiptFromStorage: jest.fn().mockResolvedValue(undefined),
  getReceiptSignedUrl: jest.fn().mockResolvedValue('https://example.com/signed-url'),
  validateFileUpload: jest.fn().mockReturnValue({ isValid: true }),
  generateSecureFilename: jest.fn().mockReturnValue('secure_filename.jpg'),
}));

// Mock OCR processing
jest.mock('@/lib/ocr', () => ({
  processReceiptOCR: jest.fn().mockResolvedValue({
    confidence: 0.95,
    rawData: { text: 'RECEIPT TOTAL $25.99' },
    extractedData: {
      amount: 25.99,
      date: new Date('2024-01-15'),
      merchant: 'Test Restaurant',
      currency: 'USD',
    },
  }),
  validateExtractedData: jest.fn().mockReturnValue(true),
  suggestCategory: jest.fn().mockReturnValue(['Meals & Entertainment']),
}));

// Mock rate limiting
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({
    success: true,
    limit: 100,
    remaining: 99,
    resetTime: Date.now() + 60000,
  }),
  createRateLimit: jest.fn(),
  authRateLimit: jest.fn(),
  uploadRateLimit: jest.fn(),
  apiRateLimit: jest.fn(),
  shouldBypassRateLimit: jest.fn().mockReturnValue(false),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }) => children,
  ReactQueryDevtools: () => null,
}));

// Setup global test utilities
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock File and FileReader
global.File = jest.fn().mockImplementation((chunks, filename, options) => ({
  name: filename,
  size: chunks.reduce((acc, chunk) => acc + chunk.length, 0),
  type: options?.type || 'application/octet-stream',
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(0)),
  text: jest.fn().mockResolvedValue(''),
}));

global.FileReader = jest.fn().mockImplementation(() => ({
  readAsDataURL: jest.fn(),
  readAsText: jest.fn(),
  readAsArrayBuffer: jest.fn(),
  result: null,
  onload: null,
  onerror: null,
}));

// Mock crypto for Node.js environment
const crypto = require('crypto');
Object.defineProperty(global.self, 'crypto', {
  value: {
    subtle: crypto.webcrypto?.subtle,
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
  },
});

// Silence console errors in tests unless explicitly testing error handling
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});