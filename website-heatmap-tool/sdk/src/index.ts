/**
 * Heatmap Analytics SDK
 * Lightweight JavaScript library for collecting user interaction data
 * Size: <10KB gzipped | Privacy-compliant | Real-time processing
 */

import { EventCollector } from './core/event-collector';
import { ClickTracker } from './plugins/click-tracker';
import { ScrollTracker } from './plugins/scroll-tracker';
import { MouseTracker } from './plugins/mouse-tracker';
import { FormTracker } from './plugins/form-tracker';
import { SessionRecorder } from './plugins/session-recorder';
import { ConsentManager } from './core/consent-manager';
import { PrivacyManager } from './core/privacy-manager';
import { Config, HeatmapSDKOptions, TrackingEvent } from './types';
import { Logger } from './utils/logger';
import { throttle, debounce } from './utils/performance';
import { generateSessionId, generateUserId } from './utils/identifiers';

/**
 * Main Heatmap Analytics SDK Class
 */
export class HeatmapSDK {
  private config: Config;
  private eventCollector: EventCollector;
  private consentManager: ConsentManager;
  private privacyManager: PrivacyManager;
  private logger: Logger;
  
  // Tracking plugins
  private clickTracker?: ClickTracker;
  private scrollTracker?: ScrollTracker;
  private mouseTracker?: MouseTracker;
  private formTracker?: FormTracker;
  private sessionRecorder?: SessionRecorder;
  
  // State management
  private isInitialized = false;
  private sessionId: string;
  private userId: string;
  private pageLoadTime: number;
  private visibilityStartTime: number;
  
  constructor(options: HeatmapSDKOptions) {
    this.pageLoadTime = Date.now();
    this.visibilityStartTime = Date.now();
    
    // Generate identifiers
    this.sessionId = generateSessionId();
    this.userId = generateUserId();
    
    // Initialize configuration
    this.config = this.createConfig(options);
    
    // Initialize core components
    this.logger = new Logger(this.config.debug);
    this.eventCollector = new EventCollector(this.config);
    this.consentManager = new ConsentManager(this.config);
    this.privacyManager = new PrivacyManager(this.config);
    
    // Initialize SDK
    this.initialize();
  }

  /**
   * Create configuration with defaults
   */
  private createConfig(options: HeatmapSDKOptions): Config {
    const defaults: Config = {
      siteId: options.siteId,
      apiUrl: options.apiUrl || 'https://api.heatmapanalytics.com',
      debug: options.debug || false,
      
      // Privacy settings
      privacy: {
        respectDoNotTrack: options.privacy?.respectDoNotTrack ?? true,
        anonymizeIP: options.privacy?.anonymizeIP ?? true,
        enableConsentMode: options.privacy?.enableConsentMode ?? true,
        consentCookieName: options.privacy?.consentCookieName || 'heatmap_consent',
        dataRetentionDays: options.privacy?.dataRetentionDays || 365,
      },
      
      // Tracking configuration
      tracking: {
        clicks: options.tracking?.clicks ?? true,
        scrolls: options.tracking?.scrolls ?? true,
        mouseMoves: options.tracking?.mouseMoves ?? false,
        forms: options.tracking?.forms ?? true,
        sessionReplay: options.tracking?.sessionReplay ?? false,
        pageViews: options.tracking?.pageViews ?? true,
      },
      
      // Performance settings
      performance: {
        sampleRate: options.performance?.sampleRate || 1.0,
        batchSize: options.performance?.batchSize || 20,
        batchTimeout: options.performance?.batchTimeout || 5000,
        maxQueueSize: options.performance?.maxQueueSize || 100,
        throttleMs: options.performance?.throttleMs || 100,
        debounceMs: options.performance?.debounceMs || 300,
      },
      
      // Security settings
      security: {
        enableCSP: options.security?.enableCSP ?? true,
        allowedDomains: options.security?.allowedDomains || [],
        hashSensitiveData: options.security?.hashSensitiveData ?? true,
        excludeElements: options.security?.excludeElements || ['.sensitive', '[data-private]'],
      },
    };
    
    return { ...defaults, ...options };
  }

  /**
   * Initialize the SDK
   */
  private async initialize(): Promise<void> {
    try {
      this.logger.log('Initializing Heatmap SDK...');
      
      // Check for Do Not Track
      if (this.shouldRespectDoNotTrack()) {
        this.logger.log('Do Not Track detected, analytics disabled');
        return;
      }
      
      // Initialize consent management
      await this.consentManager.initialize();
      
      // Check consent before initializing tracking
      if (this.config.privacy.enableConsentMode && !this.consentManager.hasConsent()) {
        this.logger.log('Waiting for user consent...');
        this.consentManager.onConsentChange((hasConsent) => {
          if (hasConsent) {
            this.initializeTracking();
          }
        });
        return;
      }
      
      // Initialize tracking
      await this.initializeTracking();
      
      this.isInitialized = true;
      this.logger.log('Heatmap SDK initialized successfully');
      
      // Track page view
      this.trackPageView();
      
    } catch (error) {
      this.logger.error('Failed to initialize Heatmap SDK:', error);
    }
  }

