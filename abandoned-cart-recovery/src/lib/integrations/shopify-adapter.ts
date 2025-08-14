import { EcommercePlatform } from '@prisma/client';
import { PlatformAdapter, CartData, CustomerData, WebhookPayload, PlatformCredentials } from './platform-adapter';
import crypto from 'crypto';

export class ShopifyAdapter extends PlatformAdapter {
  private readonly apiVersion = '2024-01';
  private readonly baseUrl: string;

  constructor(credentials: PlatformCredentials) {
    super(EcommercePlatform.SHOPIFY, credentials);
    this.baseUrl = `https://${credentials.shopDomain}/admin/api/${this.apiVersion}`;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/shop.json');
      return response.shop && response.shop.domain === this.credentials.shopDomain;
    } catch (error) {
      return false;
    }
  }

  async setupWebhooks(webhookUrl: string): Promise<void> {
    const webhooks = [
      {
        topic: 'carts/create',
        address: `${webhookUrl}/shopify/cart-create`,
        format: 'json'
      },
      {
        topic: 'carts/update',
        address: `${webhookUrl}/shopify/cart-update`,
        format: 'json'
      },
      {
        topic: 'orders/create',
        address: `${webhookUrl}/shopify/order-create`,
        format: 'json'
      },
      {
        topic: 'customers/update',
        address: `${webhookUrl}/shopify/customer-update`,
        format: 'json'
      }
    ];

    for (const webhook of webhooks) {
      try {
        await this.makeRequest('/webhooks.json', 'POST', { webhook });
      } catch (error) {
        console.warn(`Failed to create webhook for ${webhook.topic}:`, error);
      }
    }
  }

  async processWebhook(payload: WebhookPayload): Promise<CartData | null> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload)) {
      throw new Error('Invalid webhook signature');
    }

    const { event, data } = payload;

    switch (event) {
      case 'carts/create':
      case 'carts/update':
        return this.processCartWebhook(data);
      case 'orders/create':
        // Mark cart as recovered if order is created
        return null; // Handle in order processing
      default:
        return null;
    }
  }

  async getAbandonedCarts(since?: Date): Promise<CartData[]> {
    try {
      const sinceParam = since ? `&updated_at_min=${since.toISOString()}` : '';
      const response = await this.makeRequest(`/checkouts.json?status=abandoned${sinceParam}`);
      
      return response.checkouts.map((checkout: any) => this.transformCheckoutToCart(checkout));
    } catch (error) {
      this.handleApiError(error, 'getAbandonedCarts');
    }
  }

  async getCustomer(customerId: string): Promise<CustomerData | null> {
    try {
      const response = await this.makeRequest(`/customers/${customerId}.json`);
      return this.transformCustomer(response.customer);
    } catch (error) {
      if (error.status === 404) return null;
      this.handleApiError(error, 'getCustomer');
    }
  }

  async createRecoveryUrl(cartId: string): Promise<string> {
    try {
      const response = await this.makeRequest(`/checkouts/${cartId}.json`);
      const checkout = response.checkout;
      
      if (checkout && checkout.abandoned_checkout_url) {
        return checkout.abandoned_checkout_url;
      }
      
      // Fallback: create recovery URL manually
      return `https://${this.credentials.shopDomain}/cart/${checkout.token}`;
    } catch (error) {
      this.handleApiError(error, 'createRecoveryUrl');
    }
  }

  async syncProducts(): Promise<void> {
    try {
      let page = 1;
      const limit = 250;
      
      while (true) {
        const response = await this.makeRequest(`/products.json?limit=${limit}&page=${page}`);
        
        if (response.products.length === 0) break;
        
        // Process products (store in database, update search index, etc.)
        await this.processProducts(response.products);
        
        if (response.products.length < limit) break;
        page++;
      }
    } catch (error) {
      this.handleApiError(error, 'syncProducts');
    }
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'X-Shopify-Access-Token': this.credentials.accessToken!,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Shopify API error: ${response.status} ${errorText}`);
    }

    return response.json();
  }

  private verifyWebhookSignature(payload: WebhookPayload): boolean {
    if (!this.credentials.webhookSecret || !payload.signature) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', this.credentials.webhookSecret);
    hmac.update(JSON.stringify(payload.data));
    const calculatedSignature = hmac.digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(payload.signature, 'base64'),
      Buffer.from(calculatedSignature, 'base64')
    );
  }

  private processCartWebhook(checkoutData: any): CartData {
    return this.transformCheckoutToCart(checkoutData);
  }

  private transformCheckoutToCart(checkout: any): CartData {
    const items = checkout.line_items?.map((item: any) => ({
      id: item.id.toString(),
      productId: item.product_id?.toString(),
      variantId: item.variant_id?.toString(),
      title: item.title,
      description: item.variant_title,
      image: item.image_url,
      price: parseFloat(item.price),
      quantity: item.quantity,
      sku: item.sku,
      vendor: item.vendor,
      productUrl: `https://${this.credentials.shopDomain}/products/${item.handle || item.product_id}`,
    })) || [];

    return {
      id: checkout.id.toString(),
      customerId: checkout.customer?.id?.toString() || 'guest',
      email: checkout.email,
      items,
      value: parseFloat(checkout.total_price || '0'),
      currency: checkout.currency,
      abandonedAt: new Date(checkout.updated_at),
      cartUrl: checkout.abandoned_checkout_url || `https://${this.credentials.shopDomain}/cart/${checkout.token}`,
      customerData: checkout.customer ? this.transformCustomer(checkout.customer) : {
        id: 'guest',
        email: checkout.email,
        firstName: checkout.billing_address?.first_name,
        lastName: checkout.billing_address?.last_name,
        phone: checkout.billing_address?.phone,
      },
      metadata: {
        token: checkout.token,
        gateway: checkout.gateway,
        landing_site: checkout.landing_site,
        referring_site: checkout.referring_site,
        source_name: checkout.source_name,
        device_id: checkout.device_id,
        browser_ip: checkout.browser_ip,
        user_agent: checkout.user_agent,
      },
    };
  }

  private transformCustomer(customer: any): CustomerData {
    return {
      id: customer.id.toString(),
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phone: this.normalizePhoneNumber(customer.phone),
      acceptsMarketing: customer.accepts_marketing,
      totalOrders: customer.orders_count || 0,
      totalSpent: parseFloat(customer.total_spent || '0'),
    };
  }

  private async processProducts(products: any[]): Promise<void> {
    // This would typically involve storing products in database
    // for use in recovery emails and recommendations
    console.log(`Processing ${products.length} Shopify products`);
    // Implementation would depend on product storage strategy
  }
}