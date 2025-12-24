"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";

interface PrefetchLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  queryKey?: unknown[];
  queryFn?: () => Promise<unknown>;
}

// Smart Link component that prefetches data on hover
export function PrefetchLink({
  href,
  children,
  className,
  queryKey,
  queryFn,
}: PrefetchLinkProps) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    if (queryKey && queryFn) {
      // Prefetch the data when user hovers
      queryClient.prefetchQuery({
        queryKey,
        queryFn,
      });
    }
  };

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      prefetch={true} // Next.js will prefetch the page
    >
      {children}
    </Link>
  );
}


