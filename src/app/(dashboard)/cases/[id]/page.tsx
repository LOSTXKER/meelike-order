"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCase } from "@/hooks";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { th } from "date-fns/locale";
import { CaseActions } from "./case-actions";
import { AddNoteForm } from "./add-note-form";
import { FileAttachments } from "./file-attachments";
import { StatusFlowGuide } from "@/components/case/status-flow-guide";
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
  const [showAllActivities, setShowAllActivities] = useState(false);
  
  const { data: caseDetail, isLoading, refetch } = useCase(id);

  if (isLoading || !caseDetail) {
    return <LoadingScreen variant="dots" />;
  }

  const sla = formatSlaRemaining(caseDetail.slaDeadline);

  // Show only recent 5 activities by default
  const recentActivities = showAllActivities 
    ? caseDetail.activities 
    : caseDetail.activities?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link href="/cases">
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{caseDetail.caseNumber}</h1>
                <Badge variant="outline" className={cn("text-xs", severityLabels[caseDetail.severity]?.className)}>
                  {severityLabels[caseDetail.severity]?.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", statusLabels[caseDetail.status]?.className)}>
                  {statusLabels[caseDetail.status]?.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <RefreshButton invalidateKeys={[`case-${id}`]} size="sm" />
            <CaseActions caseId={caseDetail.id} currentStatus={caseDetail.status} />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {/* SLA Alert */}
        {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
          <Card className={cn(
            "mb-4 border-2",
            sla.isMissed ? "border-red-500 bg-red-50 dark:bg-red-950/30" : 
            sla.isUrgent ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : 
            "border-green-500 bg-green-50 dark:bg-green-950/30"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className={cn(
                  "h-5 w-5 shrink-0",
                  sla.isMissed ? "text-red-500" :
                  sla.isUrgent ? "text-amber-500" : "text-green-500"
                )} />
                <div>
                  <p className="text-sm font-medium">
                    {sla.isMissed ? "⚠️ เกิน SLA แล้ว!" : sla.isUrgent ? "⏰ SLA ใกล้หมด!" : "✓ อยู่ใน SLA"}
                  </p>
                  <p className={cn(
                    "text-lg font-bold",
                    sla.isMissed ? "text-red-600 dark:text-red-400" :
                    sla.isUrgent ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                  )}>
                    {sla.text}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Flow */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <StatusFlowGuide currentStatus={caseDetail.status} />
          </CardContent>
        </Card>

        {/* Main Content - 2 Columns */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Left: Main Info */}
          <div className="space-y-4">
            {/* Description */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {caseDetail.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {caseDetail.description || "ไม่มีรายละเอียด"}
                </p>
              </CardContent>
            </Card>

            {/* Orders */}
            {caseDetail.orders && caseDetail.orders.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">ออเดอร์ ({caseDetail.orders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {caseDetail.orders.map((order: Order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                        <div>
                          <p className="font-mono text-sm font-medium">{order.orderId}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt, "d MMM yyyy", { locale: th })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">{order.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolution */}
            {(caseDetail.status === "RESOLVED" || caseDetail.status === "CLOSED") && caseDetail.resolution && (
              <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    การแก้ไข
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {caseDetail.rootCause && (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground">สาเหตุ</p>
                        <p className="mt-1 text-sm">{caseDetail.rootCause}</p>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">วิธีแก้ไข</p>
                    <p className="mt-1 text-sm">{caseDetail.resolution}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">ประวัติ</CardTitle>
                {caseDetail.activities && caseDetail.activities.length > 5 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                  >
                    {showAllActivities ? "ซ่อน" : `ดูทั้งหมด (${caseDetail.activities.length})`}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity: Activity, index: number) => {
                    const Icon = activityIcons[activity.type] || MessageSquare;
                    const activityDate = typeof activity.createdAt === "string" ? new Date(activity.createdAt) : activity.createdAt;
                    return (
                      <div key={activity.id} className="flex gap-3">
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border-2 border-background ring-1 ring-border shrink-0">
                            <Icon className="h-3 w-3 text-primary" />
                          </div>
                          {index < recentActivities.length - 1 && (
                            <div className="absolute top-7 h-full w-px bg-border" />
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
                                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {activity.user.name}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(activityDate, "d MMM, HH:mm", { locale: th })}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />
                
                {/* Add Note */}
                <div>
                  <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Edit3 className="h-3.5 w-3.5" />
                    เพิ่มบันทึก
                  </h3>
                  <AddNoteForm caseId={caseDetail.id} />
                </div>
              </CardContent>
            </Card>

            {/* Files */}
            <FileAttachments caseId={caseDetail.id} onUploadSuccess={() => refetch()} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Customer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  ลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">ชื่อ</p>
                  <p className="text-sm font-medium mt-0.5">{caseDetail.customerName || "ไม่ระบุ"}</p>
                </div>
                {caseDetail.customerId && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">ID</p>
                      <p className="font-mono text-xs mt-0.5">{caseDetail.customerId}</p>
                    </div>
                  </>
                )}
                {caseDetail.customerContact && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs text-muted-foreground">ติดต่อ</p>
                      <p className="text-xs mt-0.5">{caseDetail.customerContact}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Case Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ข้อมูลเคส</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">ประเภท</p>
                  <p className="text-sm font-medium mt-0.5">{caseDetail.caseType?.name || "-"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">แหล่งที่มา</p>
                  <p className="text-sm mt-0.5">{caseDetail.source}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground">สร้างเมื่อ</p>
                  <p className="text-xs mt-0.5">
                    {format(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, "d MMM yyyy, HH:mm", { locale: th })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ({formatDistanceToNow(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, { addSuffix: true, locale: th })})
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Provider */}
            {caseDetail.provider && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Provider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{caseDetail.provider.name}</p>
                </CardContent>
              </Card>
            )}

            {/* Assigned To */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">ผู้รับผิดชอบ</CardTitle>
              </CardHeader>
              <CardContent>
                {caseDetail.owner ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold shrink-0">
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
      </div>
    </div>
  );
}

