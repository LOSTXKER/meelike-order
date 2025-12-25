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
  { value: "NEW", label: "ใหม่", icon: PlusCircle, color: "text-blue-600", activeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { value: "INVESTIGATING", label: "กำลังตรวจสอบ", icon: SearchIcon, color: "text-violet-600", activeClass: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
  { value: "FIXING", label: "กำลังแก้ไข", icon: Wrench, color: "text-cyan-600", activeClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { value: "WAITING_CUSTOMER", label: "รอลูกค้า", icon: Clock, color: "text-amber-600", activeClass: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { value: "WAITING_PROVIDER", label: "รอ Provider", icon: Building2, color: "text-orange-600", activeClass: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" },
  { value: "RESOLVED", label: "แก้ไขแล้ว", icon: CheckCircle, color: "text-green-600", activeClass: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { value: "CLOSED", label: "ปิดเคส", icon: Lock, color: "text-gray-500", activeClass: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
];

// Severity options
const severityOptions = [
  { value: "all", label: "ทุกระดับ", icon: BarChart3 },
  { value: "CRITICAL", label: "วิกฤต", icon: AlertCircle, color: "text-red-600" },
  { value: "HIGH", label: "สูง", icon: AlertTriangle, color: "text-orange-600" },
  { value: "NORMAL", label: "ปกติ", icon: Info, color: "text-blue-600" },
  { value: "LOW", label: "ต่ำ", icon: CheckCircle2, color: "text-gray-500" },
];

// Category options
const categoryOptions = [
  { value: "all", label: "ทุกหมวดหมู่", icon: Tag },
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

  const clearFilters = () => {
    startTransition(() => {
      router.push("/cases");
    });
  };

  const hasFilters = status !== "all" || category !== "all" || severity !== "all";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Status Tabs - Scrollable */}
      <div className="pb-1">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-2 pb-2">
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
                    "rounded-full px-4 h-9 border border-transparent transition-all",
                    isActive 
                      ? cn("font-medium border-transparent shadow-sm", opt.activeClass) 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("mr-2 h-4 w-4", isActive ? "opacity-100" : "opacity-70", isActive && opt.color)} />
                  {opt.label}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator className="opacity-50" />

      {/* Secondary Filters Row */}
      <div className="flex flex-wrap items-center gap-3 pt-1">
        
        {/* Category Filter */}
        <Select value={category} onValueChange={(val) => updateFilter("category", val)}>
          <SelectTrigger className="h-9 w-[160px] bg-background border-dashed shadow-sm">
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
          <SelectTrigger className="h-9 w-[160px] bg-background border-dashed shadow-sm">
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

        {/* Clear Filters */}
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-9 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-auto sm:ml-0"
          >
            <X className="h-4 w-4 mr-2" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </div>
  );
}

export function CaseSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("search") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      const current = new URLSearchParams(searchParams.toString());
      if (value) {
        current.set("search", value);
      } else {
        current.delete("search");
      }
      current.delete("page");
      router.push(`/cases?${current.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full sm:w-[300px]">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="ค้นหาเลขเคส, ลูกค้า, หรือหัวข้อ..."
        className="pl-9 h-9 bg-background shadow-sm"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}
