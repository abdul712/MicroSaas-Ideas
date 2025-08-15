/**
 * Server-side tracking for Customer Journey Mapper
 * Node.js SDK for backend event tracking
 */

export interface ServerEvent {
  eventType: string;
  customerId: string;
  sessionId?: string;
  journeyId?: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  context?: {
    ip?: string;
    userAgent?: string;
    referer?: string;
    library?: {
      name: string;
      version: string;
    };
  };
}

export interface ServerConfig {
  apiKey: string;
  apiUrl?: string;
  timeout?: number;
  retryCount?: number;
  batchSize?: number;
  flushInterval?: number;
}

export class ServerSideTracker {
  private config: ServerConfig;
  private eventQueue: ServerEvent[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: ServerConfig) {
    this.config = {
      apiUrl: 'https://api.journeymapper.com',
      timeout: 5000,
      retryCount: 3,
      batchSize: 100,
      flushInterval: 10000,
      ...config,
    };

    this.startFlushTimer();
  }

  public track(event: ServerEvent): void {
    const enrichedEvent: ServerEvent = {
      ...event,
      timestamp: event.timestamp || new Date(),
      context: {
        library: {
          name: 'journey-mapper-node',
          version: '1.0.0',
        },
        ...event.context,
      },
    };

    this.eventQueue.push(enrichedEvent);

    if (this.eventQueue.length >= this.config.batchSize!) {
      this.flush();
    }
  }

  public identify(customerId: string, traits?: Record<string, any>, context?: ServerEvent['context']): void {
    this.track({
      eventType: 'identify',
      customerId,
      properties: traits,
      context,
    });
  }

  public trackPageView(data: {
    customerId: string;
    url: string;
    title?: string;
    sessionId?: string;
    journeyId?: string;
    context?: ServerEvent['context'];
  }): void {
    this.track({
      eventType: 'page_view',
      customerId: data.customerId,
      sessionId: data.sessionId,
      journeyId: data.journeyId,
      properties: {
        url: data.url,
        title: data.title,
      },
      context: data.context,
    });
  }

  public trackConversion(data: {
    customerId: string;
    goalId: string;
    value?: number;
    currency?: string;
    sessionId?: string;
    journeyId?: string;
    metadata?: Record<string, any>;
    context?: ServerEvent['context'];
  }): void {
    this.track({
      eventType: 'conversion',
      customerId: data.customerId,
      sessionId: data.sessionId,
      journeyId: data.journeyId,
      properties: {
        goalId: data.goalId,
        value: data.value,
        currency: data.currency || 'USD',
        metadata: data.metadata,
      },
      context: data.context,
    });
  }

  public trackTouchpoint(data: {
    customerId: string;
    touchpointId: string;
    touchpointType: 'email' | 'sms' | 'push' | 'webhook' | 'api' | 'server';
    stage?: string;
    sessionId?: string;
    journeyId?: string;
    metadata?: Record<string, any>;
    context?: ServerEvent['context'];
  }): void {
    this.track({
      eventType: 'touchpoint',
      customerId: data.customerId,
      sessionId: data.sessionId,
      journeyId: data.journeyId,
      properties: {
        touchpointId: data.touchpointId,
        touchpointType: data.touchpointType,
        stage: data.stage,
        metadata: data.metadata,
      },
      context: data.context,
    });
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval!);
  }

  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    let attempt = 0;
    while (attempt < this.config.retryCount!) {
      try {
        const response = await this.sendEvents(events);
        if (response.ok) {
          return; // Success
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        attempt++;
        if (attempt >= this.config.retryCount!) {
          console.error('Failed to send events after retries:', error);
          // In production, you might want to save to dead letter queue
          break;
        }
        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  private async sendEvents(events: ServerEvent[]): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout!);

    try {
      const response = await fetch(`${this.config.apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': 'journey-mapper-node/1.0.0',
        },
        body: JSON.stringify({
          events,
          apiKey: this.config.apiKey,
        }),
        signal: controller.signal,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}

// Utility function for Express.js middleware
export function createExpressMiddleware(tracker: ServerSideTracker) {
  return (req: any, res: any, next: any) => {
    // Add tracking methods to request object
    req.journeyTracker = {
      track: (eventType: string, properties?: Record<string, any>) => {
        const customerId = req.user?.id || req.session?.customerId;
        if (customerId) {
          tracker.track({
            eventType,
            customerId,
            sessionId: req.sessionID,
            properties,
            context: {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              referer: req.get('Referer'),
            },
          });
        }
      },
      trackPageView: (url?: string, title?: string) => {
        const customerId = req.user?.id || req.session?.customerId;
        if (customerId) {
          tracker.trackPageView({
            customerId,
            url: url || req.originalUrl,
            title,
            sessionId: req.sessionID,
            context: {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              referer: req.get('Referer'),
            },
          });
        }
      },
    };

    next();
  };
}