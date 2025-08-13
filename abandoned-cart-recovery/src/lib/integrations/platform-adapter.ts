import { EcommercePlatform } from '@prisma/client';

export interface CartData {
  id: string;
  customerId: string;
  email: string;
  items: CartItem[];
  value: number;
  currency: string;
  abandonedAt: Date;
  cartUrl: string;
  customerData: CustomerData;
  metadata: Record<string, any>;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  description?: string;
  image?: string;
  price: number;
  quantity: number;
  sku?: string;
  vendor?: string;
  productUrl?: string;
}

export interface CustomerData {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing?: boolean;
  totalOrders?: number;
  totalSpent?: number;
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface PlatformCredentials {
  shopDomain?: string;
  accessToken?: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  consumerKey?: string;
  consumerSecret?: string;
  storeHash?: string;
  baseUrl?: string;
}

export abstract class PlatformAdapter {
  protected credentials: PlatformCredentials;
  protected platform: EcommercePlatform;

  constructor(platform: EcommercePlatform, credentials: PlatformCredentials) {
    this.platform = platform;
    this.credentials = credentials;
  }

  // Abstract methods that each platform must implement
  abstract validateCredentials(): Promise<boolean>;
  abstract setupWebhooks(webhookUrl: string): Promise<void>;
  abstract processWebhook(payload: WebhookPayload): Promise<CartData | null>;
  abstract getAbandonedCarts(since?: Date): Promise<CartData[]>;
  abstract getCustomer(customerId: string): Promise<CustomerData | null>;
  abstract createRecoveryUrl(cartId: string): Promise<string>;
  abstract syncProducts(): Promise<void>;

  // Common utility methods
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected sanitizeString(input: string): string {
    return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  protected calculateCartValue(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  protected normalizePhoneNumber(phone?: string): string | undefined {
    if (!phone) return undefined;
    return phone.replace(/\D/g, '');
  }

  protected formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  // Error handling
  protected handleApiError(error: any, context: string): never {
    console.error(`${this.platform} API Error in ${context}:`, error);
    throw new Error(`${this.platform} integration error: ${error.message || 'Unknown error'}`);
  }

  // Rate limiting helper
  protected async rateLimitDelay(requestCount: number): Promise<void> {
    // Implement exponential backoff for rate limiting
    if (requestCount > 0 && requestCount % 10 === 0) {
      const delay = Math.min(1000 * Math.pow(2, Math.floor(requestCount / 10)), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Platform factory
export class PlatformAdapterFactory {
  static create(platform: EcommercePlatform, credentials: PlatformCredentials): PlatformAdapter {
    switch (platform) {
      case EcommercePlatform.SHOPIFY:
        return new ShopifyAdapter(credentials);
      case EcommercePlatform.WOOCOMMERCE:
        return new WooCommerceAdapter(credentials);
      case EcommercePlatform.BIGCOMMERCE:
        return new BigCommerceAdapter(credentials);
      case EcommercePlatform.MAGENTO:
        return new MagentoAdapter(credentials);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

// Import platform-specific adapters
import { ShopifyAdapter } from './shopify-adapter';
import { WooCommerceAdapter } from './woocommerce-adapter';
import { BigCommerceAdapter } from './bigcommerce-adapter';
import { MagentoAdapter } from './magento-adapter';