  /**
   * Initialize tracking plugins
   */
  private async initializeTracking(): Promise<void> {
    try {
      // Initialize click tracking
      if (this.config.tracking.clicks) {
        this.clickTracker = new ClickTracker(this.config, this.eventCollector);
        this.clickTracker.start();
      }
      
      // Initialize scroll tracking
      if (this.config.tracking.scrolls) {
        this.scrollTracker = new ScrollTracker(this.config, this.eventCollector);
        this.scrollTracker.start();
      }
      
      // Initialize mouse tracking (if enabled)
      if (this.config.tracking.mouseMoves) {
        this.mouseTracker = new MouseTracker(this.config, this.eventCollector);
        this.mouseTracker.start();
      }
      
      // Initialize form tracking
      if (this.config.tracking.forms) {
        this.formTracker = new FormTracker(this.config, this.eventCollector);
        this.formTracker.start();
      }
      
      // Initialize session recording (if enabled)
      if (this.config.tracking.sessionReplay) {
        this.sessionRecorder = new SessionRecorder(this.config, this.eventCollector);
        this.sessionRecorder.start();
      }
      
      // Set up page visibility tracking
      this.initializeVisibilityTracking();
      
      // Set up beforeunload tracking
      this.initializeUnloadTracking();
      
    } catch (error) {
      this.logger.error('Failed to initialize tracking:', error);
    }
  }

  /**
   * Check if Do Not Track should be respected
   */
  private shouldRespectDoNotTrack(): boolean {
    if (!this.config.privacy.respectDoNotTrack) return false;
    
    const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
    return dnt === '1' || dnt === 'yes';
  }

  /**
   * Initialize page visibility tracking
   */
  private initializeVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden
        const timeOnPage = Date.now() - this.visibilityStartTime;
        this.track('page_hidden', { timeOnPage });
      } else {
        // Page became visible
        this.visibilityStartTime = Date.now();
        this.track('page_visible', {});
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  /**
   * Initialize unload tracking
   */
  private initializeUnloadTracking(): void {
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - this.pageLoadTime;
      this.track('page_unload', { timeOnPage }, true); // Force immediate send
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    const pageData = {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      timestamp: Date.now(),
    };
    
    this.track('page_view', pageData);
  }

  /**
   * Track custom event
   */
  public track(eventType: string, data: Record<string, any>, immediate = false): void {
    if (!this.isInitialized && !immediate) {
      this.logger.warn('SDK not initialized, event queued:', eventType);
    }
    
    const event: TrackingEvent = {
      type: eventType,
      siteId: this.config.siteId,
      sessionId: this.sessionId,
      userId: this.userId,
      timestamp: Date.now(),
      url: window.location.href,
      data: this.privacyManager.sanitizeData(data),
    };
    
    this.eventCollector.collect(event, immediate);
  }

  /**
   * Identify user
   */
  public identify(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;
    this.track('user_identified', { userId, traits });
  }

  /**
   * Set user properties
   */
  public setUserProperties(properties: Record<string, any>): void {
    this.track('user_properties', { properties });
  }

  /**
   * Track custom conversion event
   */
  public trackConversion(conversionType: string, value?: number, currency?: string): void {
    this.track('conversion', {
      conversionType,
      value,
      currency,
    });
  }

  /**
   * Request consent from user
   */
  public requestConsent(): Promise<boolean> {
    return this.consentManager.requestConsent();
  }

  /**
   * Check if user has given consent
   */
  public hasConsent(): boolean {
    return this.consentManager.hasConsent();
  }

  /**
   * Revoke consent and stop tracking
   */
  public revokeConsent(): void {
    this.consentManager.revokeConsent();
    this.destroy();
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get current user ID
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * Force flush events to server
   */
  public flush(): Promise<void> {
    return this.eventCollector.flush();
  }

  /**
   * Destroy SDK and clean up
   */
  public destroy(): void {
    this.logger.log('Destroying Heatmap SDK...');
    
    // Stop all trackers
    this.clickTracker?.stop();
    this.scrollTracker?.stop();
    this.mouseTracker?.stop();
    this.formTracker?.stop();
    this.sessionRecorder?.stop();
    
    // Flush remaining events
    this.eventCollector.flush();
    
    // Clean up
    this.isInitialized = false;
    
    this.logger.log('Heatmap SDK destroyed');
  }
}

/**
 * Global SDK instance management
 */
declare global {
  interface Window {
    HeatmapAnalytics: typeof HeatmapSDK;
    heatmap?: HeatmapSDK;
  }
}

// Auto-initialize from script tag data attributes
function autoInitialize(): void {
  const script = document.querySelector('script[data-site-id]') as HTMLScriptElement;
  if (script) {
    const siteId = script.getAttribute('data-site-id');
    const apiUrl = script.getAttribute('data-api-url');
    const debug = script.getAttribute('data-debug') === 'true';
    
    if (siteId) {
      window.heatmap = new HeatmapSDK({
        siteId,
        apiUrl: apiUrl || undefined,
        debug,
      });
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitialize);
} else {
  autoInitialize();
}

// Export for manual initialization
export { HeatmapSDK };
export default HeatmapSDK;

// Make available globally
window.HeatmapAnalytics = HeatmapSDK;