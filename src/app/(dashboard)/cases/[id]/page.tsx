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
  Package,
  History,
  Info,
  Calendar,
  UserCircle,
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
    <div className="min-h-screen bg-muted/30">
      {/* Compact Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/cases">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-lg font-bold">{caseDetail.caseNumber}</h1>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton invalidateKeys={[`case-${id}`]} size="sm" />
            <CaseActions caseId={caseDetail.id} currentStatus={caseDetail.status} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* SLA Alert - MEGA */}
          {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
            <div className={cn(
              "rounded-2xl border-2 p-8",
              sla.isMissed ? "border-red-500 bg-red-50 dark:bg-red-950/30" : 
              sla.isUrgent ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : 
              "border-green-500 bg-green-50 dark:bg-green-950/30"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-2xl",
                    sla.isMissed ? "bg-red-500/20" :
                    sla.isUrgent ? "bg-amber-500/20" : "bg-green-500/20"
                  )}>
                    <Clock className={cn(
                      "h-8 w-8",
                      sla.isMissed ? "text-red-600" :
                      sla.isUrgent ? "text-amber-600" : "text-green-600"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                      {sla.isMissed ? "⚠️ เกิน SLA แล้ว!" : sla.isUrgent ? "⏰ ใกล้หมด SLA!" : "✓ อยู่ใน SLA"}
                    </p>
                    <p className={cn(
                      "text-4xl font-bold tracking-tight",
                      sla.isMissed ? "text-red-600 dark:text-red-400" :
                      sla.isUrgent ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                    )}>
                      {sla.text}
                    </p>
                  </div>
                </div>
                {sla.isUrgent && !sla.isMissed && (
                  <Button size="lg" className="shrink-0">
                    ดำเนินการด่วน
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* HERO SECTION - Main Info */}
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Title + Badges */}
                <div>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold tracking-tight mb-2">{caseDetail.title}</h2>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={cn("text-sm py-1", severityLabels[caseDetail.severity]?.className)}>
                          {severityLabels[caseDetail.severity]?.label}
                        </Badge>
                        <Badge variant="outline" className={cn("text-sm py-1", statusLabels[caseDetail.status]?.className)}>
                          {statusLabels[caseDetail.status]?.label}
                        </Badge>
                        <Badge variant="secondary" className="text-sm py-1">
                          {caseDetail.caseType?.name}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {caseDetail.description || "ไม่มีรายละเอียด"}
                  </p>
                </div>

                <Separator />

                {/* Info Grid - 4 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Customer */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">ลูกค้า</p>
                      <p className="font-semibold truncate">{caseDetail.customerName || "ไม่ระบุ"}</p>
                      {caseDetail.customerId && (
                        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{caseDetail.customerId}</p>
                      )}
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Provider</p>
                      <p className="font-semibold truncate">{caseDetail.provider?.name || "ไม่มี"}</p>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">สร้างเมื่อ</p>
                      <p className="font-semibold text-sm">
                        {format(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, "d MMM yyyy", { locale: th })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, { addSuffix: true, locale: th })}
                      </p>
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <UserCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">ผู้รับผิดชอบ</p>
                      {caseDetail.owner ? (
                        <>
                          <p className="font-semibold truncate">{caseDetail.owner.name}</p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{caseDetail.owner.role}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">ยังไม่มี</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Card - If Resolved */}
          {(caseDetail.status === "RESOLVED" || caseDetail.status === "CLOSED") && caseDetail.resolution && (
            <Card className="border-2 border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20 shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="text-xl font-bold text-green-700 dark:text-green-400">แก้ไขเรียบร้อยแล้ว</h3>
                    {caseDetail.rootCause && (
                      <div>
                        <p className="text-sm font-semibold text-green-700/70 dark:text-green-400/70 mb-1">สาเหตุ</p>
                        <p className="text-sm leading-relaxed">{caseDetail.rootCause}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-green-700/70 dark:text-green-400/70 mb-1">วิธีแก้ไข</p>
                      <p className="text-sm leading-relaxed">{caseDetail.resolution}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TABS */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="details" className="gap-2 text-base">
                <Info className="h-4 w-4" />
                รายละเอียด
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-2 text-base">
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
              {/* Orders */}
              {caseDetail.orders && caseDetail.orders.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      ออเดอร์ที่เกี่ยวข้อง ({caseDetail.orders.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {caseDetail.orders.map((order: Order) => (
                        <div key={order.id} className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-mono font-semibold">{order.orderId}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt, "d MMM yyyy", { locale: th })}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">{order.status}</Badge>
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
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    ประวัติการดำเนินการ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {caseDetail.activities && caseDetail.activities.length > 0 ? (
                      caseDetail.activities.map((activity: Activity, index: number) => {
                        const Icon = activityIcons[activity.type] || MessageSquare;
                        const activityDate = typeof activity.createdAt === "string" ? new Date(activity.createdAt) : activity.createdAt;
                        return (
                          <div key={activity.id} className="flex gap-4">
                            <div className="relative flex flex-col items-center">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border-2 border-background ring-2 ring-muted shrink-0">
                                <Icon className="h-4 w-4 text-primary" />
                              </div>
                              {index < caseDetail.activities.length - 1 && (
                                <div className="absolute top-10 h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-6 min-w-0">
                              <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold">{activity.title}</p>
                                  {activity.description && (
                                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{activity.description}</p>
                                  )}
                                  {activity.user && (
                                    <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {activity.user.name}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-sm font-medium">
                                    {format(activityDate, "d MMM, HH:mm", { locale: th })}
                                  </p>
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
                      <div className="text-center py-12">
                        <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการดำเนินการ</p>
                      </div>
                    )}
                  </div>

                  <Separator className="my-6" />
                  
                  <div>
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Edit3 className="h-4 w-4" />
                      เพิ่มบันทึกใหม่
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
