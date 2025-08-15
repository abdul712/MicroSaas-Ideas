/**
 * HeatMap Analytics Tracking Script
 * Lightweight user behavior tracking for heatmaps
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    apiUrl: 'https://api.heatmapanalytics.com',
    batchSize: 50,
    flushInterval: 5000, // 5 seconds
    maxStorageSize: 1000,
    trackingEnabled: true,
    privacyMode: false,
    throttleDelay: 100,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  };

  // Global variables
  let trackingId = null;
  let sessionId = null;
  let pageViewId = null;
  let eventQueue = [];
  let lastFlush = Date.now();
  let mouseTracker = null;
  let scrollTracker = null;
  let isRecording = false;

  // Utility functions
  function generateId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  function getTimestamp() {
    return Date.now();
  }

  function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  function getElementSelector(element) {
    if (!element || element === document.body) return 'body';
    
    let selector = element.tagName.toLowerCase();
    
    if (element.id) {
      selector += '#' + element.id;
      return selector;
    }
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(cls => cls && cls.length > 0)
        .slice(0, 3);
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    // Add nth-child selector for better precision
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        sibling => sibling.tagName === element.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(element) + 1;
        selector += ':nth-child(' + index + ')';
      }
    }
    
    return selector;
  }

  function getElementPath(element) {
    const path = [];
    let current = element;
    
    while (current && current !== document.body && path.length < 5) {
      path.unshift(getElementSelector(current));
      current = current.parentElement;
    }
    
    return path.join(' > ');
  }

  function getViewportSize() {
    return {
      width: window.innerWidth || document.documentElement.clientWidth,
      height: window.innerHeight || document.documentElement.clientHeight
    };
  }

  function getScrollPosition() {
    return {
      x: window.pageXOffset || document.documentElement.scrollLeft,
      y: window.pageYOffset || document.documentElement.scrollTop
    };
  }

  function getDocumentSize() {
    return {
      width: Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      ),
      height: Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      )
    };
  }

  function calculateScrollDepth() {
    const viewport = getViewportSize();
    const document = getDocumentSize();
    const scroll = getScrollPosition();
    
    const maxScrollY = document.height - viewport.height;
    if (maxScrollY <= 0) return 100;
    
    return Math.min(100, Math.round((scroll.y / maxScrollY) * 100));
  }

  // Privacy and consent functions
  function checkConsent() {
    // Check for common consent frameworks
    const consentSources = [
      () => window.gtag && window.gtag('consent', 'query'),
      () => window._tcfapi && window._tcfapi('ping', 2, () => {}),
      () => localStorage.getItem('heatmap-consent'),
      () => sessionStorage.getItem('heatmap-consent'),
      () => document.cookie.includes('heatmap-consent=true')
    ];
    
    for (const source of consentSources) {
      try {
        const consent = source();
        if (consent === true || consent === 'true') {
          return true;
        }
      } catch (e) {
        // Continue checking other sources
      }
    }
    
    // Default to true if no consent framework is detected
    return true;
  }

  function sanitizeData(data) {
    if (CONFIG.privacyMode) {
      // Remove sensitive data in privacy mode
      if (data.element_text) {
        data.element_text = '[REDACTED]';
      }
      if (data.input_value) {
        data.input_value = '[REDACTED]';
      }
      if (data.url) {
        try {
          const url = new URL(data.url);
          data.url = url.origin + url.pathname;
        } catch (e) {
          data.url = '[REDACTED]';
        }
      }
    }
    return data;
  }

  // Session management
  function initSession() {
    const existingSessionId = sessionStorage.getItem('heatmap-session-id');
    const sessionTimestamp = sessionStorage.getItem('heatmap-session-timestamp');
    
    if (existingSessionId && sessionTimestamp) {
      const elapsed = Date.now() - parseInt(sessionTimestamp);
      if (elapsed < CONFIG.sessionTimeout) {
        sessionId = existingSessionId;
        sessionStorage.setItem('heatmap-session-timestamp', Date.now().toString());
        return;
      }
    }
    
    sessionId = generateId();
    sessionStorage.setItem('heatmap-session-id', sessionId);
    sessionStorage.setItem('heatmap-session-timestamp', Date.now().toString());
  }

  function initPageView() {
    pageViewId = generateId();
    
    const viewport = getViewportSize();
    const documentSize = getDocumentSize();
    
    queueEvent({
      type: 'page_view',
      page_view_id: pageViewId,
      session_id: sessionId,
      url: window.location.href,
      title: document.title,
      referrer: document.referrer,
      viewport_width: viewport.width,
      viewport_height: viewport.height,
      document_width: documentSize.width,
      document_height: documentSize.height,
      user_agent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: getTimestamp()
    });
  }

  // Event queuing and sending
  function queueEvent(event) {
    if (!CONFIG.trackingEnabled || !checkConsent()) {
      return;
    }
    
    event = sanitizeData(event);
    event.tracking_id = trackingId;
    event.page_view_id = pageViewId;
    event.session_id = sessionId;
    
    eventQueue.push(event);
    
    // Flush if queue is getting large or enough time has passed
    if (eventQueue.length >= CONFIG.batchSize || 
        Date.now() - lastFlush > CONFIG.flushInterval) {
      flushEvents();
    }
  }

  function flushEvents() {
    if (eventQueue.length === 0) return;
    
    const events = eventQueue.splice(0, CONFIG.batchSize);
    lastFlush = Date.now();
    
    // Send events to server
    sendEvents(events);
  }

  function sendEvents(events) {
    const payload = {
      tracking_id: trackingId,
      events: events,
      timestamp: getTimestamp()
    };
    
    // Use sendBeacon for better reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json'
      });
      
      const success = navigator.sendBeacon(
        CONFIG.apiUrl + '/api/tracking/events',
        blob
      );
      
      if (!success) {
        fallbackSend(payload);
      }
    } else {
      fallbackSend(payload);
    }
  }

  function fallbackSend(payload) {
    // Fallback to fetch with keepalive
    fetch(CONFIG.apiUrl + '/api/tracking/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(error => {
      console.warn('HeatMap Analytics: Failed to send events', error);
      
      // Store events locally for retry
      const stored = localStorage.getItem('heatmap-pending-events') || '[]';
      try {
        const pending = JSON.parse(stored);
        pending.push(...payload.events);
        
        // Limit storage size
        if (pending.length > CONFIG.maxStorageSize) {
          pending.splice(0, pending.length - CONFIG.maxStorageSize);
        }
        
        localStorage.setItem('heatmap-pending-events', JSON.stringify(pending));
      } catch (e) {
        console.warn('HeatMap Analytics: Failed to store events locally', e);
      }
    });
  }

  function retryPendingEvents() {
    try {
      const stored = localStorage.getItem('heatmap-pending-events');
      if (stored) {
        const pending = JSON.parse(stored);
        if (pending.length > 0) {
          sendEvents(pending);
          localStorage.removeItem('heatmap-pending-events');
        }
      }
    } catch (e) {
      console.warn('HeatMap Analytics: Failed to retry pending events', e);
    }
  }

  // Click tracking
  function trackClick(event) {
    const target = event.target;
    if (!target) return;
    
    const rect = target.getBoundingClientRect();
    const scroll = getScrollPosition();
    
    queueEvent({
      type: 'click',
      x: Math.round(event.clientX + scroll.x),
      y: Math.round(event.clientY + scroll.y),
      client_x: Math.round(event.clientX),
      client_y: Math.round(event.clientY),
      element_selector: getElementSelector(target),
      element_path: getElementPath(target),
      element_tag: target.tagName.toLowerCase(),
      element_text: CONFIG.privacyMode ? null : target.textContent?.substring(0, 100),
      element_attributes: {
        id: target.id || null,
        class: target.className || null,
        href: target.href || null,
        src: target.src || null
      },
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: getTimestamp()
    });
  }

  // Mouse movement tracking
  function trackMouseMove(event) {
    const scroll = getScrollPosition();
    
    queueEvent({
      type: 'mouse_move',
      x: Math.round(event.clientX + scroll.x),
      y: Math.round(event.clientY + scroll.y),
      client_x: Math.round(event.clientX),
      client_y: Math.round(event.clientY),
      timestamp: getTimestamp()
    });
  }

  // Scroll tracking
  function trackScroll() {
    const scroll = getScrollPosition();
    const scrollDepth = calculateScrollDepth();
    
    queueEvent({
      type: 'scroll',
      scroll_x: Math.round(scroll.x),
      scroll_y: Math.round(scroll.y),
      scroll_depth: scrollDepth,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timestamp: getTimestamp()
    });
  }

  // Resize tracking
  function trackResize() {
    const viewport = getViewportSize();
    
    queueEvent({
      type: 'resize',
      viewport_width: viewport.width,
      viewport_height: viewport.height,
      timestamp: getTimestamp()
    });
  }

  // Focus and blur tracking
  function trackFocus(event) {
    const target = event.target;
    if (!target) return;
    
    queueEvent({
      type: 'focus',
      element_selector: getElementSelector(target),
      element_path: getElementPath(target),
      element_tag: target.tagName.toLowerCase(),
      timestamp: getTimestamp()
    });
  }

  function trackBlur(event) {
    const target = event.target;
    if (!target) return;
    
    queueEvent({
      type: 'blur',
      element_selector: getElementSelector(target),
      element_path: getElementPath(target),
      element_tag: target.tagName.toLowerCase(),
      timestamp: getTimestamp()
    });
  }

  // Form tracking
  function trackFormSubmit(event) {
    const form = event.target;
    if (!form) return;
    
    queueEvent({
      type: 'form_submit',
      element_selector: getElementSelector(form),
      element_path: getElementPath(form),
      form_action: form.action || null,
      form_method: form.method || null,
      timestamp: getTimestamp()
    });
  }

  // Page lifecycle tracking
  function trackPageHide() {
    queueEvent({
      type: 'page_hide',
      timestamp: getTimestamp()
    });
    
    // Force flush remaining events
    flushEvents();
  }

  function trackPageShow() {
    queueEvent({
      type: 'page_show',
      timestamp: getTimestamp()
    });
  }

  // Initialize event listeners
  function initEventListeners() {
    // Click events
    document.addEventListener('click', trackClick, true);
    
    // Mouse movement (throttled)
    mouseTracker = throttle(trackMouseMove, CONFIG.throttleDelay);
    document.addEventListener('mousemove', mouseTracker, true);
    
    // Scroll events (throttled)
    scrollTracker = throttle(trackScroll, CONFIG.throttleDelay);
    window.addEventListener('scroll', scrollTracker, true);
    
    // Resize events (debounced)
    window.addEventListener('resize', debounce(trackResize, 250), true);
    
    // Focus/blur events
    document.addEventListener('focus', trackFocus, true);
    document.addEventListener('blur', trackBlur, true);
    
    // Form events
    document.addEventListener('submit', trackFormSubmit, true);
    
    // Page lifecycle events
    window.addEventListener('beforeunload', trackPageHide, true);
    window.addEventListener('pagehide', trackPageHide, true);
    window.addEventListener('pageshow', trackPageShow, true);
    
    // Visibility change
    document.addEventListener('visibilitychange', () => {
      queueEvent({
        type: 'visibility_change',
        hidden: document.hidden,
        timestamp: getTimestamp()
      });
    }, true);
  }

  // Public API
  window.HeatMapAnalytics = {
    init: function(options) {
      if (!options || !options.trackingId) {
        console.error('HeatMap Analytics: trackingId is required');
        return;
      }
      
      trackingId = options.trackingId;
      
      // Override config with provided options
      Object.assign(CONFIG, options);
      
      // Initialize session and page view
      initSession();
      initPageView();
      
      // Set up event listeners
      initEventListeners();
      
      // Retry any pending events
      retryPendingEvents();
      
      // Set up periodic flush
      setInterval(flushEvents, CONFIG.flushInterval);
      
      isRecording = true;
      
      console.log('HeatMap Analytics initialized with tracking ID:', trackingId);
    },
    
    stop: function() {
      CONFIG.trackingEnabled = false;
      flushEvents();
      isRecording = false;
    },
    
    resume: function() {
      CONFIG.trackingEnabled = true;
      isRecording = true;
    },
    
    track: function(eventName, properties) {
      queueEvent({
        type: 'custom',
        event_name: eventName,
        properties: properties || {},
        timestamp: getTimestamp()
      });
    },
    
    flush: function() {
      flushEvents();
    },
    
    getSessionId: function() {
      return sessionId;
    },
    
    getPageViewId: function() {
      return pageViewId;
    },
    
    isRecording: function() {
      return isRecording;
    }
  };

  // Auto-initialize if script has data attributes
  const script = document.currentScript;
  if (script && script.dataset.trackingId) {
    window.HeatMapAnalytics.init({
      trackingId: script.dataset.trackingId,
      apiUrl: script.dataset.apiUrl || CONFIG.apiUrl,
      privacyMode: script.dataset.privacyMode === 'true'
    });
  }

})();