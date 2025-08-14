/**
 * Customer Journey Mapper - JavaScript Tracking SDK
 * Lightweight SDK for tracking customer interactions across web properties
 */

export interface JourneyConfig {
  apiUrl: string
  organizationId: string
  apiKey: string
  debug?: boolean
  autoTrack?: boolean
  respectDoNotTrack?: boolean
  sessionTimeout?: number // in minutes
  batchSize?: number
  flushInterval?: number // in milliseconds
}

export interface EventProperties {
  [key: string]: string | number | boolean | null
}

export interface TrackEventData {
  eventType: string
  eventName: string
  properties?: EventProperties
  customerId?: string
  journeyId?: string
  touchpointId?: string
  timestamp?: Date
}

export interface Customer {
  id: string
  email?: string
  attributes?: Record<string, any>
}

class JourneyTracker {
  private config: Required<JourneyConfig>
  private customerId?: string
  private sessionId: string
  private eventQueue: TrackEventData[] = []
  private sessionData: Record<string, any> = {}
  private initialized = false
  private flushTimer?: NodeJS.Timeout

  constructor(config: JourneyConfig) {
    this.config = {
      debug: false,
      autoTrack: true,
      respectDoNotTrack: true,
      sessionTimeout: 30,
      batchSize: 50,
      flushInterval: 5000,
      ...config,
    }

    this.sessionId = this.generateSessionId()
    this.init()
  }

  private init(): void {
    if (typeof window === 'undefined') {
      console.warn('JourneyTracker: Window not available, skipping initialization')
      return
    }

    // Check Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      console.log('JourneyTracker: Do Not Track enabled, tracking disabled')
      return
    }

    // Restore or create customer ID
    this.customerId = this.getOrCreateCustomerId()

    // Set up automatic tracking if enabled
    if (this.config.autoTrack) {
      this.setupAutoTracking()
    }

    // Start batch flushing
    this.startBatchFlushing()

