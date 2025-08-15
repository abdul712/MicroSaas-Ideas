/**
 * Customer Journey Mapper - Tracking SDK
 * Lightweight JavaScript SDK for client-side event tracking
 */

export interface JourneyEvent {
  eventType: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  sessionId?: string;
  customerId?: string;
  journeyId?: string;
}

export interface TrackingConfig {
  apiKey: string;
  apiUrl?: string;
  customerId?: string;
  journeyId?: string;
  autoTrack?: {
    pageViews?: boolean;
    clicks?: boolean;
    formSubmissions?: boolean;
    scrollDepth?: boolean;
  };
  privacy?: {
    respectDoNotTrack?: boolean;
    anonymizeIPs?: boolean;
    cookieConsent?: boolean;
  };
  batchSize?: number;
  flushInterval?: number;
}

export interface TouchpointEvent extends JourneyEvent {
  touchpointId: string;
  touchpointType: 'website' | 'email' | 'social' | 'mobile' | 'offline' | 'support';
  stage?: string;
  metadata?: Record<string, any>;
}

class JourneyTracker {
  private config: TrackingConfig;
  private sessionId: string;
  private eventQueue: JourneyEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private initialized = false;

  constructor(config: TrackingConfig) {
    this.config = {
      apiUrl: 'https://api.journeymapper.com',
      autoTrack: {
        pageViews: true,
        clicks: true,
        formSubmissions: true,
        scrollDepth: false,
      },
      privacy: {
        respectDoNotTrack: true,
        anonymizeIPs: true,
        cookieConsent: true,
      },
      batchSize: 50,
      flushInterval: 5000,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    // Check privacy settings
    if (this.config.privacy?.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      console.log('JourneyTracker: Do Not Track is enabled, tracking disabled');
      return;
    }

    if (this.config.privacy?.cookieConsent && !this.hasCookieConsent()) {
      console.log('JourneyTracker: Cookie consent not given, tracking disabled');
      return;
    }

    this.setupAutoTracking();
    this.startFlushTimer();
    this.initialized = true;

    // Track initial page view
    if (this.config.autoTrack?.pageViews) {
      this.trackPageView();
    }
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isDoNotTrackEnabled(): boolean {
    if (typeof navigator === 'undefined') return false;
    return navigator.doNotTrack === '1' || (navigator as any).msDoNotTrack === '1';
  }

  private hasCookieConsent(): boolean {
    if (typeof document === 'undefined') return true;
    return document.cookie.includes('journey-consent=true');
  }

  private setupAutoTracking(): void {
    if (typeof window === 'undefined') return;

    // Auto-track page views on SPA navigation
    if (this.config.autoTrack?.pageViews) {
      this.trackHistoryChanges();
    }

    // Auto-track clicks
    if (this.config.autoTrack?.clicks) {
      document.addEventListener('click', this.handleClick.bind(this), true);
    }

    // Auto-track form submissions
    if (this.config.autoTrack?.formSubmissions) {
      document.addEventListener('submit', this.handleFormSubmit.bind(this), true);
    }

    // Auto-track scroll depth
    if (this.config.autoTrack?.scrollDepth) {
      this.trackScrollDepth();
    }

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Track visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush(true);
      }
    });
  }

  private trackHistoryChanges(): void {
    let currentUrl = window.location.href;

    const trackUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.trackPageView();
      }
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', trackUrlChange);

    // Monkey patch pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(trackUrlChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(trackUrlChange, 0);
    };
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    const elementInfo = this.getElementInfo(target);
    
    this.track('click', {
      element: elementInfo.tagName,
      text: elementInfo.text,
      href: elementInfo.href,
      id: elementInfo.id,
      className: elementInfo.className,
      xpath: this.getXPath(target),
      timestamp: new Date().toISOString(),
    });
  }

  private handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    if (!form) return;

    const formData = new FormData(form);
    const fields: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      // Don't capture sensitive data
      if (this.isSensitiveField(key)) {
        fields[key] = '[REDACTED]';
      } else {
        fields[key] = value;
      }
    }

    this.track('form_submit', {
      formId: form.id,
      formAction: form.action,
      formMethod: form.method,
      fields: Object.keys(fields),
      timestamp: new Date().toISOString(),
    });
  }

  private trackScrollDepth(): void {
    let maxScroll = 0;
    const depths = [25, 50, 75, 100];
    const tracked = new Set<number>();

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      maxScroll = Math.max(maxScroll, scrollPercent);

      depths.forEach(depth => {
        if (maxScroll >= depth && !tracked.has(depth)) {
          tracked.add(depth);
          this.track('scroll_depth', {
            depth,
            timestamp: new Date().toISOString(),
          });
        }
      });
    };

    window.addEventListener('scroll', this.throttle(handleScroll, 500));
  }

  private getElementInfo(element: HTMLElement) {
    return {
      tagName: element.tagName.toLowerCase(),
      text: element.textContent?.trim().substring(0, 100) || '',
      href: (element as HTMLAnchorElement).href || '',
      id: element.id || '',
      className: element.className || '',
    };
  }

  private getXPath(element: HTMLElement): string {
    if (element.id) {
      return `//*[@id="${element.id}"]`;
    }

    const parts: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      const tagName = current.tagName.toLowerCase();
      const siblings = Array.from(current.parentNode?.children || [])
        .filter(child => child.tagName === current!.tagName);

      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        parts.unshift(`${tagName}[${index}]`);
      } else {
        parts.unshift(tagName);
      }

      current = current.parentElement;
      
      // Stop at body or after 10 levels
      if (current?.tagName === 'BODY' || parts.length > 10) break;
    }

    return '/' + parts.join('/');
  }

  private isSensitiveField(fieldName: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /credit.*card/i,
      /ssn/i,
      /social.*security/i,
      /cvv/i,
      /pin/i,
      /bank.*account/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(fieldName));
  }

  private throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function (this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  public track(eventType: string, properties: Record<string, any> = {}): void {
    if (!this.initialized) return;

    const event: JourneyEvent = {
      eventType,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      timestamp: new Date(),
      sessionId: this.sessionId,
      customerId: this.config.customerId,
      journeyId: this.config.journeyId,
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= (this.config.batchSize || 50)) {
      this.flush();
    }
  }

  public trackTouchpoint(touchpoint: Omit<TouchpointEvent, 'timestamp' | 'sessionId'>): void {
    this.track('touchpoint', {
      touchpointId: touchpoint.touchpointId,
      touchpointType: touchpoint.touchpointType,
      stage: touchpoint.stage,
      metadata: touchpoint.metadata,
      ...touchpoint.properties,
    });
  }

  public trackPageView(url?: string): void {
    const currentUrl = url || window.location.href;
    
    this.track('page_view', {
      url: currentUrl,
      title: document.title,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
    });
  }

  public trackConversion(conversionData: {
    goalId: string;
    value?: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): void {
    this.track('conversion', {
      goalId: conversionData.goalId,
      value: conversionData.value,
      currency: conversionData.currency || 'USD',
      metadata: conversionData.metadata,
      timestamp: new Date().toISOString(),
    });
  }

  public identify(customerId: string, properties?: Record<string, any>): void {
    this.config.customerId = customerId;
    
    this.track('identify', {
      customerId,
      properties,
      timestamp: new Date().toISOString(),
    });
  }

  public setJourney(journeyId: string): void {
    this.config.journeyId = journeyId;
    
    this.track('journey_start', {
      journeyId,
      timestamp: new Date().toISOString(),
    });
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval || 5000);
  }

  public async flush(force = false): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.config.apiUrl}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          events,
          apiKey: this.config.apiKey,
        }),
        keepalive: force,
      });

      if (!response.ok) {
        console.error('Failed to send events:', response.status, response.statusText);
        // Re-queue events if not force flush
        if (!force) {
          this.eventQueue.unshift(...events);
        }
      }
    } catch (error) {
      console.error('Error sending events:', error);
      // Re-queue events if not force flush
      if (!force) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flush(true);
    this.initialized = false;

    // Remove event listeners
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', this.handleClick.bind(this), true);
      document.removeEventListener('submit', this.handleFormSubmit.bind(this), true);
    }
  }

  // Cookie consent management
  public grantConsent(): void {
    if (typeof document !== 'undefined') {
      document.cookie = 'journey-consent=true; path=/; max-age=31536000; SameSite=Strict';
      if (!this.initialized) {
        this.init();
      }
    }
  }

  public revokeConsent(): void {
    if (typeof document !== 'undefined') {
      document.cookie = 'journey-consent=false; path=/; max-age=0';
      this.destroy();
    }
  }
}

// Global instance for browser usage
let globalTracker: JourneyTracker | null = null;

export function initJourneyTracker(config: TrackingConfig): JourneyTracker {
  if (globalTracker) {
    globalTracker.destroy();
  }

  globalTracker = new JourneyTracker(config);
  
  // Make available globally for browser console access
  if (typeof window !== 'undefined') {
    (window as any).journeyTracker = globalTracker;
  }

  return globalTracker;
}

export function getJourneyTracker(): JourneyTracker | null {
  return globalTracker;
}

export { JourneyTracker };