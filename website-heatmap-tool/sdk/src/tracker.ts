import { EventCollector } from './event-collector'
import { PrivacyManager } from './privacy-manager'
import { SessionManager } from './session-manager'
import { PerformanceMonitor } from './performance-monitor'
import { 
  HeatmapConfig, 
  HeatmapEvent, 
  ClickEvent, 
  ScrollEvent, 
  HoverEvent,
  FormEvent,
  PageViewEvent,
  EventType 
} from './types'

export class HeatmapTracker {
  private config: HeatmapConfig
  private eventCollector: EventCollector
  private privacyManager: PrivacyManager
  private sessionManager: SessionManager
  private performanceMonitor: PerformanceMonitor
  private isTracking = false
  private eventListeners: Array<{ element: EventTarget; event: string; handler: EventListener }> = []

  constructor(config: HeatmapConfig) {
    this.config = this.validateConfig(config)
    
    // Initialize managers
    this.privacyManager = new PrivacyManager(this.config)
    this.sessionManager = new SessionManager()
    this.eventCollector = new EventCollector(this.config, this.sessionManager)
    this.performanceMonitor = new PerformanceMonitor()

    if (this.config.debug) {
      console.log('HeatmapTracker initialized', this.config)
    }

    // Track initial page view
    this.trackPageView()
  }

  /**
   * Validate and normalize configuration
   */
  private validateConfig(config: HeatmapConfig): HeatmapConfig {
    if (!config.trackingId) {
      throw new Error('trackingId is required')
    }

    if (!config.apiUrl) {
      throw new Error('apiUrl is required')
    }

    return {
      trackingId: config.trackingId,
      apiUrl: config.apiUrl.replace(/\/$/, ''), // Remove trailing slash
      enableClickTracking: config.enableClickTracking ?? true,
      enableScrollTracking: config.enableScrollTracking ?? true,
      enableHoverTracking: config.enableHoverTracking ?? false,
      enableFormTracking: config.enableFormTracking ?? true,
      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      respectDoNotTrack: config.respectDoNotTrack ?? true,
      sampleRate: Math.max(0, Math.min(1, config.sampleRate ?? 1)),
      batchSize: Math.max(1, config.batchSize ?? 10),
      flushInterval: Math.max(1000, config.flushInterval ?? 5000),
      maxEventAge: Math.max(60000, config.maxEventAge ?? 300000),
      debug: config.debug ?? false,
      excludeElements: config.excludeElements ?? [],
      includeElements: config.includeElements ?? [],
      captureAttributes: config.captureAttributes ?? ['id', 'class', 'data-*'],
      privacy: {
        maskTextContent: config.privacy?.maskTextContent ?? true,
        maskSensitiveElements: config.privacy?.maskSensitiveElements ?? true,
        excludeInputValues: config.privacy?.excludeInputValues ?? true,
        ...config.privacy
      }
    }
  }

  /**
   * Start tracking user interactions
   */
  public start(): void {
    if (this.isTracking) {
      if (this.config.debug) {
        console.warn('HeatmapTracker already tracking')
      }
      return
    }

    // Check if tracking is allowed
    if (!this.privacyManager.isTrackingAllowed()) {
      if (this.config.debug) {
        console.log('Tracking not allowed due to privacy settings')
      }
      return
    }

    // Check sampling
    if (Math.random() > this.config.sampleRate) {
      if (this.config.debug) {
        console.log('User not in sample, skipping tracking')
      }
      return
    }

    this.isTracking = true

    // Set up event listeners
    this.setupEventListeners()

    // Start performance monitoring
    if (this.config.enablePerformanceTracking) {
      this.performanceMonitor.start()
    }

    if (this.config.debug) {
      console.log('HeatmapTracker started')
    }
  }

  /**
   * Stop tracking user interactions
   */
  public stop(): void {
    if (!this.isTracking) {
      return
    }

    this.isTracking = false

    // Remove all event listeners
    this.removeEventListeners()

    // Flush any remaining events
    this.eventCollector.flush()

    // Stop performance monitoring
    this.performanceMonitor.stop()

    if (this.config.debug) {
      console.log('HeatmapTracker stopped')
    }
  }

  /**
   * Track a custom event
   */
  public track(event: Partial<HeatmapEvent>): void {
    if (!this.isTracking || !this.privacyManager.isTrackingAllowed()) {
      return
    }

    const fullEvent: HeatmapEvent = {
      type: EventType.CUSTOM,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...event
    }

    this.eventCollector.collect(fullEvent)
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<HeatmapConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Update dependent managers
    this.privacyManager.updateConfig(this.config)
    this.eventCollector.updateConfig(this.config)

    if (this.config.debug) {
      console.log('HeatmapTracker config updated', this.config)
    }
  }

