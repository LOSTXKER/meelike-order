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
  Tag
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
  { value: "all", label: "ทั้งหมด", icon: Clipboard },
  { value: "NEW", label: "ใหม่", icon: PlusCircle },
  { value: "INVESTIGATING", label: "ตรวจสอบ", icon: SearchIcon },
  { value: "WAITING_CUSTOMER", label: "รอลูกค้า", icon: Clock },
  { value: "WAITING_PROVIDER", label: "รอ Provider", icon: Building2 },
  { value: "FIXING", label: "แก้ไข", icon: Wrench },
  { value: "RESOLVED", label: "แก้ไขแล้ว", icon: CheckCircle },
  { value: "CLOSED", label: "ปิดเคส", icon: Lock },
];

// Severity options with icons
const severityOptions = [
  { value: "all", label: "ทุกระดับ", icon: BarChart3 },
  { value: "CRITICAL", label: "วิกฤต", icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
  { value: "HIGH", label: "สูง", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
  { value: "NORMAL", label: "ปกติ", icon: Info, color: "text-yellow-600 dark:text-yellow-400" },
  { value: "LOW", label: "ต่ำ", icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
];

// Category options with icons (match schema enum)
const categoryOptions = [
  { value: "all", label: "ทุกหมวด", icon: Tag },
  { value: "PAYMENT", label: "การชำระเงิน", icon: DollarSign },
  { value: "ORDER", label: "ออเดอร์", icon: Package },
  { value: "SYSTEM", label: "ระบบ", icon: Settings },
  { value: "PROVIDER", label: "Provider", icon: Building2 },
  { value: "OTHER", label: "อื่นๆ", icon: FileText },
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

// Case counts by category
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
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [caseCounts, setCaseCounts] = useState<CaseCounts>({
    all: 0, PAYMENT: 0, ORDER: 0, SYSTEM: 0, PROVIDER: 0, OTHER: 0
  });
  const [showAllStatuses, setShowAllStatuses] = useState(false);

  useEffect(() => {
    // Fetch case types
    fetch("/api/case-types")
      .then((res) => res.json())
      .then((data) => setCaseTypes(data))
      .catch((err) => console.error("Failed to load case types:", err));

    // Fetch case counts by category
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
      // เมื่อเปลี่ยนหมวดหมู่ ให้ล้าง caseType ด้วย
      const newParams: Record<string, string | null> = { category: value, caseType: null };
      router.push(`/cases?${createQueryString(newParams)}`);
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

  // Filter case types by selected category
  const filteredCaseTypes = category && category !== "all"
    ? caseTypes.filter(type => type.category === category)
    : caseTypes;

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

      {/* Row 2: Category Tabs (แสดงเป็นแถบ) */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
        {categoryOptions.map((cat) => {
          const IconComponent = cat.icon;
          const isActive = (category || "all") === cat.value;
          // ใช้ caseCounts แทน caseTypes.length
          const count = cat.value === "all" 
            ? caseCounts.all 
            : caseCounts[cat.value as keyof CaseCounts] || 0;
          
          return (
            <Button
              key={cat.value}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              className={cn(
                "gap-1.5 transition-all",
                isActive && "shadow-md"
              )}
              onClick={() => handleCategoryChange(cat.value)}
              disabled={isPending}
            >
              <IconComponent className="h-4 w-4" />
              <span>{cat.label}</span>
              <Badge 
                variant={isActive ? "secondary" : "outline"} 
                className={cn(
                  "ml-1 h-5 px-1.5 text-xs",
                  isActive && "bg-background/20 text-primary-foreground border-primary-foreground/20"
                )}
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Row 2: Status Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">สถานะ:</span>
        <div className="flex flex-wrap gap-1">
          {visibleStatuses.map((opt) => {
            const IconComponent = opt.icon;
            return (
              <Button
                key={opt.value}
                variant={(status || "all") === opt.value ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2.5 gap-1.5 transition-all text-xs",
                  (status || "all") === opt.value && "shadow-sm"
                )}
                onClick={() => handleStatusChange(opt.value)}
                disabled={isPending}
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{opt.label}</span>
              </Button>
            );
          })}
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

      {/* Row 3: Severity + Case Type (แสดงเฉพาะ Case Type ตาม Category ที่เลือก) */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Severity */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">ความรุนแรง:</span>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {severityOptions.map((opt) => {
              const IconComponent = opt.icon;
              return (
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
                  <IconComponent className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Case Type - แสดงเฉพาะประเภทที่ตรงกับ Category */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">ประเภท:</span>
          <Select
            value={caseType || "all"}
            onValueChange={handleCaseTypeChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-[180px] text-xs">
              <SelectValue placeholder="ทุกประเภท" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span className="flex items-center gap-1.5">
                  <Clipboard className="h-3.5 w-3.5" />
                  <span>ทุกประเภท</span>
                </span>
              </SelectItem>
              {filteredCaseTypes.map((type) => (
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

// Category labels for display (match schema enum)
const categoryLabels: Record<string, string> = {
  PAYMENT: "การชำระเงิน",
  ORDER: "ออเดอร์",
  SYSTEM: "ระบบ",
  PROVIDER: "Provider",
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

  // Get icon for filters
  const getStatusIcon = (s: string) => statusOptions.find(o => o.value === s)?.icon;
  const getSeverityIcon = (s: string) => severityOptions.find(o => o.value === s)?.icon;
  const getCategoryIcon = (s: string) => categoryOptions.find(o => o.value === s)?.icon;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-3 bg-muted/50 rounded-lg">
      <Tag className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">ตัวกรอง:</span>
      
      {status && (() => {
        const StatusIcon = getStatusIcon(status);
        return (
          <Badge variant="secondary" className="gap-1 pr-1 bg-background">
            {StatusIcon && <StatusIcon className="h-3 w-3" />}
            {statusLabels[status] || status}
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
        );
      })()}
      
      {severity && (() => {
        const SeverityIcon = getSeverityIcon(severity);
        return (
          <Badge variant="secondary" className="gap-1 pr-1 bg-background">
            {SeverityIcon && <SeverityIcon className="h-3 w-3" />}
            {severityLabels[severity] || severity}
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
        );
      })()}

      {category && (() => {
        const CategoryIcon = getCategoryIcon(category);
        return (
          <Badge variant="secondary" className="gap-1 pr-1 bg-background">
            {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
            {categoryLabels[category] || category}
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
        );
      })()}
      
      {caseType && (
        <Badge variant="secondary" className="gap-1 pr-1 bg-background">
          <Clipboard className="h-3 w-3" />
          {getCaseTypeName(caseType)}
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
          <Search className="h-3 w-3" />
          &quot;{search}&quot;
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

