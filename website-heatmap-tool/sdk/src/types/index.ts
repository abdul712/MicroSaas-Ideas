/**
 * Type definitions for Heatmap Analytics SDK
 */

// Main SDK configuration
export interface HeatmapSDKOptions {
  /** Site identifier */
  siteId: string;
  
  /** API endpoint URL */
  apiUrl?: string;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Privacy settings */
  privacy?: PrivacyConfig;
  
  /** Tracking configuration */
  tracking?: TrackingConfig;
  
  /** Performance settings */
  performance?: PerformanceConfig;
  
  /** Security settings */
  security?: SecurityConfig;
}

export interface Config extends Required<HeatmapSDKOptions> {}

// Privacy configuration
export interface PrivacyConfig {
  /** Respect Do Not Track header */
  respectDoNotTrack?: boolean;
  
  /** Anonymize IP addresses */
  anonymizeIP?: boolean;
  
  /** Enable consent management */
  enableConsentMode?: boolean;
  
  /** Cookie name for consent storage */
  consentCookieName?: string;
  
  /** Data retention period in days */
  dataRetentionDays?: number;
}

// Tracking configuration
export interface TrackingConfig {
  /** Enable click tracking */
  clicks?: boolean;
  
  /** Enable scroll tracking */
  scrolls?: boolean;
  
  /** Enable mouse movement tracking */
  mouseMoves?: boolean;
  
  /** Enable form interaction tracking */
  forms?: boolean;
  
  /** Enable session replay */
  sessionReplay?: boolean;
  
  /** Enable page view tracking */
  pageViews?: boolean;
}

// Performance configuration
export interface PerformanceConfig {
  /** Sampling rate (0.0 to 1.0) */
  sampleRate?: number;
  
  /** Number of events per batch */
  batchSize?: number;
  
  /** Batch timeout in milliseconds */
  batchTimeout?: number;
  
  /** Maximum queue size */
  maxQueueSize?: number;
  
  /** Throttle delay in milliseconds */
  throttleMs?: number;
  
  /** Debounce delay in milliseconds */
  debounceMs?: number;
}

// Security configuration
export interface SecurityConfig {
  /** Enable Content Security Policy checks */
  enableCSP?: boolean;
  
  /** Allowed domains for data collection */
  allowedDomains?: string[];
  
  /** Hash sensitive data before sending */
  hashSensitiveData?: boolean;
  
  /** CSS selectors for elements to exclude from tracking */
  excludeElements?: string[];
}

// Event types
export interface TrackingEvent {
  /** Event type identifier */
  type: string;
  
  /** Site identifier */
  siteId: string;
  
  /** Session identifier */
  sessionId: string;
  
  /** User identifier */
  userId: string;
  
  /** Event timestamp */
  timestamp: number;
  
  /** Page URL where event occurred */
  url: string;
  
  /** Event data payload */
  data: Record<string, any>;
}

// Click event data
export interface ClickEventData {
  /** X coordinate relative to viewport */
  x: number;
  
  /** Y coordinate relative to viewport */
  y: number;
  
  /** X coordinate relative to page */
  pageX: number;
  
  /** Y coordinate relative to page */
  pageY: number;
  
  /** Target element selector */
  selector: string;
  
  /** Target element tag name */
  tagName: string;
  
  /** Target element text content */
  textContent?: string;
  
  /** Target element attributes */
  attributes?: Record<string, string>;
  
  /** Viewport dimensions */
  viewport: ViewportData;
}

// Scroll event data
export interface ScrollEventData {
  /** Scroll position from top */
  scrollTop: number;
  
  /** Scroll position from left */
  scrollLeft: number;
  
  /** Document height */
  documentHeight: number;
  
  /** Viewport height */
  viewportHeight: number;
  
  /** Scroll depth percentage */
  scrollDepth: number;
  
  /** Maximum scroll depth reached */
  maxScrollDepth: number;
  
  /** Time spent on page */
  timeOnPage: number;
}

// Mouse movement event data
export interface MouseEventData {
  /** X coordinate relative to viewport */
  x: number;
  
  /** Y coordinate relative to viewport */
  y: number;
  
  /** X coordinate relative to page */
  pageX: number;
  
  /** Y coordinate relative to page */
  pageY: number;
  
  /** Movement velocity */
  velocity?: number;
  
  /** Movement direction */
  direction?: number;
  
  /** Time since last movement */
  timeSinceLastMove?: number;
}

// Form interaction event data
export interface FormEventData {
  /** Form element selector */
  formSelector: string;
  
