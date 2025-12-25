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
  Filter,
  LayoutGrid,
  ListFilter
} from "lucide-react";
import { useCallback, useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CaseType {
  id: string;
  name: string;
  category: string;
}

// Status options with icons
const statusOptions = [
  { value: "all", label: "ทั้งหมด", icon: LayoutGrid },
  { value: "NEW", label: "ใหม่", icon: PlusCircle, color: "text-blue-600" },
  { value: "INVESTIGATING", label: "กำลังตรวจสอบ", icon: SearchIcon, color: "text-violet-600" },
  { value: "FIXING", label: "กำลังแก้ไข", icon: Wrench, color: "text-cyan-600" },
  { value: "WAITING_CUSTOMER", label: "รอลูกค้า", icon: Clock, color: "text-amber-600" },
  { value: "WAITING_PROVIDER", label: "รอ Provider", icon: Building2, color: "text-orange-600" },
  { value: "RESOLVED", label: "แก้ไขแล้ว", icon: CheckCircle, color: "text-green-600" },
  { value: "CLOSED", label: "ปิดเคส", icon: Lock, color: "text-gray-500" },
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

export function CasesFilterSidebar() {
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

  return (
    <div className="space-y-6">
      {/* Category Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-2 flex items-center gap-2">
          <ListFilter className="h-4 w-4" />
          หมวดหมู่
        </h3>
        <div className="space-y-1">
          {categoryOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = category === opt.value;
            const count = opt.value === "all" ? caseCounts.all : caseCounts[opt.value as keyof CaseCounts] || 0;
            
            return (
              <Button
                key={opt.value}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-between font-normal h-9",
                  isActive && "font-medium"
                )}
                onClick={() => updateFilter("category", opt.value)}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{opt.label}</span>
                </div>
                {count > 0 && (
                  <Badge variant={isActive ? "default" : "secondary"} className="h-5 px-1.5 text-[10px] min-w-[20px]">
                    {count}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Status Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-2">สถานะ</h3>
        <div className="space-y-1">
          {statusOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = status === opt.value;
            
            return (
              <Button
                key={opt.value}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start font-normal h-9",
                  isActive && "font-medium"
                )}
                onClick={() => updateFilter("status", opt.value)}
              >
                <Icon className={cn("h-4 w-4 mr-2", opt.color)} />
                {opt.label}
              </Button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Severity Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground px-2">ความรุนแรง</h3>
        <div className="space-y-1">
          {severityOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = severity === opt.value;
            
            return (
              <Button
                key={opt.value}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start font-normal h-9",
                  isActive && "font-medium"
                )}
                onClick={() => updateFilter("severity", opt.value)}
              >
                <Icon className={cn("h-4 w-4 mr-2", opt.color)} />
                {opt.label}
              </Button>
            );
          })}
        </div>
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
        className="pl-9 h-10"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </form>
  );
}

// Helper for displaying active filters in main area if needed (mostly for mobile/tablet)
// or just showing what's applied. 
export function ActiveFiltersDisplay() {
   // ... can keep similar logic as before but cleaner
   // For now, let's skip unless requested, as sidebar shows state clearly.
   return null; 
}
