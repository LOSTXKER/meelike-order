"use client";

import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  variant?: "default" | "minimal" | "dots" | "pulse";
}

export function LoadingScreen({ 
  title = "กำลังโหลด", 
  subtitle,
  variant = "default" 
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        {/* Logo with pulse animation */}
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <span className="text-2xl font-bold text-primary-foreground">M</span>
          </div>
        </div>

        {/* Loading indicator based on variant */}
        {variant === "default" && <SpinnerLoader />}
        {variant === "dots" && <DotsLoader />}
        {variant === "pulse" && <PulseLoader />}
        {variant === "minimal" && <MinimalLoader />}

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-foreground animate-pulse">
            {title}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function SpinnerLoader() {
  return (
    <div className="relative h-12 w-12">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-4 border-muted" />
      {/* Spinning segment */}
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
      {/* Inner glow */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary/10 to-transparent animate-pulse" />
    </div>
  );
}

function DotsLoader() {
  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "h-3 w-3 rounded-full bg-primary",
            "animate-bounce"
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
    </div>
  );
}

function PulseLoader() {
  return (
    <div className="relative flex items-center justify-center">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute h-8 w-8 rounded-full border-2 border-primary animate-ping"
          style={{
            animationDelay: `${i * 0.4}s`,
            animationDuration: "1.5s",
          }}
        />
      ))}
      <div className="h-4 w-4 rounded-full bg-primary" />
    </div>
  );
}

function MinimalLoader() {
  return (
    <div className="h-1 w-48 rounded-full bg-muted overflow-hidden">
      <div 
        className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary via-primary to-primary/50 animate-shimmer"
        style={{
          animation: "shimmer 1.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// Page-specific loading with content skeleton
export function PageLoading({ title }: { title?: string }) {
  return (
    <div className="min-h-screen">
      {/* Animated Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse" />
          <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        </div>
      </div>

      {/* Center Loading */}
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-muted" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            {title || "กำลังโหลดข้อมูล..."}
          </p>
        </div>
      </div>
    </div>
  );
}

// Compact inline loader
export function InlineLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-4 w-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
      <span className="text-sm text-muted-foreground">กำลังโหลด...</span>
    </div>
  );
}


