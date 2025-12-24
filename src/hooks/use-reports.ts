"use client";

import { useQuery } from "@tanstack/react-query";

interface ReportsData {
  casesByStatus: Record<string, number>;
  casesBySeverity: Record<string, number>;
  casesByCategory: Array<{ name: string; category: string; count: number }>;
  monthlyTrend: Array<{ month: string; total: number; resolved: number }>;
  avgResolutionTime: number;
  slaCompliance: number;
  topProviders: Array<{
    name: string;
    totalCases: number;
    resolvedCases: number;
    refundRate: number | null;
  }>;
  teamPerformance: Array<{
    id: string;
    name: string | null;
    role: string;
    casesThisMonth: number;
  }>;
  growth: number;
}

async function fetchReports(): Promise<ReportsData> {
  const res = await fetch("/api/reports");
  if (!res.ok) throw new Error("Failed to fetch reports");
  return res.json();
}

// Hook: Get reports data - INSTANT from cache
export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: fetchReports,
  });
}

