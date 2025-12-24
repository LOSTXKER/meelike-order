"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // INSTANT NAVIGATION - data never goes stale automatically
            staleTime: Infinity,
            // Keep data forever in cache
            gcTime: Infinity,
            // Retry failed requests 2 times
            retry: 2,
            // Don't refetch automatically - only manual refresh
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
            // Keep old data while fetching new
            placeholderData: (previousData: unknown) => previousData,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

