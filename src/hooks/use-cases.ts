"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Types
interface CaseFilters {
  status?: string;
  severity?: string;
  caseTypeId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  source: string;
  severity: string;
  status: string;
  customerName: string | null;
  customerId: string | null;
  customerContact: string | null;
  slaDeadline: Date | null;
  createdAt: Date;
  caseType: { name: string };
  owner: { name: string | null } | null;
  provider: { name: string | null } | null;
}

interface CasesResponse {
  cases: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Fetch cases with filters
async function fetchCases(filters: CaseFilters): Promise<CasesResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.severity) params.set("severity", filters.severity);
  if (filters.caseTypeId) params.set("caseTypeId", filters.caseTypeId);
  if (filters.search) params.set("search", filters.search);
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());

  const res = await fetch(`/api/cases?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch cases");
  return res.json();
}

// Fetch single case
async function fetchCase(id: string) {
  const res = await fetch(`/api/cases/${id}`);
  if (!res.ok) throw new Error("Failed to fetch case");
  return res.json();
}

// Hook: Get cases list with caching and auto-refresh
export function useCases(filters: CaseFilters = {}) {
  return useQuery({
    queryKey: ["cases", filters],
    queryFn: () => fetchCases(filters),
    staleTime: 30 * 1000, // 30 seconds - cases change frequently
    refetchInterval: 60 * 1000, // Auto refresh every 60 seconds
  });
}

// Hook: Get single case with caching
export function useCase(id: string) {
  return useQuery({
    queryKey: ["case", id],
    queryFn: () => fetchCase(id),
    staleTime: 30 * 1000,
    enabled: !!id,
  });
}

// Hook: Create case mutation
export function useCreateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create case");
      return res.json();
    },
    onSuccess: () => {
      // Invalidate cases list to refetch
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

// Hook: Update case mutation
export function useUpdateCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update case");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["case", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

