import axios from 'axios';
import { logger } from '../../utils/logger';
import { cache } from '../../utils/redis';

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
  webhookSecret?: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  price: string;
  compare_at_price?: string;
  images: Array<{
    id: number;
    src: string;
    alt?: string;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    inventory_quantity: number;
  }>;
}

export interface ShopifyOrder {
  id: number;
  order_number: string;
  total_price: string;
  subtotal_price: string;
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    quantity: number;
    price: string;
  }>;
  created_at: string;
}

export interface ShopifyCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  total_spent: string;
  created_at: string;
  updated_at: string;
}

export class ShopifyIntegration {
  private config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shopDomain}.myshopify.com/admin/api/2023-10`;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'X-Shopify-Access-Token': this.config.accessToken,
          'Content-Type': 'application/json',
        },
        data,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Shopify API error:', {
        endpoint,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw new Error(`Shopify API error: ${error.response?.data?.errors || error.message}`);
    }
  }

  // Products
  async getProducts(limit: number = 50, page?: string): Promise<{ products: ShopifyProduct[]; nextPage?: string }> {
    const cacheKey = `shopify:products:${this.config.shopDomain}:${limit}:${page || 'first'}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      let endpoint = `/products.json?limit=${limit}`;
      if (page) {
        endpoint += `&page_info=${page}`;
      }

      const response = await this.makeRequest(endpoint);
      
      // Extract next page info from Link header if available
      const linkHeader = response.headers?.link;
      let nextPage: string | undefined;
      
      if (linkHeader) {
        const nextMatch = linkHeader.match(/<[^>]+page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        if (nextMatch) {
          nextPage = nextMatch[1];
        }
      }

      const result = {
        products: response.products,
        nextPage,
      };

      // Cache for 5 minutes
      await cache.set(cacheKey, JSON.stringify(result), 300);

      return result;
    } catch (error) {
      logger.error('Error fetching Shopify products:', error);
      throw error;
    }
  }

  async getProduct(productId: number): Promise<ShopifyProduct> {
    const cacheKey = `shopify:product:${this.config.shopDomain}:${productId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.makeRequest(`/products/${productId}.json`);
      
      // Cache for 10 minutes
      await cache.set(cacheKey, JSON.stringify(response.product), 600);

      return response.product;
    } catch (error) {
      logger.error('Error fetching Shopify product:', error);
      throw error;
    }
  }

  // Orders
  async getOrders(
    limit: number = 50,
    status: 'open' | 'closed' | 'cancelled' | 'any' = 'any',
    createdAtMin?: Date,
    createdAtMax?: Date
  ): Promise<ShopifyOrder[]> {
    try {
      let endpoint = `/orders.json?limit=${limit}&status=${status}`;
      
      if (createdAtMin) {
        endpoint += `&created_at_min=${createdAtMin.toISOString()}`;
      }
      
      if (createdAtMax) {
        endpoint += `&created_at_max=${createdAtMax.toISOString()}`;
      }

      const response = await this.makeRequest(endpoint);
      return response.orders;
    } catch (error) {
      logger.error('Error fetching Shopify orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<ShopifyOrder> {
    try {
      const response = await this.makeRequest(`/orders/${orderId}.json`);
      return response.order;
    } catch (error) {
      logger.error('Error fetching Shopify order:', error);
      throw error;
    }
  }

  // Customers
  async getCustomers(limit: number = 50): Promise<ShopifyCustomer[]> {
    const cacheKey = `shopify:customers:${this.config.shopDomain}:${limit}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await this.makeRequest(`/customers.json?limit=${limit}`);
      
      // Cache for 5 minutes
      await cache.set(cacheKey, JSON.stringify(response.customers), 300);

      return response.customers;
    } catch (error) {
      logger.error('Error fetching Shopify customers:', error);
      throw error;
    }
  }

  async getCustomer(customerId: number): Promise<ShopifyCustomer> {
    try {
      const response = await this.makeRequest(`/customers/${customerId}.json`);
      return response.customer;
    } catch (error) {
      logger.error('Error fetching Shopify customer:', error);
      throw error;
    }
  }

  // Analytics
  async getAnalytics(startDate: Date, endDate: Date) {
    try {
      // Get orders in date range
      const orders = await this.getOrders(
        250, // max limit
        'any',
        startDate,
        endDate
      );

      // Calculate metrics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group by day
      const dailyStats = orders.reduce((acc, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { orders: 0, revenue: 0 };
        }
        acc[date].orders += 1;
        acc[date].revenue += parseFloat(order.total_price);
        return acc;
      }, {} as Record<string, { orders: number; revenue: number }>);

      // Top products
      const productStats = orders.reduce((acc, order) => {
        order.line_items.forEach(item => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = {
              title: item.title,
              quantity: 0,
              revenue: 0,
            };
          }
          acc[item.product_id].quantity += item.quantity;
          acc[item.product_id].revenue += parseFloat(item.price) * item.quantity;
        });
        return acc;
      }, {} as Record<number, { title: string; quantity: number; revenue: number }>);

      const topProducts = Object.entries(productStats)
        .map(([id, stats]) => ({ productId: parseInt(id), ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      return {
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
        },
        dailyStats,
        topProducts,
      };
    } catch (error) {
      logger.error('Error fetching Shopify analytics:', error);
      throw error;
    }
  }

  // Webhooks
  async createWebhook(topic: string, address: string) {
    try {
      const webhook = {
        webhook: {
          topic,
          address,
          format: 'json',
        },
      };

      const response = await this.makeRequest('/webhooks.json', 'POST', webhook);
      return response.webhook;
    } catch (error) {
      logger.error('Error creating Shopify webhook:', error);
      throw error;
    }
  }

  async getWebhooks() {
    try {
      const response = await this.makeRequest('/webhooks.json');
      return response.webhooks;
    } catch (error) {
      logger.error('Error fetching Shopify webhooks:', error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: number) {
    try {
      await this.makeRequest(`/webhooks/${webhookId}.json`, 'DELETE');
      return true;
    } catch (error) {
      logger.error('Error deleting Shopify webhook:', error);
      throw error;
    }
  }

  // Verification
  static verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const computedSignature = hmac.digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(computedSignature, 'base64')
    );
  }

  // Store validation
  async validateConnection(): Promise<{ valid: boolean; shop?: any; error?: string }> {
    try {
      const response = await this.makeRequest('/shop.json');
      return {
        valid: true,
        shop: response.shop,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  // Cart recovery data
  async getAbandonedCheckouts(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/checkouts.json?limit=${limit}&status=open`);
      return response.checkouts || [];
    } catch (error) {
      logger.error('Error fetching abandoned checkouts:', error);
      throw error;
    }
  }

  // Inventory tracking
  async getInventoryLevels(productIds: number[]): Promise<Record<number, number>> {
    try {
      const inventoryLevels: Record<number, number> = {};
      
      // Get product variants and their inventory
      for (const productId of productIds) {
        const product = await this.getProduct(productId);
        product.variants.forEach(variant => {
          inventoryLevels[variant.id] = variant.inventory_quantity;
        });
      }

      return inventoryLevels;
    } catch (error) {
      logger.error('Error fetching inventory levels:', error);
      throw error;
    }
  }

  // Theme/Script Tag management for A/B testing
  async createScriptTag(src: string, displayScope: 'online_store' | 'order_status' = 'online_store') {
    try {
      const scriptTag = {
        script_tag: {
          event: 'onload',
          src,
          display_scope: displayScope,
        },
      };

      const response = await this.makeRequest('/script_tags.json', 'POST', scriptTag);
      return response.script_tag;
    } catch (error) {
      logger.error('Error creating Shopify script tag:', error);
      throw error;
    }
  }

  async getScriptTags() {
    try {
      const response = await this.makeRequest('/script_tags.json');
      return response.script_tags;
    } catch (error) {
      logger.error('Error fetching Shopify script tags:', error);
      throw error;
    }
  }

  async deleteScriptTag(scriptTagId: number) {
    try {
      await this.makeRequest(`/script_tags/${scriptTagId}.json`, 'DELETE');
      return true;
    } catch (error) {
      logger.error('Error deleting Shopify script tag:', error);
      throw error;
    }
  }

  // Metafields for storing test data
  async createProductMetafield(productId: number, namespace: string, key: string, value: any, type: string = 'json') {
    try {
      const metafield = {
        metafield: {
          namespace,
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
          type,
        },
      };

      const response = await this.makeRequest(`/products/${productId}/metafields.json`, 'POST', metafield);
      return response.metafield;
    } catch (error) {
      logger.error('Error creating product metafield:', error);
      throw error;
    }
  }

  async getProductMetafields(productId: number, namespace?: string) {
    try {
      let endpoint = `/products/${productId}/metafields.json`;
      if (namespace) {
        endpoint += `?namespace=${namespace}`;
      }

      const response = await this.makeRequest(endpoint);
      return response.metafields;
    } catch (error) {
      logger.error('Error fetching product metafields:', error);
      throw error;
    }
  }
}

export default ShopifyIntegration;