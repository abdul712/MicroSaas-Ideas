/**
 * Conversion Rate Optimizer - Client-side Tracking Script
 * Privacy-compliant analytics and A/B testing
 */

(function() {
  'use strict';

  // Configuration
  const CRO_CONFIG = {
    apiBaseUrl: window.CRO_API_URL || 'https://cro-api.example.com',
    projectId: window.CRO_PROJECT_ID,
    debug: window.CRO_DEBUG || false,
    enableRecording: window.CRO_ENABLE_RECORDING || false,
    sampleRate: window.CRO_SAMPLE_RATE || 0.1,
    privacyMode: window.CRO_PRIVACY_MODE || true
  };

  // Privacy-compliant session management
  class SessionManager {
    constructor() {
      this.sessionId = this.getOrCreateSessionId();
      this.userId = this.getOrCreateUserId();
      this.startTime = Date.now();
      this.pageViews = 0;
      this.events = [];
    }

    getOrCreateSessionId() {
      let sessionId = sessionStorage.getItem('cro_session_id');
      if (!sessionId) {
        sessionId = this.generateId();
        sessionStorage.setItem('cro_session_id', sessionId);
      }
      return sessionId;
    }

    getOrCreateUserId() {
      let userId = localStorage.getItem('cro_user_id');
      if (!userId) {
        userId = this.generateId();
        localStorage.setItem('cro_user_id', userId);
      }
      return CRO_CONFIG.privacyMode ? this.hashId(userId) : userId;
    }

    generateId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    hashId(id) {
      // Simple hash for privacy (in production, use crypto.subtle)
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }

  // Event tracking with privacy compliance
  class EventTracker {
    constructor(sessionManager) {
      this.sessionManager = sessionManager;
      this.queue = [];
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
      this.startBatch();
    }

    setupEventListeners() {
      // Page view tracking
      this.trackPageView();

      // Click tracking
      document.addEventListener('click', (e) => {
        this.trackClick(e);
      }, true);

      // Scroll tracking
      let scrollTimeout;
      let maxScrollDepth = 0;
      
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          const scrollDepth = this.getScrollDepth();
          if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = scrollDepth;
            this.trackEvent('scroll', {
              scrollDepth: scrollDepth,
              maxScrollDepth: maxScrollDepth
            });
          }
        }, 100);
      });

      // Form tracking
      this.setupFormTracking();

      // Performance tracking
      this.trackPerformance();

      // Visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEvent('page_hidden');
          this.flush(); // Send any pending events
        } else {
          this.trackEvent('page_visible');
        }
      });

      // Before unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Online/offline status
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flush();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }

    trackPageView() {
      this.sessionManager.pageViews++;
      
      const referrer = document.referrer || '';
      const url = window.location.href;
      
      this.trackEvent('pageview', {
        url: url,
        referrer: CRO_CONFIG.privacyMode ? this.extractDomain(referrer) : referrer,
        title: document.title,
        userAgent: CRO_CONFIG.privacyMode ? this.generalizeUserAgent() : navigator.userAgent,
        language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        screen: `${screen.width}x${screen.height}`,
        deviceType: this.getDeviceType(),
        timestamp: Date.now()
      });
    }

    trackClick(event) {
      const element = event.target;
      const rect = element.getBoundingClientRect();
      
      this.trackEvent('click', {
        elementTag: element.tagName.toLowerCase(),
        elementText: this.getElementText(element),
        elementId: element.id || null,
        elementClass: element.className || null,
        elementPath: this.getElementPath(element),
        clickX: rect.left + event.offsetX,
        clickY: rect.top + event.offsetY,
        pageX: event.pageX,
        pageY: event.pageY,
        timestamp: Date.now()
      });
    }

    setupFormTracking() {
      const forms = document.querySelectorAll('form');
      
      forms.forEach(form => {
        const formId = form.id || this.getElementPath(form);
        
        // Track form start
        form.addEventListener('focusin', (e) => {
          if (e.target.type !== 'submit' && e.target.type !== 'button') {
            this.trackEvent('form_start', {
              formId: formId,
              fieldName: e.target.name || e.target.id,
              fieldType: e.target.type,
              timestamp: Date.now()
            });
          }
        }, { once: true });

        // Track field interactions
        form.addEventListener('input', (e) => {
          this.trackEvent('form_input', {
            formId: formId,
            fieldName: e.target.name || e.target.id,
            fieldType: e.target.type,
            timestamp: Date.now()
          });
        });

        // Track form submission
        form.addEventListener('submit', (e) => {
          this.trackEvent('form_submit', {
            formId: formId,
            timestamp: Date.now()
          });
        });

        // Track form abandonment
        const fields = form.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
          field.addEventListener('blur', (e) => {
            setTimeout(() => {
              if (!form.contains(document.activeElement)) {
                this.trackEvent('form_abandon', {
                  formId: formId,
                  lastField: e.target.name || e.target.id,
                  timestamp: Date.now()
                });
              }
            }, 100);
          });
        });
      });
    }

    trackPerformance() {
      if ('performance' in window) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            const perfData = performance.timing;
            const loadTime = perfData.loadEventEnd - perfData.navigationStart;
            
            this.trackEvent('performance', {
              loadTime: loadTime,
              domReady: perfData.domContentLoadedEventEnd - perfData.navigationStart,
              firstPaint: this.getFirstPaint(),
              cls: this.getCLS(),
              lcp: this.getLCP(),
              fid: this.getFID(),
              timestamp: Date.now()
            });
          }, 1000);
        });
      }
    }

    trackEvent(type, properties = {}) {
      const event = {
        type: type,
        properties: this.sanitizeProperties(properties),
        sessionId: this.sessionManager.sessionId,
        userId: this.sessionManager.userId,
        projectId: CRO_CONFIG.projectId,
        url: window.location.href,
        timestamp: Date.now()
      };

      this.queue.push(event);
      
      if (CRO_CONFIG.debug) {
        console.log('CRO Event:', event);
      }

      // Send immediately for important events
      if (['conversion', 'purchase', 'signup'].includes(type)) {
        this.flush();
      }
    }

    trackConversion(value = null, currency = 'USD') {
      this.trackEvent('conversion', {
        value: value,
        currency: currency,
        timestamp: Date.now()
      });
    }

    sanitizeProperties(properties) {
      const sanitized = { ...properties };
      
      // Remove sensitive data if privacy mode is enabled
      if (CRO_CONFIG.privacyMode) {
        delete sanitized.email;
        delete sanitized.phone;
        delete sanitized.name;
        delete sanitized.address;
      }

      return sanitized;
    }

    startBatch() {
      setInterval(() => {
        if (this.queue.length > 0) {
          this.flush();
        }
      }, 5000); // Send every 5 seconds
    }

    flush() {
      if (this.queue.length === 0 || !this.isOnline) {
        return;
      }

      const events = [...this.queue];
      this.queue = [];

      const payload = {
        projectId: CRO_CONFIG.projectId,
        events: events
      };

      // Use beacon API for reliability
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon(
          `${CRO_CONFIG.apiBaseUrl}/api/track`,
          JSON.stringify(payload)
        );
      } else {
        // Fallback to fetch
        fetch(`${CRO_CONFIG.apiBaseUrl}/api/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(error => {
          if (CRO_CONFIG.debug) {
            console.error('Failed to send events:', error);
          }
          // Re-queue events on error
          this.queue.unshift(...events);
        });
      }
    }

    // Utility methods
    getElementText(element) {
      return element.textContent?.trim().substring(0, 100) || '';
    }

    getElementPath(element) {
      const path = [];
      let current = element;
      
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector += `#${current.id}`;
        } else if (current.className) {
          selector += `.${current.className.split(' ').join('.')}`;
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      return path.join(' > ');
    }

    getScrollDepth() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );
      const windowHeight = window.innerHeight;
      
      return Math.min(100, Math.round((scrollTop + windowHeight) / documentHeight * 100));
    }

    getDeviceType() {
      const width = window.innerWidth;
      if (width < 768) return 'mobile';
      if (width < 1024) return 'tablet';
      return 'desktop';
    }

    generalizeUserAgent() {
      const ua = navigator.userAgent;
      if (ua.includes('Chrome')) return 'Chrome';
      if (ua.includes('Firefox')) return 'Firefox';
      if (ua.includes('Safari')) return 'Safari';
      if (ua.includes('Edge')) return 'Edge';
      return 'Unknown';
    }

    extractDomain(url) {
      try {
        return new URL(url).hostname;
      } catch {
        return '';
      }
    }

    getFirstPaint() {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
      }
      return null;
    }

    getCLS() {
      // Cumulative Layout Shift - simplified implementation
      return 0; // Would need proper implementation with PerformanceObserver
    }

    getLCP() {
      // Largest Contentful Paint - simplified implementation
      return 0; // Would need proper implementation with PerformanceObserver
    }

    getFID() {
      // First Input Delay - simplified implementation
      return 0; // Would need proper implementation with PerformanceObserver
    }
  }

  // A/B Testing Engine
  class ABTestEngine {
    constructor(eventTracker) {
      this.eventTracker = eventTracker;
      this.experiments = new Map();
      this.allocations = new Map();
      this.loadExperiments();
    }

    async loadExperiments() {
      try {
        const response = await fetch(`${CRO_CONFIG.apiBaseUrl}/api/experiments/${CRO_CONFIG.projectId}`);
        const experiments = await response.json();
        
        experiments.forEach(exp => {
          this.experiments.set(exp.id, exp);
          this.allocateUser(exp);
        });
      } catch (error) {
        if (CRO_CONFIG.debug) {
          console.error('Failed to load experiments:', error);
        }
      }
    }

    allocateUser(experiment) {
      if (experiment.status !== 'running') return;

      const userId = this.eventTracker.sessionManager.userId;
      const hash = this.hash(userId + experiment.id);
      const bucket = hash % 10000;

      let cumulativeWeight = 0;
      for (const variant of experiment.variants) {
        cumulativeWeight += variant.trafficPercentage * 100;
        if (bucket < cumulativeWeight) {
          this.allocations.set(experiment.id, variant.id);
          this.applyVariant(variant);
          
          // Track experiment exposure
          this.eventTracker.trackEvent('experiment_exposure', {
            experimentId: experiment.id,
            variantId: variant.id
          });
          
          break;
        }
      }
    }

    applyVariant(variant) {
      if (!variant.changes || variant.changes.length === 0) return;

      variant.changes.forEach(change => {
        try {
          const elements = document.querySelectorAll(change.selector);
          elements.forEach(element => {
            this.applyChange(element, change);
          });
        } catch (error) {
          if (CRO_CONFIG.debug) {
            console.error('Failed to apply change:', change, error);
          }
        }
      });
    }

    applyChange(element, change) {
      switch (change.changeType) {
        case 'text':
          element.textContent = change.value;
          break;
        case 'html':
          element.innerHTML = change.value;
          break;
        case 'style':
          element.style[change.property] = change.value;
          break;
        case 'attribute':
          element.setAttribute(change.property, change.value);
          break;
      }
    }

    hash(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash);
    }

    getActiveExperiments() {
      return Array.from(this.allocations.entries()).map(([expId, variantId]) => ({
        experimentId: expId,
        variantId: variantId
      }));
    }
  }

  // Session Recording (privacy-compliant)
  class SessionRecorder {
    constructor(eventTracker) {
      this.eventTracker = eventTracker;
      this.isRecording = false;
      this.events = [];
      this.maskSelectors = [
        'input[type="password"]',
        'input[type="email"]',
        'input[name*="credit"]',
        'input[name*="ssn"]',
        '[data-sensitive]'
      ];
      
      if (CRO_CONFIG.enableRecording && Math.random() < CRO_CONFIG.sampleRate) {
        this.startRecording();
      }
    }

    startRecording() {
      this.isRecording = true;
      
      // Record DOM mutations
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          this.recordMutation(mutation);
        });
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });

      // Record mouse movements (throttled)
      let mouseTimeout;
      document.addEventListener('mousemove', (e) => {
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => {
          this.recordEvent('mousemove', {
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
          });
        }, 100);
      });

      // Record clicks
      document.addEventListener('click', (e) => {
        this.recordEvent('click', {
          x: e.clientX,
          y: e.clientY,
          target: this.getElementPath(e.target),
          timestamp: Date.now()
        });
      });

      // Record scrolls
      window.addEventListener('scroll', () => {
        this.recordEvent('scroll', {
          x: window.pageXOffset,
          y: window.pageYOffset,
          timestamp: Date.now()
        });
      });
    }

    recordEvent(type, data) {
      if (!this.isRecording) return;

      this.events.push({
        type: type,
        data: this.maskSensitiveData(data),
        timestamp: Date.now()
      });

      // Limit recording size
      if (this.events.length > 1000) {
        this.events = this.events.slice(-500);
      }
    }

    recordMutation(mutation) {
      if (!this.isRecording) return;

      const data = {
        type: mutation.type,
        target: this.getElementPath(mutation.target),
        timestamp: Date.now()
      };

      if (mutation.type === 'attributes') {
        data.attributeName = mutation.attributeName;
        data.oldValue = mutation.oldValue;
        data.newValue = mutation.target.getAttribute(mutation.attributeName);
      }

      this.recordEvent('mutation', data);
    }

    maskSensitiveData(data) {
      // Mask sensitive information
      const masked = { ...data };
      
      if (masked.target && this.isSensitiveElement(masked.target)) {
        masked.target = '[MASKED]';
      }

      return masked;
    }

    isSensitiveElement(elementPath) {
      return this.maskSelectors.some(selector => 
        elementPath.toLowerCase().includes(selector.toLowerCase())
      );
    }

    getElementPath(element) {
      // Same implementation as in EventTracker
      const path = [];
      let current = element;
      
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();
        
        if (current.id) {
          selector += `#${current.id}`;
        } else if (current.className) {
          selector += `.${current.className.split(' ').join('.')}`;
        }
        
        path.unshift(selector);
        current = current.parentElement;
      }
      
      return path.join(' > ');
    }

    stopRecording() {
      this.isRecording = false;
      if (this.observer) {
        this.observer.disconnect();
      }
    }

    getRecording() {
      return {
        sessionId: this.eventTracker.sessionManager.sessionId,
        events: this.events,
        duration: Date.now() - this.eventTracker.sessionManager.startTime
      };
    }
  }

  // Initialize the CRO system
  function initializeCRO() {
    if (!CRO_CONFIG.projectId) {
      console.warn('CRO: Project ID not configured');
      return;
    }

    const sessionManager = new SessionManager();
    const eventTracker = new EventTracker(sessionManager);
    const abTestEngine = new ABTestEngine(eventTracker);
    const sessionRecorder = new SessionRecorder(eventTracker);

    // Expose global API
    window.CRO = {
      track: (eventType, properties) => eventTracker.trackEvent(eventType, properties),
      trackConversion: (value, currency) => eventTracker.trackConversion(value, currency),
      getExperiments: () => abTestEngine.getActiveExperiments(),
      getSessionId: () => sessionManager.sessionId,
      getUserId: () => sessionManager.userId,
      flush: () => eventTracker.flush()
    };

    if (CRO_CONFIG.debug) {
      console.log('CRO initialized', {
        projectId: CRO_CONFIG.projectId,
        sessionId: sessionManager.sessionId,
        userId: sessionManager.userId
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCRO);
  } else {
    initializeCRO();
  }

})();