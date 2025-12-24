"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Aggressive caching - keep data fresh longer
            staleTime: 10 * 60 * 1000, // 10 minutes (increased from 5)
            // Keep unused data in cache for 30 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes (increased from 10)
            // Retry failed requests 2 times
            retry: 2,
            // Refetch on window focus
            refetchOnWindowFocus: true,
            // Don't refetch on reconnect by default
            refetchOnReconnect: false,
            // Prefetch behavior - keep old data while fetching new
            placeholderData: (previousData: unknown) => previousData,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

