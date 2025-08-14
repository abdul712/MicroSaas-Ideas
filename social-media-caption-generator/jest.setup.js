import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// Setup global variables
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock environment variables
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.GOOGLE_AI_API_KEY = 'test-google-key';

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
        emit: jest.fn()
      },
      isFallback: false,
      isLocaleDomain: false,
      isReady: true,
      defaultLocale: 'en',
      domainLocales: [],
      isPreview: false
    };
  }
}));

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      prefetch: jest.fn()
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  }
}));

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession() {
    return {
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'USER',
          subscription: {
            tier: 'FREE',
            status: 'ACTIVE',
            creditsRemaining: 20
          }
        }
      },
      status: 'authenticated'
    };
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn(),
  SessionProvider: ({ children }) => children
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
      upsert: jest.fn()
    },
    caption: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    brandVoice: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    generation: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    },
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn()
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn()
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $disconnect: jest.fn()
  }
}));

// Mock AI services
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Generated caption content'
            }
          }],
          usage: {
            total_tokens: 100
          }
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{
          embedding: new Array(1536).fill(0.1)
        }]
      })
    }
  }));
});

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: 'Generated caption content'
        }],
        usage: {
          input_tokens: 50,
          output_tokens: 50
        }
      })
    }
  }));
});

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: jest.fn().mockReturnValue('Generated caption content')
        }
      })
    })
  }))
}));

// Mock Google Vision API
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    annotateImage: jest.fn().mockResolvedValue([{
      localizedObjectAnnotations: [],
      faceAnnotations: [],
      textAnnotations: [],
      imagePropertiesAnnotation: {
        dominantColors: {
          colors: []
        }
      },
      safeSearchAnnotation: {
        adult: 'VERY_UNLIKELY',
        violence: 'VERY_UNLIKELY',
        racy: 'VERY_UNLIKELY',
        medical: 'VERY_UNLIKELY'
      }
    }])
  }))
}));

// Mock Pinecone
jest.mock('@pinecone-database/pinecone', () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: jest.fn().mockReturnValue({
      upsert: jest.fn().mockResolvedValue({}),
      query: jest.fn().mockResolvedValue({
        matches: []
      }),
      deleteOne: jest.fn().mockResolvedValue({})
    })
  }))
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({
        id: 'cus_test123'
      }),
      retrieve: jest.fn().mockResolvedValue({
        id: 'cus_test123',
        metadata: {
          userId: 'test-user-id'
        }
      })
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: 'cs_test123',
          url: 'https://checkout.stripe.com/test'
        })
      }
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://billing.stripe.com/test'
        })
      }
    },
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
        cancel_at_period_end: false,
        items: {
          data: [{
            price: {
              id: 'price_test123'
            }
          }]
        }
      })
    }
  }));
});

// Mock Socket.IO
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    emit: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  }))
}));

// Mock React Hook Form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    register: jest.fn(),
    handleSubmit: jest.fn(),
    formState: {
      errors: {},
      isSubmitting: false,
      isValid: true
    },
    watch: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(),
    reset: jest.fn(),
    control: {}
  }),
  Controller: ({ render }) => render({
    field: {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: '',
      name: 'test'
    },
    fieldState: {
      error: null
    }
  })
}));

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    img: ({ children, ...props }) => <img {...props}>{children}</img>
  },
  AnimatePresence: ({ children }) => children
}));

// Mock File API
global.File = class MockFile {
  constructor(parts, filename, properties = {}) {
    this.parts = parts;
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = properties.type || '';
    this.lastModified = Date.now();
  }
};

global.FileReader = class MockFileReader {
  readAsDataURL(file) {
    this.result = 'data:image/jpeg;base64,test-image-data';
    setTimeout(() => {
      this.onload({ target: this });
    }, 0);
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: An invalid form control'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});