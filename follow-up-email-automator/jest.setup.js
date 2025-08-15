import '@testing-library/jest-dom'

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

jest.mock('next/headers', () => ({
  cookies: () => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
  headers: () => new Map(),
}))

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        organizationId: 'org-1',
      },
    },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
  SessionProvider: ({ children }) => children,
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
      delete: jest.fn(),
    },
    contact: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    emailTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    emailSequence: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    emailSend: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    emailEvent: {
      findMany: jest.fn(),
      create: jest.fn(),
      groupBy: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

// Mock email services
jest.mock('@/services/email', () => ({
  emailService: {
    sendEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test-message-id',
      provider: 'SENDGRID',
    }),
    verifyDomain: jest.fn().mockResolvedValue({
      isVerified: true,
      dkim: true,
      spf: true,
      dmarc: true,
      mx: true,
    }),
    analyzeDeliverability: jest.fn().mockResolvedValue({
      spamScore: 20,
      issues: [],
      suggestions: [],
      dkimValid: true,
      spfValid: true,
    }),
  },
}))

// Mock AI service
jest.mock('@/services/ai', () => ({
  aiEmailService: {
    generateEmailContent: jest.fn().mockResolvedValue({
      subject: 'Test Subject',
      bodyHtml: '<p>Test content</p>',
      bodyText: 'Test content',
      variables: ['firstName', 'company'],
      suggestions: [],
    }),
    optimizeSubjectLine: jest.fn().mockResolvedValue([
      'Optimized Subject 1',
      'Optimized Subject 2',
    ]),
    analyzeEmailSentiment: jest.fn().mockResolvedValue({
      sentiment: 'positive',
      score: 75,
      suggestions: ['Great tone!'],
    }),
    checkSpamScore: jest.fn().mockResolvedValue({
      score: 85,
      issues: [],
      suggestions: [],
    }),
  },
}))

// Mock queue services
jest.mock('@/lib/queue', () => ({
  addEmailToQueue: jest.fn().mockResolvedValue({ id: 'job-1' }),
  addSequenceToQueue: jest.fn().mockResolvedValue({ id: 'job-2' }),
  addAnalyticsToQueue: jest.fn().mockResolvedValue({ id: 'job-3' }),
  getQueueStats: jest.fn().mockResolvedValue({
    email: { waiting: 0, active: 0, completed: 10, failed: 0 },
    sequence: { waiting: 0, active: 0, completed: 5, failed: 0 },
  }),
}))

// Mock React Flow
jest.mock('react-flow-renderer', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="react-flow">{children}</div>,
  Controls: () => <div data-testid="react-flow-controls" />,
  Background: () => <div data-testid="react-flow-background" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  Panel: ({ children }) => <div data-testid="react-flow-panel">{children}</div>,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
}))

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  Pie: () => <div data-testid="pie" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Cell: () => <div data-testid="cell" />,
}))

// Mock file APIs
Object.defineProperty(window, 'File', {
  value: class MockFile {
    constructor(parts, filename, properties = {}) {
      this.parts = parts
      this.name = filename
      this.type = properties.type || ''
      this.size = parts.join('').length
    }
  },
})

Object.defineProperty(window, 'FileReader', {
  value: class MockFileReader {
    constructor() {
      this.readAsText = jest.fn(() => {
        if (this.onload) {
          this.onload({ target: { result: 'mocked file content' } })
        }
      })
    }
  },
})

// Global test utilities
global.mockPrismaResponse = (model, method, response) => {
  require('@/lib/prisma').prisma[model][method].mockResolvedValue(response)
}

global.mockEmailServiceResponse = (method, response) => {
  require('@/services/email').emailService[method].mockResolvedValue(response)
}

global.mockAIServiceResponse = (method, response) => {
  require('@/services/ai').aiEmailService[method].mockResolvedValue(response)
}

// Setup/teardown
beforeEach(() => {
  jest.clearAllMocks()
})

afterEach(() => {
  jest.restoreAllMocks()
})