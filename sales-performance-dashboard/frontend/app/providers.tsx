'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

// Create a client with optimized settings for sales analytics
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is often real-time, so shorter stale times
        staleTime: 1000 * 60 * 5, // 5 minutes
        // Cache for longer to reduce API calls
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        // Retry failed requests
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors except 429 (rate limit)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return error?.response?.status === 429 && failureCount < 3;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Retry with exponential backoff
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus for real-time data
        refetchOnWindowFocus: true,
        // Refetch when network reconnects
        refetchOnReconnect: true,
      },
      mutations: {
        retry: 1,
        // Show loading states for mutations
        onError: (error: any) => {
          console.error('Mutation error:', error);
          // You can add toast notifications here
        },
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // NOTE: Avoid useState when initializing the query client if you don't
  // have a suspense boundary between this and the code that may
  // suspend because React will throw away the client on the initial
  // render if it suspends and there is no boundary
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
        disableTransitionOnChange={false}
        storageKey="sales-dashboard-theme"
      >
        {children}
        
        {/* Development tools */}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom-right"
            buttonPosition="bottom-right"
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}