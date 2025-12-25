"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

interface RefreshButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  invalidateKeys?: (string | string[])[]; // Support both string and array keys
}

export function RefreshButton({ 
  className, 
  size = "sm", 
  variant = "outline",
  invalidateKeys = []
}: RefreshButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Invalidate React Query cache
    if (invalidateKeys.length > 0) {
      for (const key of invalidateKeys) {
        // Support both string keys and array keys
        const queryKey = Array.isArray(key) ? key : [key];
        await queryClient.invalidateQueries({ queryKey });
      }
    } else {
      // Invalidate all queries
      await queryClient.invalidateQueries();
    }

    // Refresh the route
    startTransition(() => {
      router.refresh();
    });

    // Reset loading state after a delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const isLoading = isPending || isRefreshing;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRefresh}
      disabled={isLoading}
      className={className}
    >
      <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
      {isLoading ? "กำลังโหลด..." : "รีเฟรช"}
    </Button>
  );
}
