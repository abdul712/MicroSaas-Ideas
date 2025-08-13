import { 
  User, 
  Business, 
  Client, 
  Invoice, 
  InvoiceItem, 
  Payment, 
  Template,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionTier
} from '@prisma/client'

export type UserWithRelations = User & {
  businesses?: Business[]
  invoices?: InvoiceWithRelations[]
  clients?: Client[]
}

export type InvoiceWithRelations = Invoice & {
  client: Client
  business?: Business
  items: InvoiceItem[]
  payments: Payment[]
  template?: Template
}

export type ClientWithInvoices = Client & {
  invoices: Invoice[]
  payments: Payment[]
}

export interface CreateInvoiceData {
  clientId: string
  businessId?: string
  title?: string
  currency: string
  items: {
    description: string
    quantity: number
    rate: number
    taxRate?: number
  }[]
  taxes?: {
    name: string
    rate: number
  }[]
  discounts?: {
    name: string
    type: 'PERCENTAGE' | 'FIXED'
    value: number
  }[]
  notes?: string
  terms?: string
  footer?: string
  dueDate: Date
  templateId?: string
}

export interface CreateClientData {
  firstName: string
  lastName?: string
  company?: string
  email: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  taxNumber?: string
  website?: string
  notes?: string
  paymentTerms?: number
}

export interface CreatePaymentData {
  invoiceId: string
  amount: number
  currency: string
  method: PaymentMethod
  notes?: string
  paidDate?: Date
}

export interface DashboardStats {
  totalInvoices: number
  totalRevenue: number
  totalOutstanding: number
  totalOverdue: number
  paidInvoices: number
  unpaidInvoices: number
  overdueInvoices: number
  averageInvoiceValue: number
  recentInvoices: InvoiceWithRelations[]
  topClients: (Client & { totalPaid: number; invoiceCount: number })[]
  monthlyRevenue: { month: string; revenue: number }[]
}

export interface InvoiceFilters {
  status?: InvoiceStatus[]
  clientId?: string
  dateFrom?: Date
  dateTo?: Date
  amountMin?: number
  amountMax?: number
  search?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  thumbnail?: string
  design: {
    colors: {
      primary: string
      secondary: string
      accent: string
    }
    fonts: {
      heading: string
      body: string
    }
    layout: string
    logo?: {
      url: string
      position: 'left' | 'center' | 'right'
      size: 'small' | 'medium' | 'large'
    }
  }
}

export interface CurrencyRate {
  code: string
  name: string
  rate: number
  symbol: string
}

export interface NotificationPreferences {
  invoiceSent: boolean
  invoiceViewed: boolean
  invoicePaid: boolean
  invoiceOverdue: boolean
  paymentReceived: boolean
  weeklyReport: boolean
  monthlyReport: boolean
}

export {
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  SubscriptionTier,
}