    // Track page view on initialization
    this.track({
      eventType: 'PAGE_VIEW',
      eventName: 'page_view',
      properties: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      },
    })

    this.initialized = true
    this.debug('Initialized with config:', this.config)
  }

  /**
   * Track a custom event
   */
  track(data: TrackEventData): void {
    if (!this.initialized || this.isDoNotTrackEnabled()) {
      return
    }

    const event: TrackEventData = {
      ...data,
      customerId: data.customerId || this.customerId,
      timestamp: data.timestamp || new Date(),
      properties: {
        session_id: this.sessionId,
        page_url: window.location.href,
        page_title: document.title,
        ...data.properties,
      },
    }

    this.eventQueue.push(event)
    this.debug('Tracked event:', event)

    // Flush immediately if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush()
    }
  }

  /**
   * Identify a customer
   */
  identify(customer: Customer): void {
    if (!this.initialized) {
      console.warn('JourneyTracker: Not initialized')
      return
    }

    this.customerId = customer.id
    this.setLocalStorage('journey_customer_id', customer.id)

    if (customer.email) {
      this.setLocalStorage('journey_customer_email', customer.email)
    }

    // Track identify event
    this.track({
      eventType: 'CUSTOM',
      eventName: 'customer_identified',
      properties: {
        customer_email: customer.email,
        ...customer.attributes,
      },
    })

    this.debug('Customer identified:', customer)
  }

  /**
   * Track page view
   */
  page(properties?: EventProperties): void {
    this.track({
      eventType: 'PAGE_VIEW',
      eventName: 'page_view',
      properties: {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        ...properties,
      },
    })
  }

  /**
   * Track custom event with name and properties
   */
  event(eventName: string, properties?: EventProperties): void {
    this.track({
      eventType: 'CUSTOM',
      eventName,
      properties,
    })
  }

  /**
   * Track conversion event
   */
  conversion(conversionName: string, value?: number, properties?: EventProperties): void {
    this.track({
      eventType: 'PURCHASE',
      eventName: conversionName,
      properties: {
        conversion_value: value,
        ...properties,
      },
    })
  }

  /**
   * Start a new session
   */
  startSession(): void {
    this.sessionId = this.generateSessionId()
    this.sessionData = {}
    
    this.track({
      eventType: 'CUSTOM',
      eventName: 'session_started',
      properties: {
        new_session_id: this.sessionId,
      },
    })
  }

  /**
   * End current session
   */
  endSession(): void {
    this.track({
      eventType: 'CUSTOM',
      eventName: 'session_ended',
      properties: {
        session_duration: this.getSessionDuration(),
      },
    })

    this.flush()
  }

  /**
   * Manually flush events to server
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return
    }

    const eventsToSend = [...this.eventQueue]
    this.eventQueue = []

    try {
      const response = await fetch(`${this.config.apiUrl}/track/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Organization-ID': this.config.organizationId,
        },
        body: JSON.stringify({ events: eventsToSend }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      this.debug(`Flushed ${eventsToSend.length} events`)
    } catch (error) {
      console.error('JourneyTracker: Failed to send events:', error)
      // Re-queue events on failure
      this.eventQueue.unshift(...eventsToSend)
    }
  }

  /**
   * Set up automatic event tracking
   */
  private setupAutoTracking(): void {
    if (typeof window === 'undefined') return

    // Track clicks on links and buttons
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      
      if (tagName === 'a' || tagName === 'button' || target.closest('button')) {
        const element = tagName === 'button' ? target : target.closest('button') || target
        
        this.track({
          eventType: 'CLICK',
          eventName: 'element_clicked',
          properties: {
            element_type: element.tagName.toLowerCase(),
            element_text: element.textContent?.trim() || '',
            element_id: (element as HTMLElement).id || '',
            element_class: (element as HTMLElement).className || '',
            href: (element as HTMLAnchorElement).href || '',
          },
        })
      }
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      
      this.track({
        eventType: 'FORM_SUBMIT',
        eventName: 'form_submitted',
        properties: {
          form_id: form.id || '',
          form_class: form.className || '',
          form_action: form.action || '',
          form_method: form.method || 'GET',
        },
      })
    })

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.track({
        eventType: 'CUSTOM',
        eventName: document.hidden ? 'page_hidden' : 'page_visible',
        properties: {
          visibility_state: document.visibilityState,
        },
      })
    })

    // Track scroll depth
    let maxScrollDepth = 0
    const trackScrollDepth = () => {
      const scrollDepth = Math.round(
        (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
      )
      
      if (scrollDepth > maxScrollDepth && scrollDepth % 25 === 0) {
        maxScrollDepth = scrollDepth
        this.track({
          eventType: 'CUSTOM',
          eventName: 'scroll_depth',
          properties: {
            scroll_depth: scrollDepth,
          },
        })
      }
    }

    window.addEventListener('scroll', trackScrollDepth, { passive: true })
  }

  /**
   * Start automatic event flushing
   */
  private startBatchFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.config.flushInterval)

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush()
    })
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get or create customer ID
   */
  private getOrCreateCustomerId(): string {
    let customerId = this.getLocalStorage('journey_customer_id')
    
    if (!customerId) {
      customerId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      this.setLocalStorage('journey_customer_id', customerId)
    }
    
    return customerId
  }

  /**
   * Check if Do Not Track is enabled
   */
  private isDoNotTrackEnabled(): boolean {
    return (
      navigator.doNotTrack === '1' ||
      (window as any).doNotTrack === '1' ||
      navigator.msDoNotTrack === '1'
    )
  }

  /**
   * Get session duration in seconds
   */
  private getSessionDuration(): number {
    const sessionStart = this.getLocalStorage('journey_session_start')
    if (sessionStart) {
      return Math.round((Date.now() - parseInt(sessionStart)) / 1000)
    }
    return 0
  }

  /**
   * Safe localStorage operations
   */
  private setLocalStorage(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      this.debug('LocalStorage not available:', error)
    }
  }

  private getLocalStorage(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      this.debug('LocalStorage not available:', error)
      return null
    }
  }

  /**
   * Debug logging
   */
  private debug(...args: any[]): void {
    if (this.config.debug) {
      console.log('JourneyTracker:', ...args)
    }
  }
}

// Global instance
let trackerInstance: JourneyTracker | null = null

/**
 * Initialize the Journey Tracker
 */
export function initJourneyTracker(config: JourneyConfig): JourneyTracker {
  trackerInstance = new JourneyTracker(config)
  return trackerInstance
}

/**
 * Get the global tracker instance
 */
export function getJourneyTracker(): JourneyTracker | null {
  return trackerInstance
}

/**
 * Convenience functions for the global tracker
 */
export const journey = {
  track: (data: TrackEventData) => trackerInstance?.track(data),
  identify: (customer: Customer) => trackerInstance?.identify(customer),
  page: (properties?: EventProperties) => trackerInstance?.page(properties),
  event: (eventName: string, properties?: EventProperties) => trackerInstance?.event(eventName, properties),
  conversion: (conversionName: string, value?: number, properties?: EventProperties) => 
    trackerInstance?.conversion(conversionName, value, properties),
  flush: () => trackerInstance?.flush(),
}

export default JourneyTracker