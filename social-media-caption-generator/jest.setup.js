import '@testing-library/jest-dom';

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: 'test',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  OPENAI_API_KEY: 'sk-test-key',
  ANTHROPIC_API_KEY: 'test-key',
  GOOGLE_AI_API_KEY: 'test-key',
  STRIPE_SECRET_KEY: 'sk_test_123',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
};

// Mock next/navigation
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
    getAll: jest.fn(),
    has: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
    toString: jest.fn(),
  }),
  usePathname: () => '/test-path',
  redirect: jest.fn(),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
}));

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
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      upsert: jest.fn(),
    },
    caption: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    brandVoice: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    image: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    userAnalytics: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

// Mock AI services
jest.mock('@/lib/ai/openai', () => ({
  generateCaption: jest.fn(),
  generateEmbedding: jest.fn(),
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
    embeddings: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/ai/anthropic', () => ({
  generateCaption: jest.fn(),
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
}));

jest.mock('@/lib/ai/google', () => ({
  generateCaption: jest.fn(),
  googleAI: {
    getGenerativeModel: jest.fn(),
  },
}));

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
    subscriptions: {
      update: jest.fn(),
      cancel: jest.fn(),
      retrieve: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  },
  createCheckoutSession: jest.fn(),
  createCustomer: jest.fn(),
  STRIPE_PLANS: {
    FREE: { name: 'Free', price: 0, credits: 20 },
    CREATOR: { name: 'Creator', price: 1900, credits: 200 },
    PROFESSIONAL: { name: 'Professional', price: 4900, credits: 1000 },
    AGENCY: { name: 'Agency', price: 14900, credits: 5000 },
  },
}));

// Mock Google Vision
jest.mock('@/lib/vision', () => ({
  analyzeImage: jest.fn(),
  generateImageSummary: jest.fn(),
  categorizeImageContent: jest.fn(),
  extractHashtagSuggestions: jest.fn(),
}));

// Mock monitoring
jest.mock('@/lib/monitoring', () => ({
  monitoring: {
    trackPerformance: jest.fn(),
    trackEvent: jest.fn(),
    trackError: jest.fn(),
    trackAIGeneration: jest.fn(),
    timeFunction: jest.fn(async (name, fn) => await fn()),
  },
}));

// Mock File API
global.File = class MockFile {
  constructor(parts, filename, properties) {
    this.parts = parts;
    this.name = filename;
    this.type = properties?.type || 'text/plain';
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
  }

  async arrayBuffer() {
    return new ArrayBuffer(this.size);
  }

  async text() {
    return this.parts.join('');
  }
};

// Mock FormData
global.FormData = class MockFormData {
  constructor() {
    this.data = new Map();
  }

  append(key, value) {
    this.data.set(key, value);
  }

  get(key) {
    return this.data.get(key);
  }

  entries() {
    return this.data.entries();
  }
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock console.error for cleaner test output
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

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    subscription: {
      plan: 'CREATOR',
      credits: 100,
      maxCredits: 200,
    },
    ...overrides,
  }),

  createMockCaption: (overrides = {}) => ({
    id: 'test-caption-id',
    userId: 'test-user-id',
    content: 'Test caption content',
    platform: 'INSTAGRAM_FEED',
    hashtags: ['test', 'caption'],
    emojis: ['✨'],
    aiProvider: 'OPENAI',
    modelUsed: 'gpt-4',
    qualityScore: 0.85,
    brandVoiceMatch: 0.90,
    createdAt: new Date(),
    ...overrides,
  }),

  createMockBrandVoice: (overrides = {}) => ({
    id: 'test-brand-voice-id',
    name: 'Test Brand Voice',
    type: 'PROFESSIONAL',
    examples: ['Example 1', 'Example 2', 'Example 3'],
    keywords: ['professional', 'expert', 'quality'],
    userId: 'test-user-id',
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    ...overrides,
  }),

  createMockImage: (overrides = {}) => ({
    id: 'test-image-id',
    userId: 'test-user-id',
    filename: 'test-image.jpg',
    originalUrl: 'https://example.com/test-image.jpg',
    size: 1024000,
    width: 1920,
    height: 1080,
    format: 'jpeg',
    tags: ['test', 'image'],
    objects: ['laptop', 'desk'],
    colors: ['#ffffff', '#000000'],
    faces: 0,
    createdAt: new Date(),
    ...overrides,
  }),
};