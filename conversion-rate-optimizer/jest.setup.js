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
      prefetch: jest.fn(),
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
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    user: {
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
    experiment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    event: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    variant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// Mock Redis
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hgetall: jest.fn(),
    sadd: jest.fn(),
    sismember: jest.fn(),
    smembers: jest.fn(),
    zadd: jest.fn(),
    zrange: jest.fn(),
    zrangebyscore: jest.fn(),
    pipeline: jest.fn(() => ({
      exec: jest.fn(),
      hincrby: jest.fn(),
      expire: jest.fn(),
    })),
  },
  redisService: {
    get: jest.fn(),
    set: jest.fn(),
    getJson: jest.fn(),
    setJson: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
  },
  RedisKeys: {
    session: jest.fn(),
    user: jest.fn(),
    experiment: jest.fn(),
    variant: jest.fn(),
    analytics: jest.fn(),
    heatmap: jest.fn(),
    rateLimit: jest.fn(),
    cache: jest.fn(),
  },
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock intersection observer
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock resize observer
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Mock canvas (for chart libraries)
HTMLCanvasElement.prototype.getContext = jest.fn();

// Mock crypto for UUID generation
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => 'mock-uuid'),
    getRandomValues: jest.fn((arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
  },
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    timing: {
      navigationStart: Date.now() - 1000,
      loadEventEnd: Date.now(),
      domContentLoadedEventEnd: Date.now() - 500,
    },
    getEntriesByType: jest.fn(() => []),
  },
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    hostname: 'localhost',
    pathname: '/',
    search: '',
    hash: '',
  },
  writable: true,
});

// Mock localStorage and sessionStorage
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage,
});

// Mock console methods in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Suppress specific warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
        args[0].includes('Warning: validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testUtils = {
  createMockEvent: (type, properties = {}) => ({
    type,
    properties,
    sessionId: 'test-session-id',
    userId: 'test-user-id',
    projectId: 'test-project-id',
    url: 'http://localhost:3000',
    timestamp: Date.now(),
  }),
  
  createMockExperiment: (overrides = {}) => ({
    id: 'test-experiment-id',
    name: 'Test Experiment',
    hypothesis: 'Test hypothesis',
    type: 'AB_TEST',
    status: 'RUNNING',
    projectId: 'test-project-id',
    userId: 'test-user-id',
    variants: [
      {
        id: 'control-variant',
        name: 'Control',
        isControl: true,
        trafficPercentage: 50,
        changes: [],
        visitors: 100,
        conversions: 10,
      },
      {
        id: 'test-variant',
        name: 'Test Variant',
        isControl: false,
        trafficPercentage: 50,
        changes: [
          {
            selector: '.button',
            property: 'text',
            value: 'New Button Text',
            changeType: 'text',
          },
        ],
        visitors: 100,
        conversions: 15,
      },
    ],
    ...overrides,
  }),
  
  createMockProject: (overrides = {}) => ({
    id: 'test-project-id',
    name: 'Test Project',
    domain: 'example.com',
    trackingId: 'test-tracking-id',
    userId: 'test-user-id',
    ...overrides,
  }),
  
  waitFor: (condition, timeout = 5000) =>
    new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve(true);
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    }),
};

// Set default timezone for consistent test results
process.env.TZ = 'UTC';

// Increase timeout for integration tests
jest.setTimeout(30000);