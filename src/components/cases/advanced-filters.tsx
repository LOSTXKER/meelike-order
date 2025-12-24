"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Filter, X, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CasesFiltersProps {
  onFilterChange: (filters: any) => void;
}

export function CasesFilters({ onFilterChange }: CasesFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    severity: "all",
    caseType: "all",
    provider: "all",
    owner: "all",
    dateFrom: undefined as Date | undefined,
    dateTo: undefined as Date | undefined,
  });

  const updateFilter = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      status: "all",
      severity: "all",
      caseType: "all",
      provider: "all",
      owner: "all",
      dateFrom: undefined,
      dateTo: undefined,
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.severity !== "all" ||
    filters.caseType !== "all" ||
    filters.provider !== "all" ||
    filters.owner !== "all" ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-4">
      {/* Quick Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <Input
            placeholder="ค้นหาเคส, ลูกค้า..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </div>

        {/* Status */}
        <Select value={filters.status} onValueChange={(v) => updateFilter("status", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="NEW">ใหม่</SelectItem>
            <SelectItem value="INVESTIGATING">กำลังตรวจสอบ</SelectItem>
            <SelectItem value="WAITING_CUSTOMER">รอลูกค้า</SelectItem>
            <SelectItem value="WAITING_PROVIDER">รอ Provider</SelectItem>
            <SelectItem value="FIXING">กำลังแก้ไข</SelectItem>
            <SelectItem value="RESOLVED">แก้ไขแล้ว</SelectItem>
            <SelectItem value="CLOSED">ปิดเคส</SelectItem>
          </SelectContent>
        </Select>

        {/* Severity */}
        <Select value={filters.severity} onValueChange={(v) => updateFilter("severity", v)}>
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

        {/* Advanced Filters Toggle */}
        <Button
          variant={showFilters ? "default" : "outline"}
          size="default"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          ตัวกรองเพิ่มเติม
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="default"
            onClick={clearFilters}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Case Type */}
            <div className="space-y-2">
              <Label>ประเภทเคส</Label>
              <Select value={filters.caseType} onValueChange={(v) => updateFilter("caseType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="topup">เติมเงินไม่เข้า</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                  <SelectItem value="mismatch">ยอดไม่ตรง</SelectItem>
                  <SelectItem value="sms">SMS/OTP</SelectItem>
                  <SelectItem value="order">ออเดอร์มีปัญหา</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider */}
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={filters.provider} onValueChange={(v) => updateFilter("provider", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุก Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุก Provider</SelectItem>
                  <SelectItem value="truemoney">TrueMoney</SelectItem>
                  <SelectItem value="promptpay">PromptPay</SelectItem>
                  <SelectItem value="kbank">KBank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <Label>ผู้รับผิดชอบ</Label>
              <Select value={filters.owner} onValueChange={(v) => updateFilter("owner", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกคน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคน</SelectItem>
                  <SelectItem value="unassigned">ยังไม่มอบหมาย</SelectItem>
                  <SelectItem value="me">เคสของฉัน</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <Label>วันที่เริ่มต้น</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "dd MMM yyyy", { locale: th })
                    ) : (
                      "เลือกวันที่"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => updateFilter("dateFrom", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>วันที่สิ้นสุด</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateTo ? (
                      format(filters.dateTo, "dd MMM yyyy", { locale: th })
                    ) : (
                      "เลือกวันที่"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => updateFilter("dateTo", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