  /**
   * Get current session information
   */
  public getSession(): { sessionId: string; userId?: string } {
    return {
      sessionId: this.sessionManager.getSessionId(),
      userId: this.sessionManager.getUserId()
    }
  }

  /**
   * Set user identifier
   */
  public identify(userId: string, userProperties?: Record<string, any>): void {
    this.sessionManager.setUserId(userId)
    
    if (userProperties) {
      this.sessionManager.setUserProperties(userProperties)
    }

    // Track identify event
    this.track({
      type: EventType.IDENTIFY,
      userId,
      userProperties
    })
  }

  /**
   * Clear user data and start new session
   */
  public reset(): void {
    this.sessionManager.reset()
    
    if (this.config.debug) {
      console.log('HeatmapTracker reset - new session started')
    }
  }

  /**
   * Setup event listeners for tracking
   */
  private setupEventListeners(): void {
    if (this.config.enableClickTracking) {
      this.addEventListener(document, 'click', this.handleClick.bind(this))
    }

    if (this.config.enableScrollTracking) {
      this.addEventListener(window, 'scroll', this.throttle(this.handleScroll.bind(this), 100))
    }

    if (this.config.enableHoverTracking) {
      this.addEventListener(document, 'mouseover', this.throttle(this.handleHover.bind(this), 200))
    }

    if (this.config.enableFormTracking) {
      this.addEventListener(document, 'submit', this.handleFormSubmit.bind(this))
      this.addEventListener(document, 'focus', this.handleFormFocus.bind(this), true)
      this.addEventListener(document, 'blur', this.handleFormBlur.bind(this), true)
    }

    // Page lifecycle events
    this.addEventListener(window, 'beforeunload', this.handleBeforeUnload.bind(this))
    this.addEventListener(document, 'visibilitychange', this.handleVisibilityChange.bind(this))
  }

