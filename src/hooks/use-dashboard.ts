"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchDashboard() {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

// Hook: Get dashboard data with auto-refresh
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Auto refresh every 2 minutes
    refetchIntervalInBackground: true, // Keep refreshing even when tab is not focused
  });
}

