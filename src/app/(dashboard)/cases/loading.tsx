"use client";

import { Skeleton } from "@/components/ui/skeleton";

export default function CasesLoading() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          {[...Array(8)].map((_, i) => (
            <div key={i} className="border-b p-4 last:border-0">
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-5" />
                <Skeleton className="h-4 w-20" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

