"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  ArrowLeft,
  Clock,
  User,
  Building2,
  MessageSquare,
  FileText,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Edit3,
  ChevronDown,
  Package,
  History,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCase } from "@/hooks";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { th } from "date-fns/locale";
import { CaseActions } from "./case-actions";
import { AddNoteForm } from "./add-note-form";
import { FileAttachments } from "./file-attachments";
import { useParams } from "next/navigation";
import { useState } from "react";

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800" },
  INVESTIGATING: { label: "กำลังตรวจสอบ", className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800" },
  FIXING: { label: "กำลังแก้ไข", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800" },
};

const severityLabels: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "วิกฤต", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  HIGH: { label: "สูง", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  NORMAL: { label: "ปกติ", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  LOW: { label: "ต่ำ", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

const activityIcons: Record<string, typeof MessageSquare> = {
  CREATED: FileText,
  STATUS_CHANGED: ChevronRight,
  ASSIGNED: User,
  NOTE_ADDED: MessageSquare,
  RESOLVED: CheckCircle2,
  ESCALATED: AlertCircle,
  SEVERITY_CHANGED: AlertCircle,
  FILE_ATTACHED: FileText,
  SLA_UPDATED: Clock,
  CLOSED: CheckCircle2,
  REOPENED: ChevronRight,
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

interface Order {
  id: string;
  orderId: string;
  amount: unknown;
  status: string;
  createdAt: Date | string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: Date | string;
  user: { name: string | null } | null;
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("details");
  
  const { data: caseDetail, isLoading, refetch } = useCase(id);

  if (isLoading || !caseDetail) {
    return <LoadingScreen variant="dots" />;
  }

  const sla = formatSlaRemaining(caseDetail.slaDeadline);

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/cases">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{caseDetail.caseNumber}</h1>
              <Badge variant="outline" className={cn("text-xs", severityLabels[caseDetail.severity]?.className)}>
                {severityLabels[caseDetail.severity]?.label}
              </Badge>
              <Badge variant="outline" className={cn("text-xs", statusLabels[caseDetail.status]?.className)}>
                {statusLabels[caseDetail.status]?.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton invalidateKeys={[`case-${id}`]} size="sm" />
            <CaseActions caseId={caseDetail.id} currentStatus={caseDetail.status} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-[1400px] mx-auto space-y-6">
          {/* Top Section: Hero + Sidebar */}
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              {/* SLA Alert - BIG & PROMINENT */}
              {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
                <div className={cn(
                  "rounded-xl border-2 p-6",
                  sla.isMissed ? "border-red-500 bg-red-50 dark:bg-red-950/30" : 
                  sla.isUrgent ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : 
                  "border-green-500 bg-green-50 dark:bg-green-950/30"
                )}>
                  <div className="flex items-center gap-4">
                    <Clock className={cn(
                      "h-8 w-8",
                      sla.isMissed ? "text-red-500" :
                      sla.isUrgent ? "text-amber-500" : "text-green-500"
                    )} />
                    <div>
                      <p className="font-medium text-sm mb-1">
                        {sla.isMissed ? "⚠️ เกิน SLA แล้ว!" : sla.isUrgent ? "⏰ ใกล้หมด SLA!" : "✓ อยู่ใน SLA"}
                      </p>
                      <p className={cn(
                        "text-3xl font-bold tracking-tight",
                        sla.isMissed ? "text-red-600 dark:text-red-400" :
                        sla.isUrgent ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                      )}>
                        {sla.text}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* HERO CARD - Main Problem */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl font-bold leading-tight">
                    {caseDetail.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {caseDetail.caseType?.name} • {caseDetail.source} • {formatDistanceToNow(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, { addSuffix: true, locale: th })}
                  </p>
                </CardHeader>
              </Card>
            </div>

            {/* Sidebar - COMPACT */}
            <div className="space-y-3">
              {/* Quick Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">ข้อมูลเคส</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">ลูกค้า</p>
                      <p className="font-medium truncate">{caseDetail.customerName || "ไม่ระบุ"}</p>
                    </div>
                  </div>

                  {caseDetail.customerId && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">ID</p>
                          <p className="font-mono text-xs truncate">{caseDetail.customerId}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {caseDetail.customerContact && (
                    <>
                      <Separator />
                      <div className="flex items-start gap-2">
                        <div className="h-4 w-4 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">ติดต่อ</p>
                          <p className="text-xs truncate">{caseDetail.customerContact}</p>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {caseDetail.provider && (
                    <>
                      <div className="flex items-start gap-2">
                        <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Provider</p>
                          <p className="font-medium truncate">{caseDetail.provider.name}</p>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">สร้างเมื่อ</p>
                      <p className="text-xs">
                        {format(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, "d MMM yyyy, HH:mm", { locale: th })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">ผู้รับผิดชอบ</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseDetail.owner ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                        {caseDetail.owner.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{caseDetail.owner.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{caseDetail.owner.role}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มี</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* TABS: รายละเอียด | ประวัติ */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details" className="gap-2">
                <Info className="h-4 w-4" />
                รายละเอียด
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2">
                <History className="h-4 w-4" />
                ประวัติ/Log
                {caseDetail.activities && caseDetail.activities.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {caseDetail.activities.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="mt-6 space-y-6">
              {/* Description */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    รายละเอียดปัญหา
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {caseDetail.description || "ไม่มีรายละเอียด"}
                  </p>
                </CardContent>
              </Card>

              {/* Resolution - If Resolved */}
              {(caseDetail.status === "RESOLVED" || caseDetail.status === "CLOSED") && caseDetail.resolution && (
                <Card className="border-2 border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      แก้ไขแล้ว
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {caseDetail.rootCause && (
                      <>
                        <div>
                          <p className="text-xs font-semibold text-green-700/70 dark:text-green-400/70 mb-1">สาเหตุ</p>
                          <p className="text-sm">{caseDetail.rootCause}</p>
                        </div>
                        <Separator className="bg-green-200 dark:bg-green-800" />
                      </>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-green-700/70 dark:text-green-400/70 mb-1">วิธีแก้ไข</p>
                      <p className="text-sm">{caseDetail.resolution}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Orders */}
              {caseDetail.orders && caseDetail.orders.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      ออเดอร์ ({caseDetail.orders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {caseDetail.orders.map((order: Order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                          <p className="font-mono text-sm font-medium">{order.orderId}</p>
                          <Badge variant="outline" className="text-xs">{order.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Files */}
              <FileAttachments caseId={caseDetail.id} onUploadSuccess={() => refetch()} />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-bold">ประวัติการดำเนินการ</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {caseDetail.activities && caseDetail.activities.length > 0 ? (
                      caseDetail.activities.map((activity: Activity, index: number) => {
                        const Icon = activityIcons[activity.type] || MessageSquare;
                        const activityDate = typeof activity.createdAt === "string" ? new Date(activity.createdAt) : activity.createdAt;
                        return (
                          <div key={activity.id} className="flex gap-4">
                            <div className="relative flex flex-col items-center">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border-2 border-background ring-2 ring-border shrink-0">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              {index < caseDetail.activities.length - 1 && (
                                <div className="absolute top-8 h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-4 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">{activity.title}</p>
                                  {activity.description && (
                                    <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                                  )}
                                  {activity.user && (
                                    <p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {activity.user.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {format(activityDate, "d MMM, HH:mm", { locale: th })}
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {formatDistanceToNow(activityDate, { addSuffix: true, locale: th })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีประวัติ</p>
                    )}
                  </div>

                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Edit3 className="h-3.5 w-3.5" />
                      เพิ่มบันทึก
                    </h3>
                    <AddNoteForm caseId={caseDetail.id} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}
