"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchDashboard() {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("Failed to fetch dashboard");
  return res.json();
}

// Hook: Get dashboard data - INSTANT from cache
export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    // Data stays fresh forever - use refresh button to update
  });
}

