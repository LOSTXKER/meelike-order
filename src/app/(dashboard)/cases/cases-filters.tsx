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
import { Search, Filter, X } from "lucide-react";
import { useCallback, useState, useTransition, useEffect } from "react";

interface CaseType {
  id: string;
  name: string;
}

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

  const clearFilter = (filterKey: string) => {
    startTransition(() => {
      router.push(`/cases?${createQueryString({ [filterKey]: null })}`);
    });
    if (filterKey === "search") {
      setSearchValue("");
    }
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
  const caseType = searchParams.get("caseType");
  const search = searchParams.get("search");
  const hasActiveFilters = status || severity || caseType || search;

  // Get case type name from id
  const getCaseTypeName = (id: string) => {
    const found = caseTypes.find((t) => t.id === id);
    return found?.name || id;
  };

  return (
    <div className="flex flex-1 items-center gap-3">
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
      <Select
        defaultValue={searchParams.get("status") || "all"}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[160px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="สถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทั้งหมด</SelectItem>
          <SelectItem value="NEW">ใหม่</SelectItem>
          <SelectItem value="INVESTIGATING">กำลังตรวจสอบ</SelectItem>
          <SelectItem value="WAITING_CUSTOMER">รอลูกค้า</SelectItem>
          <SelectItem value="WAITING_PROVIDER">รอ Provider</SelectItem>
          <SelectItem value="FIXING">กำลังแก้ไข</SelectItem>
          <SelectItem value="RESOLVED">แก้ไขแล้ว</SelectItem>
          <SelectItem value="CLOSED">ปิดเคส</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("severity") || "all"}
        onValueChange={handleSeverityChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="ความรุนแรง" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกระดับ</SelectItem>
          <SelectItem value="CRITICAL">วิกฤต</SelectItem>
          <SelectItem value="HIGH">สูง</SelectItem>
          <SelectItem value="NORMAL">ปกติ</SelectItem>
          <SelectItem value="LOW">ต่ำ</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("caseType") || "all"}
        onValueChange={handleCaseTypeChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="ประเภทเคส" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">ทุกประเภท</SelectItem>
          {caseTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

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
  const caseType = searchParams.get("caseType");
  const search = searchParams.get("search");
  const hasActiveFilters = status || severity || caseType || search;

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">ตัวกรองที่ใช้:</span>
      
      {status && (
        <Badge variant="secondary" className="gap-1 pr-1">
          สถานะ: {statusLabels[status] || status}
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
        <Badge variant="secondary" className="gap-1 pr-1">
          ความรุนแรง: {severityLabels[severity] || severity}
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
      
      {caseType && (
        <Badge variant="secondary" className="gap-1 pr-1">
          ประเภท: {getCaseTypeName(caseType)}
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
        <Badge variant="secondary" className="gap-1 pr-1">
          ค้นหา: &quot;{search}&quot;
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
        className="text-destructive hover:text-destructive"
      >
        ล้างทั้งหมด
      </Button>
    </div>
  );
}

