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
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, Clock, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, 
  ChevronRight, AlertCircle, AlertTriangle, CheckCircle2, Info,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCases } from "@/hooks";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { th } from "date-fns/locale";
import { CasesFilterSidebar, CaseSearchInput } from "./cases-filters";
import { useSearchParams, useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  INVESTIGATING: { label: "ตรวจสอบ", className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" },
  FIXING: { label: "กำลังแก้ไข", className: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
};

const severityLabels: Record<string, { label: string; icon: any; color: string }> = {
  CRITICAL: { label: "วิกฤต", icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
  HIGH: { label: "สูง", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
  NORMAL: { label: "ปกติ", icon: Info, color: "text-blue-600 dark:text-blue-400" },
  LOW: { label: "ต่ำ", icon: CheckCircle2, color: "text-gray-500" },
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

// Quick Status Change function
async function quickStatusChange(
  caseId: string, 
  newStatus: string, 
  queryClient: ReturnType<typeof useQueryClient>
) {
  try {
    const res = await fetch(`/api/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) throw new Error("Failed");

    toast.success("อัพเดทสถานะเรียบร้อย");
    queryClient.invalidateQueries({ queryKey: ["cases"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  } catch {
    toast.error("ไม่สามารถอัพเดทสถานะได้");
  }
}

export default function CasesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();
  
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
      <Header />
      
      <div className="p-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters (Desktop) */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6">
            <div className="sticky top-24">
              <div className="mb-4">
                <h2 className="text-lg font-semibold tracking-tight">เคสทั้งหมด</h2>
                <p className="text-sm text-muted-foreground">จัดการและติดตามสถานะเคส</p>
              </div>
              <CasesFilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Top Bar (Mobile Filters + Search + Actions) */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 flex-1">
                {/* Mobile Filter Sheet */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden shrink-0">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                     <div className="py-4">
                        <h2 className="text-lg font-semibold mb-4">ตัวกรอง</h2>
                        <CasesFilterSidebar />
                     </div>
                  </SheetContent>
                </Sheet>
                
                <CaseSearchInput />
              </div>

              <div className="flex items-center gap-2">
                <RefreshButton invalidateKeys={["cases"]} />
                <Link href="/cases/new">
                  <Button className="gap-2 shadow-sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">สร้างเคสใหม่</span>
                    <span className="sm:hidden">สร้าง</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Cases Table */}
            <Card className="border-none shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent border-b border-border/50">
                    <TableHead className="w-[120px] font-medium">เลขเคส</TableHead>
                    <TableHead className="font-medium">รายละเอียด</TableHead>
                    <TableHead className="w-[120px] font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-2 -ml-2 gap-1.5 hover:bg-muted/50 font-medium",
                          isSortActive("severity") && "text-primary"
                        )}
                        onClick={() => handleSort("severity")}
                        disabled={isPending}
                      >
                        ระดับ
                        {getSortIcon("severity")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[130px] font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-2 -ml-2 gap-1.5 hover:bg-muted/50 font-medium",
                          isSortActive("status") && "text-primary"
                        )}
                        onClick={() => handleSort("status")}
                        disabled={isPending}
                      >
                        สถานะ
                        {getSortIcon("status")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[140px] font-medium">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="w-[120px] font-medium">SLA</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                            <Filter className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <p>ไม่พบข้อมูลเคสที่ตรงกับเงื่อนไข</p>
                          {(status || category || severity || search) && (
                            <Button 
                              variant="link" 
                              onClick={() => router.push('/cases')}
                              className="text-primary"
                            >
                              ล้างตัวกรองทั้งหมด
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    cases.map((caseItem: CaseItem) => {
                      const sla = formatSlaRemaining(caseItem.slaDeadline);
                      const SeverityIcon = severityLabels[caseItem.severity]?.icon || Info;
                      
                      return (
                        <TableRow key={caseItem.id} className="cursor-pointer hover:bg-muted/30 transition-colors group">
                          <TableCell className="font-mono text-sm font-medium text-muted-foreground group-hover:text-foreground">
                            <Link href={`/cases/${caseItem.id}`} className="block">
                              {caseItem.caseNumber}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link href={`/cases/${caseItem.id}`} className="block py-1">
                              <p className="font-medium text-foreground truncate max-w-[300px] lg:max-w-[400px]">
                                {caseItem.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span>{caseItem.customerName || "ไม่ระบุลูกค้า"}</span>
                                {caseItem.provider && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{caseItem.provider.name}</span>
                                  </>
                                )}
                                <span className="w-1 h-1 rounded-full bg-border" />
                                <span>{formatDistanceToNow(new Date(caseItem.createdAt), { addSuffix: true, locale: th })}</span>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <SeverityIcon className={cn("h-4 w-4", severityLabels[caseItem.severity]?.color)} />
                              <span className="text-sm text-muted-foreground hidden xl:inline">
                                {severityLabels[caseItem.severity]?.label}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("h-6 text-xs font-medium border", statusLabels[caseItem.status]?.className)}
                            >
                              {statusLabels[caseItem.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {caseItem.owner ? (
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                                  {caseItem.owner.name?.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-sm truncate max-w-[100px]">{caseItem.owner.name}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {sla.text !== "-" && (
                              <div className={cn(
                                "flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full w-fit",
                                sla.isMissed 
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" 
                                  : sla.isUrgent
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                    : "bg-muted text-muted-foreground"
                              )}>
                                <Clock className="h-3 w-3" />
                                <span>{sla.text}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem asChild>
                                  <Link href={`/cases/${caseItem.id}`} className="cursor-pointer font-medium">
                                    ดูรายละเอียด
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {caseItem.status === "NEW" && (
                                  <DropdownMenuItem 
                                    onClick={() => quickStatusChange(caseItem.id, "INVESTIGATING", queryClient)}
                                    className="cursor-pointer"
                                  >
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                    รับเรื่อง (ตรวจสอบ)
                                  </DropdownMenuItem>
                                )}
                                {caseItem.status !== "RESOLVED" && caseItem.status !== "CLOSED" && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => quickStatusChange(caseItem.id, "WAITING_CUSTOMER", queryClient)}
                                      className="cursor-pointer"
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      รอลูกค้า
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  แสดง {(page - 1) * limit + 1}-{Math.min(page * limit, total)} จาก {total} เคส
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("page", (page - 1).toString());
                      router.push(`/cases?${params.toString()}`);
                    }}
                  >
                    ก่อนหน้า
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("page", (page + 1).toString());
                      router.push(`/cases?${params.toString()}`);
                    }}
                  >
                    ถัดไป
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
