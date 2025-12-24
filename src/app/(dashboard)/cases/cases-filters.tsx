"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useCallback, useState, useTransition } from "react";

export function CasesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(`/cases?${createQueryString({ search: searchValue || null })}`);
    });
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
    </div>
  );
}

