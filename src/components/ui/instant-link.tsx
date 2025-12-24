"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, MouseEvent, startTransition } from "react";

interface InstantLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Link component with instant navigation
 * Prefetches on hover and navigates instantly
 */
export function InstantLink({ href, children, className }: InstantLinkProps) {
  const router = useRouter();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Only for left clicks without modifiers
    if (
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    ) {
      return;
    }

    e.preventDefault();
    
    // Use startTransition for smooth navigation
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={true}
    >
      {children}
    </Link>
  );
}

