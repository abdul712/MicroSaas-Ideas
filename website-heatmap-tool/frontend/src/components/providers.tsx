'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { Session } from 'next-auth';

// Custom context for real-time features
interface RealtimeContextType {
  socket: any | null;
  isConnected: boolean;
  subscribeToHeatmapUpdates: (siteId: string, callback: (data: any) => void) => void;
  unsubscribeFromHeatmapUpdates: (siteId: string) => void;
}

const RealtimeContext = React.createContext<RealtimeContextType>({
  socket: null,
  isConnected: false,
  subscribeToHeatmapUpdates: () => {},
  unsubscribeFromHeatmapUpdates: () => {},
});

// Custom hook for real-time features
export function useRealtime() {
  const context = React.useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

// Real-time provider for WebSocket connections
function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = React.useState<any>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const subscriptions = React.useRef<Map<string, (data: any) => void>>(new Map());

  React.useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    const initializeSocket = async () => {
      try {
        // Dynamically import socket.io-client to avoid SSR issues
        const { io } = await import('socket.io-client');
        
        const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
          withCredentials: true,
          transports: ['websocket', 'polling'],
          upgrade: true,
          rememberUpgrade: true,
        });

        socketInstance.on('connect', () => {
          console.log('🔌 Connected to real-time server');
          setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          console.log('🔌 Disconnected from real-time server');
          setIsConnected(false);
        });

        socketInstance.on('heatmap-update', (data) => {
          const callback = subscriptions.current.get(data.siteId);
          if (callback) {
            callback(data);
          }
        });

        setSocket(socketInstance);

        // Cleanup on unmount
        return () => {
          socketInstance.disconnect();
        };
      } catch (error) {
        console.error('Failed to initialize WebSocket connection:', error);
      }
    };

    initializeSocket();
  }, []);

  const subscribeToHeatmapUpdates = React.useCallback((siteId: string, callback: (data: any) => void) => {
    subscriptions.current.set(siteId, callback);
    if (socket && isConnected) {
      socket.emit('subscribe-heatmap', { siteId });
    }
  }, [socket, isConnected]);

  const unsubscribeFromHeatmapUpdates = React.useCallback((siteId: string) => {
    subscriptions.current.delete(siteId);
    if (socket && isConnected) {
      socket.emit('unsubscribe-heatmap', { siteId });
    }
  }, [socket, isConnected]);

  const value = React.useMemo(() => ({
    socket,
    isConnected,
    subscribeToHeatmapUpdates,
    unsubscribeFromHeatmapUpdates,
  }), [socket, isConnected, subscribeToHeatmapUpdates, unsubscribeFromHeatmapUpdates]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

// Analytics context for tracking user interactions
interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, traits?: Record<string, any>) => void;
  page: (name: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = React.createContext<AnalyticsContextType>({
  track: () => {},
  identify: () => {},
  page: () => {},
});

export function useAnalytics() {
  const context = React.useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }
  return context;
}

function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const track = React.useCallback((event: string, properties: Record<string, any> = {}) => {
    // Track events to multiple analytics providers
    try {
      // Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, {
          ...properties,
          custom_map: {
            custom_parameter: properties.customParameter || '',
          },
        });
      }

      // Mixpanel (if configured)
      if (typeof window !== 'undefined' && (window as any).mixpanel) {
        (window as any).mixpanel.track(event, properties);
      }

      // Internal analytics
      if (process.env.NEXT_PUBLIC_API_URL) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/analytics/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            properties,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          }),
        }).catch(console.error);
      }
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, []);

  const identify = React.useCallback((userId: string, traits: Record<string, any> = {}) => {
    try {
      // Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          user_id: userId,
          custom_map: traits,
        });
      }

      // Mixpanel
      if (typeof window !== 'undefined' && (window as any).mixpanel) {
        (window as any).mixpanel.identify(userId);
        (window as any).mixpanel.people.set(traits);
      }
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }, []);

  const page = React.useCallback((name: string, properties: Record<string, any> = {}) => {
    try {
      // Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
          page_title: name,
          page_location: window.location.href,
          ...properties,
        });
      }

      // Mixpanel
      if (typeof window !== 'undefined' && (window as any).mixpanel) {
        (window as any).mixpanel.track('Page View', {
          page: name,
          ...properties,
        });
      }
    } catch (error) {
      console.error('Analytics page tracking error:', error);
    }
  }, []);

  const value = React.useMemo(() => ({
    track,
    identify,
    page,
  }), [track, identify, page]);

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Create a stable query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 429 (rate limit)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

interface ProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function Providers({ children, session }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus>
        <ThemeProvider
          attribute=\"class\"
          defaultTheme=\"system\"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AnalyticsProvider>
            <RealtimeProvider>
              {children}
              
              {/* Toast notifications */}
              <Toaster
                position=\"top-right\"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                  },
                  success: {
                    iconTheme: {
                      primary: 'hsl(var(--primary))',
                      secondary: 'hsl(var(--primary-foreground))',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'hsl(var(--destructive))',
                      secondary: 'hsl(var(--destructive-foreground))',
                    },
                  },
                }}
              />
              
              {/* React Query Devtools (development only) */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools 
                  initialIsOpen={false}
                  position=\"bottom-right\"
                />
              )}
            </RealtimeProvider>
          </AnalyticsProvider>
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}