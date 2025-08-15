import axios from 'axios';
import { logger } from '../../utils/logger';
import { cache } from '../../utils/redis';

export interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  version?: string;
}

export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  price: string;
  regular_price: string;
  sale_price: string;
  images: Array<{
    id: number;
    src: string;
    alt: string;
  }>;
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  stock_status: string;
  stock_quantity: number;
  variations?: number[];
}

export interface WooCommerceOrder {
  id: number;
  order_key: string;
  status: string;
  total: string;
  total_tax: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variation_id: number;
    name: string;
    quantity: number;
    price: number;
    total: string;
  }>;
  date_created: string;
  date_modified: string;
}

export interface WooCommerceCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  date_created: string;
  date_modified: string;
  orders_count: number;
  total_spent: string;
}

export class WooCommerceIntegration {
  private config: WooCommerceConfig;
  private baseUrl: string;
  private auth: string;

  constructor(config: WooCommerceConfig) {
    this.config = config;
    this.baseUrl = `${config.siteUrl}/wp-json/wc/${config.version || 'v3'}`;
    this.auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString('base64');
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json',
        },
        data,
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      logger.error('WooCommerce API error:', {
        endpoint,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw new Error(`WooCommerce API error: ${error.response?.data?.message || error.message}`);
    }
  }

