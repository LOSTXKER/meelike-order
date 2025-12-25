"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  X, 
  ChevronDown, 
  Clipboard,
  PlusCircle,
  Search as SearchIcon,
  Clock,
  Building2,
  Wrench,
  CheckCircle,
  Lock,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  BarChart3,
  DollarSign,
  Package,
  Settings,
  FileText,
  Tag,
  LayoutGrid,
} from "lucide-react";
import { useCallback, useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";

// Status options with icons
const statusOptions = [
  { value: "all", label: "ทั้งหมด", icon: LayoutGrid },
  { value: "NEW", label: "ใหม่", icon: PlusCircle, color: "text-blue-600", activeClass: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800" },
  { value: "INVESTIGATING", label: "ตรวจสอบ", icon: SearchIcon, color: "text-violet-600", activeClass: "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-800" },
  { value: "FIXING", label: "กำลังแก้ไข", icon: Wrench, color: "text-cyan-600", activeClass: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:ring-cyan-800" },
  { value: "WAITING_CUSTOMER", label: "รอลูกค้า", icon: Clock, color: "text-amber-600", activeClass: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-800" },
  { value: "WAITING_PROVIDER", label: "รอ Provider", icon: Building2, color: "text-orange-600", activeClass: "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:ring-orange-800" },
  { value: "RESOLVED", label: "แก้ไขแล้ว", icon: CheckCircle, color: "text-green-600", activeClass: "bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-300 dark:ring-green-800" },
  { value: "CLOSED", label: "ปิดเคส", icon: Lock, color: "text-gray-500", activeClass: "bg-gray-50 text-gray-700 ring-1 ring-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:ring-gray-700" },
];

// Severity options
const severityOptions = [
  { value: "all", label: "ความรุนแรง (ทั้งหมด)", icon: BarChart3 },
  { value: "CRITICAL", label: "วิกฤต", icon: AlertCircle, color: "text-red-600" },
  { value: "HIGH", label: "สูง", icon: AlertTriangle, color: "text-orange-600" },
  { value: "NORMAL", label: "ปกติ", icon: Info, color: "text-blue-600" },
  { value: "LOW", label: "ต่ำ", icon: CheckCircle2, color: "text-gray-500" },
];

// Category options
const categoryOptions = [
  { value: "all", label: "หมวดหมู่ (ทั้งหมด)", icon: Tag },
  { value: "PAYMENT", label: "การชำระเงิน", icon: DollarSign },
  { value: "ORDER", label: "ออเดอร์", icon: Package },
  { value: "SYSTEM", label: "ระบบ", icon: Settings },
  { value: "PROVIDER", label: "Provider", icon: Building2 },
  { value: "OTHER", label: "อื่นๆ", icon: FileText },
];

interface CaseCounts {
  all: number;
  PAYMENT: number;
  ORDER: number;
  SYSTEM: number;
  PROVIDER: number;
  OTHER: number;
}

export function CasesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [caseCounts, setCaseCounts] = useState<CaseCounts>({
    all: 0, PAYMENT: 0, ORDER: 0, SYSTEM: 0, PROVIDER: 0, OTHER: 0
  });

  // Search state managed locally for debouncing/enter key
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  useEffect(() => {
    fetch("/api/cases/counts")
      .then((res) => res.json())
      .then((data) => setCaseCounts(data))
      .catch((err) => console.error("Failed to load case counts:", err));
  }, []);

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === "all") {
          current.delete(key);
        } else {
          current.set(key, value);
        }
      });
      current.delete("page");
      return current.toString();
    },
    [searchParams]
  );

  const status = searchParams.get("status") || "all";
  const category = searchParams.get("category") || "all";
  const severity = searchParams.get("severity") || "all";

  const updateFilter = (key: string, value: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ [key]: value })}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const current = new URLSearchParams(searchParams.toString());
      if (searchValue) {
        current.set("search", searchValue);
      } else {
        current.delete("search");
      }
      current.delete("page");
      router.push(`/cases?${current.toString()}`);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push("/cases");
      setSearchValue("");
    });
  };

  const hasFilters = status !== "all" || category !== "all" || severity !== "all" || searchValue !== "";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. Status Tabs - Top Level Navigation */}
      <div className="border-b">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-1 pb-1 px-1">
            {statusOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = status === opt.value;
              return (
                <Button
                  key={opt.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => updateFilter("status", opt.value)}
                  className={cn(
                    "relative h-10 px-4 font-normal text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all rounded-t-lg rounded-b-none border-b-2 border-transparent",
                    isActive && "text-primary font-medium border-primary bg-background/50 hover:bg-background/80"
                  )}
                >
                  <Icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 2. Secondary Toolbar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full sm:w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเลขเคส, ลูกค้า, หรือหัวข้อ..."
            className="pl-9 h-9 bg-background/50"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </form>

        <div className="h-4 w-[1px] bg-border hidden sm:block mx-1" />

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Category Filter */}
          <Select value={category} onValueChange={(val) => updateFilter("category", val)}>
            <SelectTrigger className={cn(
              "h-9 w-[180px] bg-background/50 border-dashed shadow-sm",
              category !== "all" && "border-solid border-primary/50 bg-primary/5 text-primary"
            )}>
              <SelectValue placeholder="หมวดหมู่" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => {
                const Icon = opt.icon;
                const count = opt.value === "all" ? caseCounts.all : caseCounts[opt.value as keyof CaseCounts] || 0;
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span>{opt.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground">({count})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Severity Filter */}
          <Select value={severity} onValueChange={(val) => updateFilter("severity", val)}>
            <SelectTrigger className={cn(
              "h-9 w-[180px] bg-background/50 border-dashed shadow-sm",
              severity !== "all" && "border-solid border-primary/50 bg-primary/5 text-primary"
            )}>
              <SelectValue placeholder="ความรุนแรง" />
            </SelectTrigger>
            <SelectContent>
              {severityOptions.map((opt) => {
                const Icon = opt.icon;
                return (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", opt.color)} />
                      <span>{opt.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {hasFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto sm:ml-0"
            >
              <X className="h-4 w-4 mr-2" />
              ล้าง
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
