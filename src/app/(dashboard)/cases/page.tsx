"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/ui/refresh-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Clock, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCases } from "@/hooks";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { th } from "date-fns/locale";
import { CasesFilters, ActiveFilterTags } from "./cases-filters";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransition } from "react";

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  INVESTIGATING: { label: "กำลังตรวจสอบ", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  FIXING: { label: "กำลังแก้ไข", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800" },
};

const severityLabels: Record<string, { label: string; dotColor: string }> = {
  CRITICAL: { label: "วิกฤต", dotColor: "bg-red-500" },
  HIGH: { label: "สูง", dotColor: "bg-orange-500" },
  NORMAL: { label: "ปกติ", dotColor: "bg-blue-500" },
  LOW: { label: "ต่ำ", dotColor: "bg-gray-500" },
};

function formatSlaRemaining(deadline: Date | string | null): { text: string; isUrgent: boolean; isMissed: boolean } {
  if (!deadline) return { text: "-", isUrgent: false, isMissed: false };
  
  const now = new Date();
  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const diffMins = differenceInMinutes(deadlineDate, now);
  
  if (diffMins < 0) {
    return { text: `เกิน ${Math.abs(diffMins)} นาที`, isUrgent: false, isMissed: true };
  }
  
  if (diffMins < 15) {
    return { text: `${diffMins} นาที`, isUrgent: true, isMissed: false };
  }
  
  if (diffMins < 60) {
    return { text: `${diffMins} นาที`, isUrgent: false, isMissed: false };
  }
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return { text: `${hours}:${mins.toString().padStart(2, "0")} ชม.`, isUrgent: false, isMissed: false };
}

interface CaseItem {
  id: string;
  caseNumber: string;
  title: string;
  customerName: string | null;
  severity: string;
  status: string;
  slaDeadline: Date | string | null;
  createdAt: Date | string;
  caseType: { name: string };
  owner: { name: string | null } | null;
  provider: { name: string | null } | null;
}

export default function CasesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  
  const status = searchParams.get("status") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const category = searchParams.get("category") || undefined;
  const caseTypeId = searchParams.get("caseType") || undefined;
  const search = searchParams.get("search") || undefined;
  const sort = searchParams.get("sort") || "createdAt-desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  const { data, isLoading } = useCases({ 
    caseTypeId,
    status: status !== "all" ? status : undefined,
    severity: severity !== "all" ? severity : undefined,
    category: category !== "all" ? category : undefined,
    search,
    sort,
    page,
    limit,
  });

  // Handle column sort
  const handleSort = (field: string) => {
    const [currentField, currentOrder] = sort.split("-");
    let newSort = `${field}-desc`; // Default to desc
    
    if (currentField === field) {
      // Toggle order if same field
      newSort = currentOrder === "desc" ? `${field}-asc` : `${field}-desc`;
    }
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("sort", newSort);
      params.delete("page"); // Reset to page 1
      router.push(`/cases?${params.toString()}`);
    });
  };

  // Get sort icon for column
  const getSortIcon = (field: string) => {
    const [currentField, currentOrder] = sort.split("-");
    
    if (currentField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    }
    
    return currentOrder === "asc" 
      ? <ArrowUp className="h-3.5 w-3.5" />
      : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const isSortActive = (field: string) => {
    const [currentField] = sort.split("-");
    return currentField === field;
  };

  if (isLoading || !data) {
    return <LoadingScreen variant="pulse" />;
  }

  const cases = data.cases || [];
  const total = data.pagination?.total || 0;
  const totalPages = data.pagination?.totalPages || 1;

  return (
    <div className="min-h-screen">
      <Header title="เคสทั้งหมด" />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CasesFilters />
          <div className="flex items-center gap-2">
            <RefreshButton invalidateKeys={["cases"]} />
            <Link href="/cases/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                สร้างเคสใหม่
              </Button>
            </Link>
          </div>
        </div>

        {/* Active Filter Tags */}
        <ActiveFilterTags />

        {/* Cases Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[140px]">เลขเคส</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="w-[120px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 -ml-2 gap-1.5 hover:bg-muted/50",
                      isSortActive("severity") && "text-primary font-semibold"
                    )}
                    onClick={() => handleSort("severity")}
                    disabled={isPending}
                  >
                    ความรุนแรง
                    {getSortIcon("severity")}
                  </Button>
                </TableHead>
                <TableHead className="w-[140px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 -ml-2 gap-1.5 hover:bg-muted/50",
                      isSortActive("status") && "text-primary font-semibold"
                    )}
                    onClick={() => handleSort("status")}
                    disabled={isPending}
                  >
                    สถานะ
                    {getSortIcon("status")}
                  </Button>
                </TableHead>
                <TableHead className="w-[120px]">ผู้รับผิดชอบ</TableHead>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 -ml-2 gap-1.5 hover:bg-muted/50",
                      isSortActive("slaDeadline") && "text-primary font-semibold"
                    )}
                    onClick={() => handleSort("slaDeadline")}
                    disabled={isPending}
                  >
                    SLA
                    {getSortIcon("slaDeadline")}
                  </Button>
                </TableHead>
                <TableHead className="w-[140px] text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 px-2 -mr-2 gap-1.5 hover:bg-muted/50",
                      isSortActive("createdAt") && "text-primary font-semibold"
                    )}
                    onClick={() => handleSort("createdAt")}
                    disabled={isPending}
                  >
                    สร้างเมื่อ
                    {getSortIcon("createdAt")}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    ไม่พบเคส
                  </TableCell>
                </TableRow>
              ) : (
                cases.map((caseItem: CaseItem) => {
                  const sla = formatSlaRemaining(caseItem.slaDeadline);
                  return (
                    <TableRow key={caseItem.id} className="cursor-pointer">
                      <TableCell className="font-mono text-sm">
                        <Link href={`/cases/${caseItem.id}`} className="hover:underline">
                          {caseItem.caseNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/cases/${caseItem.id}`} className="block space-y-1">
                          <p className="font-medium hover:underline">{caseItem.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{caseItem.customerName || "ไม่ระบุลูกค้า"}</span>
                            {caseItem.provider && (
                              <>
                                <span>•</span>
                                <span>{caseItem.provider.name}</span>
                              </>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", severityLabels[caseItem.severity]?.dotColor)} />
                          <span className="text-sm">{severityLabels[caseItem.severity]?.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs font-medium", statusLabels[caseItem.status]?.className)}
                        >
                          {statusLabels[caseItem.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {caseItem.owner ? (
                          <span className="text-sm">{caseItem.owner.name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">ยังไม่มี</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sla.text !== "-" && (
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            sla.isMissed && "text-red-600 dark:text-red-400",
                            sla.isUrgent && !sla.isMissed && "text-amber-600 dark:text-amber-400"
                          )}>
                            <Clock className="h-3.5 w-3.5" />
                            <span>{sla.text}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true, locale: th })}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              แสดง {(page - 1) * limit + 1}-{Math.min(page * limit, total)} จาก {total} เคส
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                asChild={page > 1}
              >
                {page > 1 ? (
                  <Link href={`/cases?page=${page - 1}${status ? `&status=${status}` : ""}${severity ? `&severity=${severity}` : ""}${caseTypeId ? `&caseType=${caseTypeId}` : ""}${search ? `&search=${search}` : ""}`}>
                    ก่อนหน้า
                  </Link>
                ) : (
                  "ก่อนหน้า"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                asChild={page < totalPages}
              >
                {page < totalPages ? (
                  <Link href={`/cases?page=${page + 1}${status ? `&status=${status}` : ""}${severity ? `&severity=${severity}` : ""}${caseTypeId ? `&caseType=${caseTypeId}` : ""}${search ? `&search=${search}` : ""}`}>
                    ถัดไป
                  </Link>
                ) : (
                  "ถัดไป"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
