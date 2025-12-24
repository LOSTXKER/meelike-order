"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

// Prefetch all common data when app loads
export function PrefetchData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Wait a bit for initial page to load, then prefetch other pages
    const timer = setTimeout(() => {
      // Prefetch dashboard data
      queryClient.prefetchQuery({
        queryKey: ["dashboard"],
        queryFn: async () => {
          const res = await fetch("/api/dashboard");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 60 * 1000,
      });

      // Prefetch cases
      queryClient.prefetchQuery({
        queryKey: ["cases", {}],
        queryFn: async () => {
          const res = await fetch("/api/cases");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 30 * 1000,
      });

      // Prefetch users
      queryClient.prefetchQuery({
        queryKey: ["users"],
        queryFn: async () => {
          const res = await fetch("/api/users");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 5 * 60 * 1000,
      });

      // Prefetch providers
      queryClient.prefetchQuery({
        queryKey: ["providers"],
        queryFn: async () => {
          const res = await fetch("/api/providers");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 2 * 60 * 1000,
      });

      // Prefetch team
      queryClient.prefetchQuery({
        queryKey: ["team"],
        queryFn: async () => {
          const res = await fetch("/api/team");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 2 * 60 * 1000,
      });

      // Prefetch reports
      queryClient.prefetchQuery({
        queryKey: ["reports"],
        queryFn: async () => {
          const res = await fetch("/api/reports");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 2 * 60 * 1000,
      });

      // Prefetch case types
      queryClient.prefetchQuery({
        queryKey: ["caseTypes"],
        queryFn: async () => {
          const res = await fetch("/api/case-types");
          if (!res.ok) throw new Error("Failed");
          return res.json();
        },
        staleTime: 10 * 60 * 1000,
      });
    }, 2000); // Wait 2 seconds after initial load

    return () => clearTimeout(timer);
  }, [queryClient]);

  return null;
}

