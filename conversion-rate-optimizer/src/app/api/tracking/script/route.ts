import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project')
  
  if (!projectId) {
    return new NextResponse('Project ID required', { status: 400 })
  }

  // Generate the tracking script
  const trackingScript = `
(function() {
  'use strict';
  
  // CRO Platform Tracking Script v1.0
  var CROTracker = {
    projectId: '${projectId}',
    apiUrl: '${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api',
    sessionId: null,
    anonymousId: null,
    consentGiven: false,
    
    // Initialize tracking
    init: function() {
      this.loadConsent();
      this.generateIds();
      this.setupEventListeners();
      this.trackPageView();
    },
    
    // Generate anonymous identifiers
    generateIds: function() {
      this.anonymousId = this.getCookie('cro_anonymous_id') || this.generateId();
      this.sessionId = this.getCookie('cro_session_id') || this.generateId();
      
      // Set cookies with appropriate expiry
      this.setCookie('cro_anonymous_id', this.anonymousId, 365);
      this.setCookie('cro_session_id', this.sessionId, 0); // Session cookie
    },
    
    // Generate random ID
    generateId: function() {
      return 'cro_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    },
    
    // Load consent preferences
    loadConsent: function() {
      var consent = localStorage.getItem('cro_consent');
      if (consent) {
        try {
          var consentData = JSON.parse(consent);
          this.consentGiven = consentData.analytics || false;
        } catch (e) {
          this.consentGiven = false;
        }
      }
    },
    
    // Set consent
    setConsent: function(consentTypes) {
      var consentData = {
        analytics: consentTypes.includes('analytics'),
        optimization: consentTypes.includes('optimization'),
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('cro_consent', JSON.stringify(consentData));
      this.consentGiven = consentData.analytics;
    },
    
    // Setup event listeners
    setupEventListeners: function() {
      var self = this;
      
      // Click tracking
      document.addEventListener('click', function(e) {
        self.trackClick(e);
      });
      
      // Form tracking
      document.addEventListener('submit', function(e) {
        self.trackFormSubmit(e);
      });
      
      // Scroll tracking
      var scrollTimeout;
      window.addEventListener('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
          self.trackScroll();
        }, 250);
      });
      
      // Visibility change
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'hidden') {
          self.trackPageExit();
        }
      });
    },
    
    // Track page view
    trackPageView: function() {
      this.track('page_view', {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track click events
    trackClick: function(event) {
      var element = event.target;
      var selector = this.getElementSelector(element);
      
      this.track('click', {
        selector: selector,
        text: element.textContent?.substring(0, 100),
        x: event.clientX,
        y: event.clientY,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track form submissions
    trackFormSubmit: function(event) {
      var form = event.target;
      var formData = new FormData(form);
      var fields = {};
      
      // Collect non-sensitive field names
      for (var pair of formData.entries()) {
        var fieldName = pair[0];
        if (!this.isSensitiveField(fieldName)) {
          fields[fieldName] = 'filled';
        }
      }
      
      this.track('form_submit', {
        formId: form.id,
        formAction: form.action,
        fields: fields,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track scroll depth
    trackScroll: function() {
      var scrollTop = window.pageYOffset;
      var docHeight = document.body.scrollHeight;
      var winHeight = window.innerHeight;
      var scrollPercent = Math.round((scrollTop / (docHeight - winHeight)) * 100);
      
      this.track('scroll', {
        scrollDepth: scrollPercent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    },
    
    // Track page exit
    trackPageExit: function() {
      var timeOnPage = Date.now() - this.startTime;
      
      this.track('page_exit', {
        timeOnPage: timeOnPage,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }, true); // Send immediately
    },
    
    // Track custom conversion
    trackConversion: function(goalType, value) {
      this.track('conversion', {
        goalType: goalType,
        value: value,
        url: window.location.href,
        timestamp: new Date().toISOString()
      });
    },
    
    // Main tracking function
    track: function(eventType, properties, immediate) {
      if (!this.consentGiven && eventType !== 'page_view') {
        return; // Skip tracking if no consent
      }
      
      var payload = {
        projectId: this.projectId,
        sessionId: this.sessionId,
        anonymousId: this.anonymousId,
        eventType: eventType,
        properties: properties,
        userAgent: navigator.userAgent,
        screen: {
          width: screen.width,
          height: screen.height
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      this.send(payload, immediate);
    },
    
    // Send data to server
    send: function(payload, immediate) {
      var url = this.apiUrl + '/tracking/events';
      
      if (immediate && navigator.sendBeacon) {
        // Use sendBeacon for immediate sending (page unload)
        navigator.sendBeacon(url, JSON.stringify(payload));
      } else {
        // Use fetch for regular tracking
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function(error) {
          console.warn('CRO tracking failed:', error);
        });
      }
    },
    
    // Get element selector
    getElementSelector: function(element) {
      if (element.id) {
        return '#' + element.id;
      }
      
      if (element.className) {
        var classes = element.className.split(' ').filter(function(c) {
          return c && !c.match(/^(hover|active|focus):/);
        });
        if (classes.length > 0) {
          return element.tagName.toLowerCase() + '.' + classes.slice(0, 2).join('.');
        }
      }
      
      return element.tagName.toLowerCase();
    },
    
    // Check if field contains sensitive data
    isSensitiveField: function(fieldName) {
      var sensitivePatterns = /password|credit|card|ssn|social|security|bank|account/i;
      return sensitivePatterns.test(fieldName);
    },
    
    // Cookie utilities
    setCookie: function(name, value, days) {
      var expires = '';
      if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
      }
      document.cookie = name + '=' + value + expires + '; path=/; samesite=strict';
    },
    
    getCookie: function(name) {
      var nameEQ = name + '=';
      var ca = document.cookie.split(';');
      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
      }
      return null;
    }
  };
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      CROTracker.init();
    });
  } else {
    CROTracker.init();
  }
  
  // Expose global functions
  window.CROTracker = {
    trackConversion: function(goalType, value) {
      CROTracker.trackConversion(goalType, value);
    },
    setConsent: function(consentTypes) {
      CROTracker.setConsent(consentTypes);
    }
  };
  
  // Record start time
  CROTracker.startTime = Date.now();
})();
`

  return new NextResponse(trackingScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=300', // 5 minutes cache
      'Access-Control-Allow-Origin': '*',
    },
  })
}