  /**
   * Remove all event listeners
   */
  private removeEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler)
    })
    this.eventListeners = []
  }

  /**
   * Add event listener and track it for cleanup
   */
  private addEventListener(
    element: EventTarget, 
    event: string, 
    handler: EventListener, 
    useCapture = false
  ): void {
    element.addEventListener(event, handler, useCapture)
    this.eventListeners.push({ element, event, handler })
  }

  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    const target = event.target as Element
    
    if (!this.shouldTrackElement(target)) {
      return
    }

    const clickEvent: ClickEvent = {
      type: EventType.CLICK,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      x: event.clientX,
      y: event.clientY,
      element: this.serializeElement(target),
      button: event.button,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey
    }

    this.eventCollector.collect(clickEvent)
  }

  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    const scrollEvent: ScrollEvent = {
      type: EventType.SCROLL,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      scrollPercentage: this.calculateScrollPercentage(),
      documentHeight: document.documentElement.scrollHeight
    }

    this.eventCollector.collect(scrollEvent)
  }

  /**
   * Handle hover events
   */
  private handleHover(event: MouseEvent): void {
    const target = event.target as Element
    
    if (!this.shouldTrackElement(target)) {
      return
    }

    const hoverEvent: HoverEvent = {
      type: EventType.HOVER,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      x: event.clientX,
      y: event.clientY,
      element: this.serializeElement(target)
    }

    this.eventCollector.collect(hoverEvent)
  }

  /**
   * Handle form submission
   */
  private handleFormSubmit(event: Event): void {
    const target = event.target as HTMLFormElement
    
    if (!this.shouldTrackElement(target)) {
      return
    }

    const formEvent: FormEvent = {
      type: EventType.FORM_SUBMIT,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      element: this.serializeElement(target),
      formData: this.serializeFormData(target)
    }

    this.eventCollector.collect(formEvent)
  }

  /**
   * Handle form focus
   */
  private handleFormFocus(event: Event): void {
    const target = event.target as HTMLElement
    
    if (!this.isFormElement(target) || !this.shouldTrackElement(target)) {
      return
    }

    const formEvent: FormEvent = {
      type: EventType.FORM_FOCUS,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      element: this.serializeElement(target)
    }

    this.eventCollector.collect(formEvent)
  }

  /**
   * Handle form blur
   */
  private handleFormBlur(event: Event): void {
    const target = event.target as HTMLElement
    
    if (!this.isFormElement(target) || !this.shouldTrackElement(target)) {
      return
    }

    const formEvent: FormEvent = {
      type: EventType.FORM_BLUR,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      element: this.serializeElement(target)
    }

    this.eventCollector.collect(formEvent)
  }

  /**
   * Handle page unload
   */
  private handleBeforeUnload(): void {
    this.eventCollector.flush()
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.eventCollector.flush()
    }
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    const pageViewEvent: PageViewEvent = {
      type: EventType.PAGE_VIEW,
      timestamp: Date.now(),
      sessionId: this.sessionManager.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      referrer: document.referrer,
      title: document.title
    }

    this.eventCollector.collect(pageViewEvent)
  }

  /**
   * Check if element should be tracked
   */
  private shouldTrackElement(element: Element): boolean {
    // Check exclude list
    if (this.config.excludeElements.length > 0) {
      for (const selector of this.config.excludeElements) {
        if (element.matches(selector)) {
          return false
        }
      }
    }

    // Check include list
    if (this.config.includeElements.length > 0) {
      for (const selector of this.config.includeElements) {
        if (element.matches(selector)) {
          return true
        }
      }
      return false
    }

    return true
  }

  /**
   * Check if element is a form element
   */
  private isFormElement(element: HTMLElement): boolean {
    const formElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']
    return formElements.includes(element.tagName)
  }

  /**
   * Serialize element information
   */
  private serializeElement(element: Element): any {
    const serialized: any = {
      tagName: element.tagName.toLowerCase(),
      selector: this.generateSelector(element)
    }

    // Capture specified attributes
    this.config.captureAttributes.forEach(attr => {
      if (attr.endsWith('*')) {
        const prefix = attr.slice(0, -1)
        Array.from(element.attributes).forEach(({ name, value }) => {
          if (name.startsWith(prefix)) {
            serialized[name] = value
          }
        })
      } else {
        const value = element.getAttribute(attr)
        if (value !== null) {
          serialized[attr] = value
        }
      }
    })

    // Add text content if not masked
    if (!this.config.privacy.maskTextContent && element.textContent) {
      serialized.textContent = element.textContent.trim().substring(0, 100)
    }

    return serialized
  }

  /**
   * Serialize form data
   */
  private serializeFormData(form: HTMLFormElement): any {
    if (this.config.privacy.excludeInputValues) {
      return { fieldsCount: form.elements.length }
    }

    const formData: any = {}
    const data = new FormData(form)
    
    for (const [key, value] of data.entries()) {
      // Don't capture sensitive fields
      if (this.isSensitiveField(key)) {
        formData[key] = '[MASKED]'
      } else {
        formData[key] = value.toString().substring(0, 100)
      }
    }

    return formData
  }

  /**
   * Check if field is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const sensitiveFields = [
      'password', 'pass', 'pwd', 'secret', 'token',
      'ssn', 'social', 'credit', 'card', 'cvv', 'cvc',
      'bank', 'account', 'routing'
    ]
    
    const lowerName = fieldName.toLowerCase()
    return sensitiveFields.some(field => lowerName.includes(field))
  }

  /**
   * Generate CSS selector for element
   */
  private generateSelector(element: Element): string {
    if (element.id) {
      return `#${element.id}`
    }

    const parts: string[] = []
    let current: Element | null = element

    while (current && current !== document.documentElement) {
      let selector = current.tagName.toLowerCase()
      
      if (current.className) {
        const classes = current.className.split(' ').filter(c => c.trim())
        if (classes.length > 0) {
          selector += '.' + classes.join('.')
        }
      }

      parts.unshift(selector)
      current = current.parentElement
    }

    return parts.join(' > ')
  }

  /**
   * Calculate scroll percentage
   */
  private calculateScrollPercentage(): number {
    const scrollTop = window.scrollY
    const documentHeight = document.documentElement.scrollHeight
    const windowHeight = window.innerHeight
    const scrollableHeight = documentHeight - windowHeight

    if (scrollableHeight <= 0) {
      return 100
    }

    return Math.round((scrollTop / scrollableHeight) * 100)
  }

  /**
   * Throttle function to limit event frequency
   */
  private throttle<T extends (...args: any[]) => any>(
    func: T, 
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastExecTime = 0

    return (...args: Parameters<T>) => {
      const currentTime = Date.now()

      if (currentTime - lastExecTime > delay) {
        func(...args)
        lastExecTime = currentTime
      } else {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        
        timeoutId = setTimeout(() => {
          func(...args)
          lastExecTime = Date.now()
        }, delay - (currentTime - lastExecTime))
      }
    }
  }
}