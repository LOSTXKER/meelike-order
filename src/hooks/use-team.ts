"use client";

import { useQuery } from "@tanstack/react-query";

async function fetchTeam() {
  const res = await fetch("/api/team");
  if (!res.ok) throw new Error("Failed to fetch team");
  return res.json();
}

// Hook: Get team data - INSTANT from cache
export function useTeam() {
  return useQuery({
    queryKey: ["team"],
    queryFn: fetchTeam,
  });
}

