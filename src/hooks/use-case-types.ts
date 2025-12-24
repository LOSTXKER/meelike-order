"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CaseType {
  id: string;
  name: string;
  category: string;
  defaultSeverity: string;
  defaultSlaMinutes: number;
  requireProvider: boolean;
  requireOrderId: boolean;
  lineNotification: boolean;
  description: string | null;
  isActive: boolean;
  _count?: {
    cases: number;
  };
}

async function fetchCaseTypes(): Promise<CaseType[]> {
  const res = await fetch("/api/case-types");
  if (!res.ok) throw new Error("Failed to fetch case types");
  return res.json();
}

// Hook: Get case types - INSTANT from cache
export function useCaseTypes() {
  return useQuery({
    queryKey: ["caseTypes"],
    queryFn: fetchCaseTypes,
  });
}

// Hook: Create case type mutation
export function useCreateCaseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CaseType>) => {
      const res = await fetch("/api/case-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create case type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseTypes"] });
    },
  });
}

// Hook: Update case type mutation  
export function useUpdateCaseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CaseType> }) => {
      const res = await fetch(`/api/case-types/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update case type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseTypes"] });
    },
  });
}

// Hook: Delete case type mutation
export function useDeleteCaseType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/case-types/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete case type");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caseTypes"] });
    },
  });
}

