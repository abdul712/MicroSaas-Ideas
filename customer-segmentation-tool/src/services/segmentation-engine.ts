import { prisma } from '@/lib/prisma';
import {
  Customer,
  Segment,
  SegmentMembership,
  SegmentRule,
  SegmentOperator,
  MLAlgorithm,
  RFMScores,
  RFMSegment,
  ChurnPrediction,
  CLVPrediction,
  RiskLevel
} from '@/types';

export class SegmentationEngine {
  /**
   * Create a new segment with rules
   */
  async createSegment(data: {
    tenantId: string;
    name: string;
    description?: string;
    rules: SegmentRule[];
    mlConfig?: any;
    isDynamic?: boolean;
    color?: string;
    tags?: string[];
  }) {
    const segment = await prisma.segment.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        rules: data.rules,
        mlConfig: data.mlConfig,
        isDynamic: data.isDynamic ?? true,
        color: data.color ?? '#3B82F6',
        tags: data.tags ?? [],
      },
    });

    // If it's a dynamic segment, calculate members immediately
    if (segment.isDynamic) {
      await this.updateSegmentMembership(segment.id);
    }

    return segment;
  }

  /**
   * Update segment membership based on rules
   */
  async updateSegmentMembership(segmentId: string) {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
      include: { tenant: true },
    });

    if (!segment) {
      throw new Error('Segment not found');
    }

    // Clear existing memberships for dynamic segments
    if (segment.isDynamic) {
      await prisma.segmentMembership.deleteMany({
        where: { segmentId },
      });
    }

    // Get all customers for the tenant
    const customers = await prisma.customer.findMany({
      where: { tenantId: segment.tenantId },
      include: {
        behaviorEvents: true,
        segmentMemberships: true,
      },
    });

    // Filter customers based on segment rules
    const eligibleCustomers = await this.filterCustomersByRules(
      customers,
      segment.rules as SegmentRule[]
    );

    // Create new memberships
    const memberships = eligibleCustomers.map(customer => ({
      segmentId,
      customerId: customer.id,
      score: 1.0, // Default score, can be enhanced with ML
    }));

    if (memberships.length > 0) {
      await prisma.segmentMembership.createMany({
        data: memberships,
      });
    }

    // Update segment customer count
    await prisma.segment.update({
      where: { id: segmentId },
      data: {
        customerCount: memberships.length,
        lastUpdated: new Date(),
      },
    });

    return memberships.length;
  }

  /**
   * Filter customers based on segment rules
   */
  private async filterCustomersByRules(
    customers: (Customer & { behaviorEvents: any[] })[],
    rules: SegmentRule[]
  ): Promise<Customer[]> {
    if (!rules || rules.length === 0) {
      return customers;
    }

    return customers.filter(customer => {
      return rules.every(rule => this.evaluateRule(customer, rule));
    });
  }

  /**
   * Evaluate a single rule against a customer
   */
  private evaluateRule(customer: any, rule: SegmentRule): boolean {
    const value = this.getCustomerFieldValue(customer, rule.field);
    
    switch (rule.operator) {
      case SegmentOperator.EQUALS:
        return value === rule.value;
      
      case SegmentOperator.NOT_EQUALS:
        return value !== rule.value;
      
      case SegmentOperator.GREATER_THAN:
        return Number(value) > Number(rule.value);
      
      case SegmentOperator.LESS_THAN:
        return Number(value) < Number(rule.value);
      
      case SegmentOperator.GREATER_THAN_OR_EQUAL:
        return Number(value) >= Number(rule.value);
      
      case SegmentOperator.LESS_THAN_OR_EQUAL:
        return Number(value) <= Number(rule.value);
      
      case SegmentOperator.CONTAINS:
        return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
      
      case SegmentOperator.NOT_CONTAINS:
        return !String(value).toLowerCase().includes(String(rule.value).toLowerCase());
      
      case SegmentOperator.STARTS_WITH:
        return String(value).toLowerCase().startsWith(String(rule.value).toLowerCase());
      
      case SegmentOperator.ENDS_WITH:
        return String(value).toLowerCase().endsWith(String(rule.value).toLowerCase());
      
      case SegmentOperator.IN:
        return Array.isArray(rule.value) && rule.value.includes(value);
      
      case SegmentOperator.NOT_IN:
        return Array.isArray(rule.value) && !rule.value.includes(value);
      
      case SegmentOperator.IS_NULL:
        return value === null || value === undefined;
      
      case SegmentOperator.IS_NOT_NULL:
        return value !== null && value !== undefined;
      
      case SegmentOperator.BETWEEN:
        return Array.isArray(rule.value) && 
               Number(value) >= Number(rule.value[0]) && 
               Number(value) <= Number(rule.value[1]);
      
      case SegmentOperator.REGEX:
        try {
          const regex = new RegExp(rule.value);
          return regex.test(String(value));
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }

  /**
   * Get a field value from customer data
   */
  private getCustomerFieldValue(customer: any, field: string): any {
    const fieldParts = field.split('.');
    let value = customer;

    for (const part of fieldParts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Calculate RFM scores for a customer
   */
  async calculateRFMScores(customerId: string): Promise<RFMScores> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        behaviorEvents: {
          where: {
            eventType: 'purchase',
          },
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const purchases = customer.behaviorEvents.filter(event => 
      event.eventType === 'purchase' && event.properties && 
      typeof event.properties === 'object' && 'amount' in event.properties
    );

    // Calculate Recency (days since last purchase)
    const lastPurchase = purchases[0];
    const recencyDays = lastPurchase
      ? Math.floor((Date.now() - new Date(lastPurchase.occurredAt).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Calculate Frequency (number of purchases)
    const frequency = purchases.length;

    // Calculate Monetary (total amount spent)
    const monetary = purchases.reduce((sum, purchase) => {
      const amount = purchase.properties && typeof purchase.properties === 'object' 
        ? (purchase.properties as any).amount || 0 
        : 0;
      return sum + Number(amount);
    }, 0);

    // Score each dimension (1-5 scale)
    const recencyScore = this.scoreRecency(recencyDays);
    const frequencyScore = this.scoreFrequency(frequency);
    const monetaryScore = this.scoreMonetary(monetary);

    // Create RFM score string
    const rfmScore = `${recencyScore}${frequencyScore}${monetaryScore}`;

    // Determine RFM segment
    const rfmSegment = this.determineRFMSegment(recencyScore, frequencyScore, monetaryScore);

    const scores: RFMScores = {
      recency: recencyScore,
      frequency: frequencyScore,
      monetary: monetaryScore,
      rfmScore,
      rfmSegment,
    };

    // Update customer with RFM scores
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        rfmScores: scores,
      },
    });

    return scores;
  }

  /**
   * Score recency (1-5, where 5 is most recent)
   */
  private scoreRecency(days: number): number {
    if (days <= 30) return 5;
    if (days <= 60) return 4;
    if (days <= 90) return 3;
    if (days <= 180) return 2;
    return 1;
  }

  /**
   * Score frequency (1-5, where 5 is most frequent)
   */
  private scoreFrequency(count: number): number {
    if (count >= 10) return 5;
    if (count >= 5) return 4;
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    return 1;
  }

  /**
   * Score monetary value (1-5, where 5 is highest value)
   */
  private scoreMonetary(amount: number): number {
    if (amount >= 1000) return 5;
    if (amount >= 500) return 4;
    if (amount >= 200) return 3;
    if (amount >= 50) return 2;
    return 1;
  }

  /**
   * Determine RFM segment based on scores
   */
  private determineRFMSegment(recency: number, frequency: number, monetary: number): RFMSegment {
    if (recency >= 4 && frequency >= 4 && monetary >= 4) {
      return RFMSegment.CHAMPIONS;
    }
    if (recency >= 3 && frequency >= 3 && monetary >= 3) {
      return RFMSegment.LOYAL_CUSTOMERS;
    }
    if (recency >= 4 && frequency <= 2) {
      return RFMSegment.NEW_CUSTOMERS;
    }
    if (recency >= 3 && frequency <= 2 && monetary >= 3) {
      return RFMSegment.POTENTIAL_LOYALISTS;
    }
    if (recency >= 3 && frequency <= 2 && monetary <= 2) {
      return RFMSegment.PROMISING;
    }
    if (recency <= 2 && frequency >= 3 && monetary >= 3) {
      return RFMSegment.NEED_ATTENTION;
    }
    if (recency <= 2 && frequency >= 2 && monetary >= 2) {
      return RFMSegment.ABOUT_TO_SLEEP;
    }
    if (recency <= 2 && frequency >= 3) {
      return RFMSegment.AT_RISK;
    }
    if (recency <= 1 && frequency >= 4 && monetary >= 4) {
      return RFMSegment.CANNOT_LOSE_THEM;
    }
    if (recency <= 2 && frequency <= 2) {
      return RFMSegment.HIBERNATING;
    }
    return RFMSegment.LOST;
  }

  /**
   * Predict customer churn probability
   */
  async predictChurn(customerId: string): Promise<ChurnPrediction> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        behaviorEvents: {
          orderBy: {
            occurredAt: 'desc',
          },
          take: 100, // Last 100 events
        },
        segmentMemberships: {
          include: {
            segment: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Simple churn prediction algorithm
    // In production, this would use ML models
    let churnScore = 0;
    const reasons: string[] = [];

    // Check recency of last activity
    const lastEvent = customer.behaviorEvents[0];
    if (lastEvent) {
      const daysSinceLastActivity = Math.floor(
        (Date.now() - new Date(lastEvent.occurredAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastActivity > 90) {
        churnScore += 0.4;
        reasons.push('No activity in the last 90 days');
      } else if (daysSinceLastActivity > 30) {
        churnScore += 0.2;
        reasons.push('Low recent activity');
      }
    } else {
      churnScore += 0.5;
      reasons.push('No recorded activity');
    }

    // Check purchase frequency
    const purchases = customer.behaviorEvents.filter(e => e.eventType === 'purchase');
    if (purchases.length === 0) {
      churnScore += 0.3;
      reasons.push('No purchase history');
    } else if (purchases.length === 1) {
      churnScore += 0.2;
      reasons.push('Only one purchase');
    }

    // Check engagement events
    const engagementEvents = customer.behaviorEvents.filter(e => 
      ['email_open', 'email_click', 'page_view'].includes(e.eventType)
    );
    
    const recentEngagement = engagementEvents.filter(e => 
      (Date.now() - new Date(e.occurredAt).getTime()) < (30 * 24 * 60 * 60 * 1000) // 30 days
    );

    if (recentEngagement.length === 0) {
      churnScore += 0.2;
      reasons.push('No recent engagement');
    }

    // Normalize score to 0-1 range
    const churnProbability = Math.min(churnScore, 1);

    // Determine risk level
    let riskLevel: RiskLevel;
    if (churnProbability >= 0.8) riskLevel = RiskLevel.CRITICAL;
    else if (churnProbability >= 0.6) riskLevel = RiskLevel.HIGH;
    else if (churnProbability >= 0.4) riskLevel = RiskLevel.MEDIUM;
    else riskLevel = RiskLevel.LOW;

    // Generate recommended actions
    const recommendedActions: string[] = [];
    if (churnProbability > 0.5) {
      recommendedActions.push('Send personalized re-engagement email');
      recommendedActions.push('Offer special discount or promotion');
      recommendedActions.push('Schedule customer success call');
    }
    if (reasons.includes('No recent engagement')) {
      recommendedActions.push('Improve email content relevance');
      recommendedActions.push('Send product updates or tips');
    }

    return {
      customerId,
      churnProbability,
      riskLevel,
      reasons,
      recommendedActions,
      confidence: 0.75, // Mock confidence score
    };
  }

  /**
   * Predict customer lifetime value
   */
  async predictCLV(customerId: string, timeHorizonMonths: number = 12): Promise<CLVPrediction> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        behaviorEvents: {
          where: {
            eventType: 'purchase',
          },
          orderBy: {
            occurredAt: 'desc',
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    const purchases = customer.behaviorEvents.filter(event => 
      event.eventType === 'purchase' && 
      event.properties && 
      typeof event.properties === 'object' && 
      'amount' in event.properties
    );

    if (purchases.length === 0) {
      return {
        customerId,
        predictedCLV: 0,
        confidenceInterval: [0, 0],
        timeHorizon: timeHorizonMonths,
        factors: [],
      };
    }

    // Calculate historical metrics
    const totalSpent = purchases.reduce((sum, purchase) => {
      const amount = (purchase.properties as any).amount || 0;
      return sum + Number(amount);
    }, 0);

    const avgOrderValue = totalSpent / purchases.length;
    
    // Calculate purchase frequency (purchases per month)
    const firstPurchase = purchases[purchases.length - 1];
    const customerLifespanMonths = Math.max(1, 
      (Date.now() - new Date(firstPurchase.occurredAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    const purchaseFrequency = purchases.length / customerLifespanMonths;

    // Simple CLV prediction: AOV * Purchase Frequency * Time Horizon
    const predictedCLV = avgOrderValue * purchaseFrequency * timeHorizonMonths;

    // Calculate confidence interval (±25% for simplicity)
    const confidenceInterval: [number, number] = [
      predictedCLV * 0.75,
      predictedCLV * 1.25,
    ];

    // Identify factors affecting CLV
    const factors = [
      {
        factor: 'Average Order Value',
        impact: avgOrderValue / predictedCLV,
        description: `Customer's average order value is $${avgOrderValue.toFixed(2)}`,
      },
      {
        factor: 'Purchase Frequency',
        impact: (purchaseFrequency * timeHorizonMonths) / predictedCLV,
        description: `Customer makes ${purchaseFrequency.toFixed(2)} purchases per month`,
      },
      {
        factor: 'Customer Lifespan',
        impact: timeHorizonMonths / predictedCLV,
        description: `Prediction horizon is ${timeHorizonMonths} months`,
      },
    ];

    return {
      customerId,
      predictedCLV,
      confidenceInterval,
      timeHorizon: timeHorizonMonths,
      factors,
    };
  }

  /**
   * Run ML clustering to discover new segments
   */
  async runMLClustering(tenantId: string, algorithm: MLAlgorithm = MLAlgorithm.KMEANS) {
    // This would integrate with the Python ML service
    // For now, we'll create a mock implementation
    
    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        behaviorEvents: true,
      },
    });

    if (customers.length < 10) {
      throw new Error('Not enough customers for clustering analysis');
    }

    // Mock clustering results
    const mockClusters = [
      {
        name: 'High-Value Frequent Buyers',
        description: 'Customers with high AOV and frequent purchases',
        color: '#10B981',
        customerIds: customers.slice(0, Math.floor(customers.length * 0.2)).map(c => c.id),
      },
      {
        name: 'Occasional Big Spenders',
        description: 'Customers with high AOV but infrequent purchases',
        color: '#F59E0B',
        customerIds: customers.slice(Math.floor(customers.length * 0.2), Math.floor(customers.length * 0.4)).map(c => c.id),
      },
      {
        name: 'Regular Small Buyers',
        description: 'Customers with frequent but small purchases',
        color: '#3B82F6',
        customerIds: customers.slice(Math.floor(customers.length * 0.4), Math.floor(customers.length * 0.7)).map(c => c.id),
      },
      {
        name: 'At-Risk Customers',
        description: 'Customers with declining engagement',
        color: '#EF4444',
        customerIds: customers.slice(Math.floor(customers.length * 0.7)).map(c => c.id),
      },
    ];

    // Create segments from clusters
    const createdSegments = [];
    for (const cluster of mockClusters) {
      const segment = await prisma.segment.create({
        data: {
          tenantId,
          name: cluster.name,
          description: cluster.description,
          color: cluster.color,
          rules: [], // ML-based segments don't use traditional rules
          mlConfig: {
            algorithm,
            parameters: { k: mockClusters.length },
            features: ['recency', 'frequency', 'monetary'],
            autoUpdate: true,
          },
          isDynamic: false, // ML segments are typically static until retrained
          customerCount: cluster.customerIds.length,
        },
      });

      // Create memberships
      const memberships = cluster.customerIds.map(customerId => ({
        segmentId: segment.id,
        customerId,
        score: Math.random() * 0.3 + 0.7, // Mock confidence scores between 0.7-1.0
      }));

      await prisma.segmentMembership.createMany({
        data: memberships,
      });

      createdSegments.push({
        ...segment,
        memberCount: cluster.customerIds.length,
      });
    }

    return createdSegments;
  }

  /**
   * Update all dynamic segments for a tenant
   */
  async updateAllDynamicSegments(tenantId: string) {
    const dynamicSegments = await prisma.segment.findMany({
      where: {
        tenantId,
        isDynamic: true,
        isActive: true,
      },
    });

    const results = [];
    for (const segment of dynamicSegments) {
      try {
        const memberCount = await this.updateSegmentMembership(segment.id);
        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          memberCount,
          success: true,
        });
      } catch (error) {
        results.push({
          segmentId: segment.id,
          segmentName: segment.name,
          memberCount: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}