"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchTeam() {
  const res = await fetch("/api/team");
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

// Hook: Get team data with caching and auto-refresh
export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 3 * 60 * 1000, // Auto refresh every 3 minutes
  });
}