  // Products
  async getProducts(
    page: number = 1,
    perPage: number = 50,
    status: 'publish' | 'draft' | 'private' | 'pending' = 'publish'
  ): Promise<{ products: WooCommerceProduct[]; totalPages: number; total: number }> {
    const cacheKey = `woocommerce:products:${this.config.siteUrl}:${page}:${perPage}:${status}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await axios.get(`${this.baseUrl}/products`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
        },
        params: {
          page,
          per_page: perPage,
          status,
        },
      });

      const result = {
        products: response.data,
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        total: parseInt(response.headers['x-wp-total'] || '0'),
      };

      // Cache for 5 minutes
      await cache.set(cacheKey, JSON.stringify(result), 300);

      return result;
    } catch (error) {
      logger.error('Error fetching WooCommerce products:', error);
      throw error;
    }
  }

  async getProduct(productId: number): Promise<WooCommerceProduct> {
    const cacheKey = `woocommerce:product:${this.config.siteUrl}:${productId}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const product = await this.makeRequest(`/products/${productId}`);
      
      // Cache for 10 minutes
      await cache.set(cacheKey, JSON.stringify(product), 600);

      return product;
    } catch (error) {
      logger.error('Error fetching WooCommerce product:', error);
      throw error;
    }
  }

  async updateProduct(productId: number, updates: Partial<WooCommerceProduct>): Promise<WooCommerceProduct> {
    try {
      const product = await this.makeRequest(`/products/${productId}`, 'PUT', updates);
      
      // Invalidate cache
      const cacheKey = `woocommerce:product:${this.config.siteUrl}:${productId}`;
      await cache.del(cacheKey);

      return product;
    } catch (error) {
      logger.error('Error updating WooCommerce product:', error);
      throw error;
    }
  }

  // Product variations
  async getProductVariations(productId: number): Promise<any[]> {
    try {
      const variations = await this.makeRequest(`/products/${productId}/variations`);
      return variations;
    } catch (error) {
      logger.error('Error fetching product variations:', error);
      throw error;
    }
  }

  // Orders
  async getOrders(
    page: number = 1,
    perPage: number = 50,
    status: string = 'any',
    after?: Date,
    before?: Date
  ): Promise<{ orders: WooCommerceOrder[]; totalPages: number; total: number }> {
    try {
      const params: any = {
        page,
        per_page: perPage,
        status,
      };

      if (after) {
        params.after = after.toISOString();
      }

      if (before) {
        params.before = before.toISOString();
      }

      const response = await axios.get(`${this.baseUrl}/orders`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
        },
        params,
      });

      return {
        orders: response.data,
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        total: parseInt(response.headers['x-wp-total'] || '0'),
      };
    } catch (error) {
      logger.error('Error fetching WooCommerce orders:', error);
      throw error;
    }
  }

  async getOrder(orderId: number): Promise<WooCommerceOrder> {
    try {
      const order = await this.makeRequest(`/orders/${orderId}`);
      return order;
    } catch (error) {
      logger.error('Error fetching WooCommerce order:', error);
      throw error;
    }
  }

  // Customers
  async getCustomers(
    page: number = 1,
    perPage: number = 50
  ): Promise<{ customers: WooCommerceCustomer[]; totalPages: number; total: number }> {
    const cacheKey = `woocommerce:customers:${this.config.siteUrl}:${page}:${perPage}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await axios.get(`${this.baseUrl}/customers`, {
        headers: {
          'Authorization': `Basic ${this.auth}`,
        },
        params: {
          page,
          per_page: perPage,
        },
      });

      const result = {
        customers: response.data,
        totalPages: parseInt(response.headers['x-wp-totalpages'] || '0'),
        total: parseInt(response.headers['x-wp-total'] || '0'),
      };

      // Cache for 5 minutes
      await cache.set(cacheKey, JSON.stringify(result), 300);

      return result;
    } catch (error) {
      logger.error('Error fetching WooCommerce customers:', error);
      throw error;
    }
  }

  async getCustomer(customerId: number): Promise<WooCommerceCustomer> {
    try {
      const customer = await this.makeRequest(`/customers/${customerId}`);
      return customer;
    } catch (error) {
      logger.error('Error fetching WooCommerce customer:', error);
      throw error;
    }
  }

  // Analytics
  async getAnalytics(startDate: Date, endDate: Date) {
    try {
      // Get orders in date range
      const { orders } = await this.getOrders(1, 250, 'completed', startDate, endDate);

      // Calculate metrics
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Group by day
      const dailyStats = orders.reduce((acc, order) => {
        const date = new Date(order.date_created).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { orders: 0, revenue: 0 };
        }
        acc[date].orders += 1;
        acc[date].revenue += parseFloat(order.total);
        return acc;
      }, {} as Record<string, { orders: number; revenue: number }>);

      // Top products
      const productStats = orders.reduce((acc, order) => {
        order.line_items.forEach(item => {
          if (!acc[item.product_id]) {
            acc[item.product_id] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
            };
          }
          acc[item.product_id].quantity += item.quantity;
          acc[item.product_id].revenue += parseFloat(item.total);
        });
        return acc;
      }, {} as Record<number, { name: string; quantity: number; revenue: number }>);

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
      logger.error('Error fetching WooCommerce analytics:', error);
      throw error;
    }
  }

  // Reports API
  async getSalesReport(period: 'day' | 'week' | 'month' | 'year' = 'day', after?: Date, before?: Date) {
    try {
      const params: any = {
        period,
      };

      if (after) {
        params.after = after.toISOString();
      }

      if (before) {
        params.before = before.toISOString();
      }

      const report = await this.makeRequest('/reports/sales', 'GET');
      return report;
    } catch (error) {
      logger.error('Error fetching WooCommerce sales report:', error);
      throw error;
    }
  }

  async getTopSellersReport(period: string = 'month') {
    try {
      const report = await this.makeRequest(`/reports/top_sellers?period=${period}`);
      return report;
    } catch (error) {
      logger.error('Error fetching WooCommerce top sellers report:', error);
      throw error;
    }
  }

  // Coupons
  async getCoupons(): Promise<any[]> {
    try {
      const coupons = await this.makeRequest('/coupons');
      return coupons;
    } catch (error) {
      logger.error('Error fetching WooCommerce coupons:', error);
      throw error;
    }
  }

  async createCoupon(couponData: any) {
    try {
      const coupon = await this.makeRequest('/coupons', 'POST', couponData);
      return coupon;
    } catch (error) {
      logger.error('Error creating WooCommerce coupon:', error);
      throw error;
    }
  }

  // Webhooks
  async createWebhook(topic: string, deliveryUrl: string) {
    try {
      const webhook = {
        name: `CRO Webhook - ${topic}`,
        status: 'active',
        topic,
        delivery_url: deliveryUrl,
      };

      const response = await this.makeRequest('/webhooks', 'POST', webhook);
      return response;
    } catch (error) {
      logger.error('Error creating WooCommerce webhook:', error);
      throw error;
    }
  }

  async getWebhooks() {
    try {
      const webhooks = await this.makeRequest('/webhooks');
      return webhooks;
    } catch (error) {
      logger.error('Error fetching WooCommerce webhooks:', error);
      throw error;
    }
  }

  async deleteWebhook(webhookId: number) {
    try {
      await this.makeRequest(`/webhooks/${webhookId}`, 'DELETE');
      return true;
    } catch (error) {
      logger.error('Error deleting WooCommerce webhook:', error);
      throw error;
    }
  }

  // Verification
  static verifyWebhook(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const computedSignature = hmac.digest('base64');
    
    return signature === computedSignature;
  }

  // Store validation
  async validateConnection(): Promise<{ valid: boolean; store?: any; error?: string }> {
    try {
      const response = await this.makeRequest('/system_status');
      return {
        valid: true,
        store: {
          environment: response.environment,
          database: response.database,
          version: response.environment?.wp_version,
          wc_version: response.environment?.version,
        },
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  // Categories
  async getCategories(): Promise<any[]> {
    const cacheKey = `woocommerce:categories:${this.config.siteUrl}`;
    
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const categories = await this.makeRequest('/products/categories?per_page=100');
      
      // Cache for 30 minutes
      await cache.set(cacheKey, JSON.stringify(categories), 1800);

      return categories;
    } catch (error) {
      logger.error('Error fetching WooCommerce categories:', error);
      throw error;
    }
  }

  // Reviews
  async getProductReviews(productId: number): Promise<any[]> {
    try {
      const reviews = await this.makeRequest(`/products/reviews?product=${productId}`);
      return reviews;
    } catch (error) {
      logger.error('Error fetching product reviews:', error);
      throw error;
    }
  }

  // Settings for A/B testing integration
  async getSettings(group?: string) {
    try {
      let endpoint = '/settings';
      if (group) {
        endpoint += `/${group}`;
      }
      
      const settings = await this.makeRequest(endpoint);
      return settings;
    } catch (error) {
      logger.error('Error fetching WooCommerce settings:', error);
      throw error;
    }
  }

  async updateSetting(group: string, settingId: string, value: any) {
    try {
      const setting = await this.makeRequest(`/settings/${group}/${settingId}`, 'PUT', { value });
      return setting;
    } catch (error) {
      logger.error('Error updating WooCommerce setting:', error);
      throw error;
    }
  }

  // Tax classes and rates
  async getTaxClasses() {
    try {
      const taxClasses = await this.makeRequest('/taxes/classes');
      return taxClasses;
    } catch (error) {
      logger.error('Error fetching tax classes:', error);
      throw error;
    }
  }

  // Shipping zones and methods
  async getShippingZones() {
    try {
      const zones = await this.makeRequest('/shipping/zones');
      return zones;
    } catch (error) {
      logger.error('Error fetching shipping zones:', error);
      throw error;
    }
  }

  // Payment gateways
  async getPaymentGateways() {
    try {
      const gateways = await this.makeRequest('/payment_gateways');
      return gateways;
    } catch (error) {
      logger.error('Error fetching payment gateways:', error);
      throw error;
    }
  }

  // Cart abandonment data (requires additional plugin)
  async getAbandonedCarts(): Promise<any[]> {
    try {
      // This would typically require a specific plugin
      // For now, we'll return an empty array
      return [];
    } catch (error) {
      logger.error('Error fetching abandoned carts:', error);
      throw error;
    }
  }
}

export default WooCommerceIntegration;