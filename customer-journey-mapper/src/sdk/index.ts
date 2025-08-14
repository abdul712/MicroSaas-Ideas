/**
 * Customer Journey Mapper SDK
 * Entry point for the tracking SDK
 */

export {
  JourneyTracker,
  initJourneyTracker,
  getJourneyTracker,
  type JourneyEvent,
  type TrackingConfig,
  type TouchpointEvent,
} from './journey-tracker';

export {
  ServerSideTracker,
  type ServerEvent,
  type ServerConfig,
} from './server-tracker';

// Browser-specific initialization
if (typeof window !== 'undefined') {
  // Auto-initialize from script tag attributes
  const scriptTag = document.currentScript as HTMLScriptElement;
  if (scriptTag && scriptTag.hasAttribute('data-api-key')) {
    const config = {
      apiKey: scriptTag.getAttribute('data-api-key')!,
      apiUrl: scriptTag.getAttribute('data-api-url') || undefined,
      customerId: scriptTag.getAttribute('data-customer-id') || undefined,
      journeyId: scriptTag.getAttribute('data-journey-id') || undefined,
      autoTrack: {
        pageViews: scriptTag.getAttribute('data-auto-page-views') !== 'false',
        clicks: scriptTag.getAttribute('data-auto-clicks') !== 'false',
        formSubmissions: scriptTag.getAttribute('data-auto-forms') !== 'false',
        scrollDepth: scriptTag.getAttribute('data-auto-scroll') === 'true',
      },
    };

    import('./journey-tracker').then(({ initJourneyTracker }) => {
      initJourneyTracker(config);
    });
  }
}