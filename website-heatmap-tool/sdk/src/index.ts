import { HeatmapTracker } from './tracker'
import { 
  HeatmapConfig, 
  HeatmapEvent, 
  ClickEvent, 
  ScrollEvent, 
  HoverEvent,
  FormEvent,
  PageViewEvent 
} from './types'

// Export types
export type {
  HeatmapConfig,
  HeatmapEvent,
  ClickEvent,
  ScrollEvent,
  HoverEvent,
  FormEvent,
  PageViewEvent,
}

// Export main tracker class
export { HeatmapTracker }

// Global instance for browser usage
let globalTracker: HeatmapTracker | null = null

/**
 * Initialize the global heatmap tracker
 * @param config Configuration options
 * @returns HeatmapTracker instance
 */
export function init(config: HeatmapConfig): HeatmapTracker {
  if (globalTracker) {
    console.warn('HeatmapTracker already initialized')
    return globalTracker
  }

  globalTracker = new HeatmapTracker(config)
  return globalTracker
}

/**
 * Get the global tracker instance
 * @returns HeatmapTracker instance or null if not initialized
 */
export function getTracker(): HeatmapTracker | null {
  return globalTracker
}

/**
 * Track a custom event
 * @param event Event data
 */
export function track(event: Partial<HeatmapEvent>): void {
  if (!globalTracker) {
    console.warn('HeatmapTracker not initialized. Call init() first.')
    return
  }
  globalTracker.track(event)
}

/**
 * Start tracking user interactions
 */
export function start(): void {
  if (!globalTracker) {
    console.warn('HeatmapTracker not initialized. Call init() first.')
    return
  }
  globalTracker.start()
}

/**
 * Stop tracking user interactions
 */
export function stop(): void {
  if (!globalTracker) {
    console.warn('HeatmapTracker not initialized. Call init() first.')
    return
  }
  globalTracker.stop()
}

/**
 * Update tracker configuration
 * @param config Partial configuration to update
 */
export function updateConfig(config: Partial<HeatmapConfig>): void {
  if (!globalTracker) {
    console.warn('HeatmapTracker not initialized. Call init() first.')
    return
  }
  globalTracker.updateConfig(config)
}

/**
 * Get current session information
 */
export function getSession(): { sessionId: string; userId?: string } | null {
  if (!globalTracker) {
    return null
  }
  return globalTracker.getSession()
}

/**
 * Set user identifier
 * @param userId User identifier
 * @param userProperties Additional user properties
 */
export function identify(userId: string, userProperties?: Record<string, any>): void {
  if (!globalTracker) {
    console.warn('HeatmapTracker not initialized. Call init() first.')
    return
  }
  globalTracker.identify(userId, userProperties)
}

/**
 * Clear user data and start new session
 */
export function reset(): void {
  if (!globalTracker) {
    console.warn('HeatmapTracker not initialized. Call init() first.')
    return
  }
  globalTracker.reset()
}

// Auto-initialization from script tag data attributes
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Look for the script tag with data attributes
  const scripts = document.getElementsByTagName('script')
  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i]
    if (script.src && script.src.includes('heatmap-sdk')) {
      const trackingId = script.getAttribute('data-tracking-id')
      const apiUrl = script.getAttribute('data-api-url')
      
      if (trackingId) {
        const autoConfig: HeatmapConfig = {
          trackingId,
          apiUrl: apiUrl || 'https://api.heatmaptool.com',
          enableClickTracking: script.getAttribute('data-click-tracking') !== 'false',
          enableScrollTracking: script.getAttribute('data-scroll-tracking') !== 'false',
          enableHoverTracking: script.getAttribute('data-hover-tracking') !== 'false',
          enableFormTracking: script.getAttribute('data-form-tracking') !== 'false',
          respectDoNotTrack: script.getAttribute('data-respect-dnt') !== 'false',
          debug: script.getAttribute('data-debug') === 'true',
        }

        // Auto-initialize when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            init(autoConfig).start()
          })
        } else {
          init(autoConfig).start()
        }
      }
      break
    }
  }
}

// UMD export for browser usage
if (typeof window !== 'undefined') {
  (window as any).HeatmapSDK = {
    init,
    getTracker,
    track,
    start,
    stop,
    updateConfig,
    getSession,
    identify,
    reset,
    HeatmapTracker,
  }
}

// Default export
export default {
  init,
  getTracker,
  track,
  start,
  stop,
  updateConfig,
  getSession,
  identify,
  reset,
  HeatmapTracker,
}