  /** Field element selector */
  fieldSelector: string;
  
  /** Field name */
  fieldName: string;
  
  /** Field type */
  fieldType: string;
  
  /** Interaction type (focus, blur, change, submit) */
  interactionType: string;
  
  /** Field value (hashed if sensitive) */
  value?: string;
  
  /** Time spent in field */
  timeInField?: number;
  
  /** Character count */
  characterCount?: number;
}

// Session replay event data
export interface SessionReplayData {
  /** Recording segment identifier */
  segmentId: string;
  
  /** Segment sequence number */
  sequenceNumber: number;
  
  /** Recording data (compressed) */
  data: string;
  
  /** Data format version */
  version: string;
  
  /** Compression type */
  compression?: string;
}

// Page view data
export interface PageViewData {
  /** Page URL */
  url: string;
  
  /** Page title */
  title: string;
  
  /** Referrer URL */
  referrer: string;
  
  /** User agent string */
  userAgent: string;
  
  /** User language */
  language: string;
  
  /** Screen data */
  screen: ScreenData;
  
  /** Viewport data */
  viewport: ViewportData;
  
  /** Page load timestamp */
  timestamp: number;
}

// Screen data
export interface ScreenData {
  /** Screen width in pixels */
  width: number;
  
  /** Screen height in pixels */
  height: number;
  
  /** Screen color depth */
  colorDepth: number;
  
  /** Screen orientation */
  orientation?: string;
}

// Viewport data
export interface ViewportData {
  /** Viewport width in pixels */
  width: number;
  
  /** Viewport height in pixels */
  height: number;
}

// Device information
export interface DeviceData {
  /** Device type (mobile, tablet, desktop) */
  type: string;
  
  /** Operating system */
  os: string;
  
  /** Browser name */
  browser: string;
  
  /** Browser version */
  browserVersion: string;
  
  /** Is touch device */
  isTouchDevice: boolean;
  
  /** Device pixel ratio */
  devicePixelRatio: number;
}

// Consent status
export interface ConsentData {
  /** Has user given consent */
  hasConsent: boolean;
  
  /** Consent timestamp */
  consentTimestamp?: number;
  
  /** Consent version */
  consentVersion?: string;
  
  /** Consent method (banner, popup, etc.) */
  consentMethod?: string;
}

// Error event data
export interface ErrorEventData {
  /** Error message */
  message: string;
  
  /** Error source */
  source: string;
  
  /** Line number */
  lineno?: number;
  
  /** Column number */
  colno?: number;
  
  /** Error stack trace */
  stack?: string;
  
  /** Error timestamp */
  timestamp: number;
}

// Performance metrics
export interface PerformanceMetrics {
  /** Page load time */
  pageLoadTime?: number;
  
  /** DOM content loaded time */
  domContentLoadedTime?: number;
  
  /** First contentful paint */
  firstContentfulPaint?: number;
  
  /** Largest contentful paint */
  largestContentfulPaint?: number;
  
  /** First input delay */
  firstInputDelay?: number;
  
  /** Cumulative layout shift */
  cumulativeLayoutShift?: number;
}

// Event collector interface
export interface EventCollectorInterface {
  /** Collect an event */
  collect(event: TrackingEvent, immediate?: boolean): void;
  
  /** Flush queued events */
  flush(): Promise<void>;
  
  /** Get queue size */
  getQueueSize(): number;
  
  /** Clear queue */
  clearQueue(): void;
}

// Tracker plugin interface
export interface TrackerPlugin {
  /** Start tracking */
  start(): void;
  
  /** Stop tracking */
  stop(): void;
  
  /** Get plugin name */
  getName(): string;
  
  /** Check if plugin is active */
  isActive(): boolean;
}

// Logger interface
export interface LoggerInterface {
  /** Log debug message */
  log(message: string, ...args: any[]): void;
  
  /** Log warning message */
  warn(message: string, ...args: any[]): void;
  
  /** Log error message */
  error(message: string, ...args: any[]): void;
}

// Storage interface
export interface StorageInterface {
  /** Get item from storage */
  getItem(key: string): string | null;
  
  /** Set item in storage */
  setItem(key: string, value: string): void;
  
  /** Remove item from storage */
  removeItem(key: string): void;
  
  /** Clear all storage */
  clear(): void;
}

// HTTP client interface
export interface HttpClientInterface {
  /** Send POST request */
  post(url: string, data: any): Promise<any>;
  
  /** Send GET request */
  get(url: string): Promise<any>;
}

// Utility types
export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;
export type Unsubscribe = () => void;