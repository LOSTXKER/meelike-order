"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, ChevronDown } from "lucide-react";
import { useCallback, useState, useTransition, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CaseType {
  id: string;
  name: string;
  category: string;
}

// Status options with emoji
const statusOptions = [
  { value: "all", label: "ทั้งหมด", emoji: "📋" },
  { value: "NEW", label: "ใหม่", emoji: "🆕" },
  { value: "INVESTIGATING", label: "ตรวจสอบ", emoji: "🔍" },
  { value: "WAITING_CUSTOMER", label: "รอลูกค้า", emoji: "⏳" },
  { value: "WAITING_PROVIDER", label: "รอ Provider", emoji: "🏢" },
  { value: "FIXING", label: "แก้ไข", emoji: "🔧" },
  { value: "RESOLVED", label: "แก้ไขแล้ว", emoji: "✅" },
  { value: "CLOSED", label: "ปิดเคส", emoji: "🔒" },
];

// Severity options with emoji
const severityOptions = [
  { value: "all", label: "ทุกระดับ", emoji: "📊" },
  { value: "CRITICAL", label: "วิกฤต", emoji: "🔴", color: "text-red-600 dark:text-red-400" },
  { value: "HIGH", label: "สูง", emoji: "🟠", color: "text-orange-600 dark:text-orange-400" },
  { value: "NORMAL", label: "ปกติ", emoji: "🟡", color: "text-yellow-600 dark:text-yellow-400" },
  { value: "LOW", label: "ต่ำ", emoji: "🟢", color: "text-green-600 dark:text-green-400" },
];

// Category options with emoji
const categoryOptions = [
  { value: "all", label: "ทุกหมวด", emoji: "📁" },
  { value: "PAYMENT", label: "การชำระเงิน", emoji: "💰" },
  { value: "ORDER", label: "ออเดอร์", emoji: "📦" },
  { value: "SYSTEM", label: "ระบบ", emoji: "⚙️" },
  { value: "PROVIDER", label: "Provider", emoji: "🏢" },
  { value: "TECHNICAL", label: "เทคนิค", emoji: "🔧" },
  { value: "OTHER", label: "อื่นๆ", emoji: "📝" },
];

// Labels for display
const statusLabels: Record<string, string> = {
  NEW: "ใหม่",
  INVESTIGATING: "กำลังตรวจสอบ",
  WAITING_CUSTOMER: "รอลูกค้า",
  WAITING_PROVIDER: "รอ Provider",
  FIXING: "กำลังแก้ไข",
  RESOLVED: "แก้ไขแล้ว",
  CLOSED: "ปิดเคส",
};

const severityLabels: Record<string, string> = {
  CRITICAL: "วิกฤต",
  HIGH: "สูง",
  NORMAL: "ปกติ",
  LOW: "ต่ำ",
};

export function CasesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [showAllStatuses, setShowAllStatuses] = useState(false);

  useEffect(() => {
    // Fetch case types
    fetch("/api/case-types")
      .then((res) => res.json())
      .then((data) => setCaseTypes(data))
      .catch((err) => console.error("Failed to load case types:", err));
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
      
      // Reset to page 1 when filters change
      current.delete("page");
      
      return current.toString();
    },
    [searchParams]
  );

  const handleStatusChange = (value: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ status: value })}`);
    });
  };

  const handleSeverityChange = (value: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ severity: value })}`);
    });
  };

  const handleCategoryChange = (value: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ category: value })}`);
    });
  };

  const handleCaseTypeChange = (value: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ caseType: value })}`);
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(`/cases?${createQueryString({ search: searchValue || null })}`);
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/cases");
    });
    setSearchValue("");
  };

  // Check if any filters are active
  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const category = searchParams.get("category");
  const caseType = searchParams.get("caseType");
  const search = searchParams.get("search");
  const hasActiveFilters = status || severity || category || caseType || search;

  // Show first 5 statuses by default, all when expanded
  const visibleStatuses = showAllStatuses ? statusOptions : statusOptions.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Row 1: Search + Clear All */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาเคส, ลูกค้า..."
            className="pl-9"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            disabled={isPending}
          />
        </form>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground gap-1"
          >
            <X className="h-4 w-4" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Row 2: Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">สถานะ:</span>
        <div className="flex flex-wrap gap-1">
          {visibleStatuses.map((opt) => (
            <Button
              key={opt.value}
              variant={(status || "all") === opt.value ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 px-2.5 gap-1 transition-all text-xs",
                (status || "all") === opt.value && "shadow-sm"
              )}
              onClick={() => handleStatusChange(opt.value)}
              disabled={isPending}
            >
              <span>{opt.emoji}</span>
              <span>{opt.label}</span>
            </Button>
          ))}
          {!showAllStatuses && statusOptions.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setShowAllStatuses(true)}
            >
              <ChevronDown className="h-3.5 w-3.5 mr-1" />
              +{statusOptions.length - 5}
            </Button>
          )}
          {showAllStatuses && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setShowAllStatuses(false)}
            >
              ย่อ
            </Button>
          )}
        </div>
      </div>

      {/* Row 3: Severity + Category + Case Type */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Severity */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">ความรุนแรง:</span>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {severityOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={(severity || "all") === opt.value ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-6 px-2 gap-1 text-xs",
                  opt.color && (severity || "all") === opt.value && opt.color
                )}
                onClick={() => handleSeverityChange(opt.value)}
                disabled={isPending}
              >
                <span>{opt.emoji}</span>
                <span className="hidden sm:inline">{opt.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">หมวดหมู่:</span>
          <Select
            value={category || "all"}
            onValueChange={handleCategoryChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue placeholder="ทุกหมวด" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-1.5">
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Case Type */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">ประเภท:</span>
          <Select
            value={caseType || "all"}
            onValueChange={handleCaseTypeChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-[160px] text-xs">
              <SelectValue placeholder="ทุกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📋 ทุกประเภท</SelectItem>
              {caseTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// Category labels for display
const categoryLabels: Record<string, string> = {
  PAYMENT: "การชำระเงิน",
  ORDER: "ออเดอร์",
  SYSTEM: "ระบบ",
  PROVIDER: "Provider",
  TECHNICAL: "เทคนิค",
  OTHER: "อื่นๆ",
};

// Active Filter Tags Component
export function ActiveFilterTags() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);

  useEffect(() => {
    fetch("/api/case-types")
      .then((res) => res.json())
      .then((data) => setCaseTypes(data))
      .catch(() => {});
  }, []);

  const status = searchParams.get("status");
  const severity = searchParams.get("severity");
  const category = searchParams.get("category");
  const caseType = searchParams.get("caseType");
  const search = searchParams.get("search");
  const hasActiveFilters = status || severity || category || caseType || search;

  const getCaseTypeName = (id: string) => {
    const found = caseTypes.find((t) => t.id === id);
    return found?.name || id;
  };

  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
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

  const clearFilter = (filterKey: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ [filterKey]: null })}`);
    });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/cases");
    });
  };

  if (!hasActiveFilters) return null;

  // Get emoji for filters
  const getStatusEmoji = (s: string) => statusOptions.find(o => o.value === s)?.emoji || "";
  const getSeverityEmoji = (s: string) => severityOptions.find(o => o.value === s)?.emoji || "";
  const getCategoryEmoji = (s: string) => categoryOptions.find(o => o.value === s)?.emoji || "";

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg">
      <span className="text-sm text-muted-foreground">🏷️ ตัวกรอง:</span>
      
      {status && (
        <Badge variant="secondary" className="gap-1 pr-1 bg-background">
          {getStatusEmoji(status)} {statusLabels[status] || status}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-destructive/20"
            onClick={() => clearFilter("status")}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {severity && (
        <Badge variant="secondary" className="gap-1 pr-1 bg-background">
          {getSeverityEmoji(severity)} {severityLabels[severity] || severity}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-destructive/20"
            onClick={() => clearFilter("severity")}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}

      {category && (
        <Badge variant="secondary" className="gap-1 pr-1 bg-background">
          {getCategoryEmoji(category)} {categoryLabels[category] || category}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-destructive/20"
            onClick={() => clearFilter("category")}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {caseType && (
        <Badge variant="secondary" className="gap-1 pr-1 bg-background">
          📋 {getCaseTypeName(caseType)}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-destructive/20"
            onClick={() => clearFilter("caseType")}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      {search && (
        <Badge variant="secondary" className="gap-1 pr-1 bg-background">
          🔍 &quot;{search}&quot;
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 ml-1 hover:bg-destructive/20"
            onClick={() => clearFilter("search")}
            disabled={isPending}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={clearAllFilters}
        disabled={isPending}
        className="text-destructive hover:text-destructive h-6 text-xs"
      >
        <X className="h-3 w-3 mr-1" />
        ล้างทั้งหมด
      </Button>
    </div>
  );
}

