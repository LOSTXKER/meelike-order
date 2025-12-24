"use client";

import { Header } from "@/components/layout/header";
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
  Calendar,
  Tag,
  Link as LinkIcon,
  History,
  Paperclip,
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
  user: { id: string; name: string | null } | null;
}

export default function CaseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: caseDetail, isLoading, refetch } = useCase(id);

  if (isLoading || !caseDetail) {
    return <LoadingScreen variant="dots" />;
  }

  const sla = formatSlaRemaining(caseDetail.slaDeadline);

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Link href="/cases">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold">{caseDetail.caseNumber}</h1>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", severityLabels[caseDetail.severity]?.className)}
                  >
                    {severityLabels[caseDetail.severity]?.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusLabels[caseDetail.status]?.className)}
                  >
                    {statusLabels[caseDetail.status]?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate mt-0.5">{caseDetail.title}</p>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <RefreshButton invalidateKeys={[`case-${id}`]} size="sm" />
              <CaseActions caseId={caseDetail.id} currentStatus={caseDetail.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* SLA Alert Banner */}
        {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
          <Card className={cn(
            "border-2",
            sla.isMissed ? "border-red-500 bg-red-50 dark:bg-red-950/30" : 
            sla.isUrgent ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : 
            "border-green-500 bg-green-50 dark:bg-green-950/30"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className={cn(
                    "h-5 w-5",
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
                {sla.isUrgent && (
                  <Button size="sm" variant="default" className="shrink-0">
                    ดำเนินการด่วน!
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Info Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">ลูกค้า</p>
                  <p className="font-medium text-sm truncate">{caseDetail.customerName || "ไม่ระบุ"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Tag className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">ประเภท</p>
                  <p className="font-medium text-sm truncate">{caseDetail.caseType?.name || "-"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">สร้างเมื่อ</p>
                  <p className="font-medium text-sm">
                    {formatDistanceToNow(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, { addSuffix: true, locale: th })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">แหล่งที่มา</p>
                  <p className="font-medium text-sm">{caseDetail.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Flow */}
        <StatusFlowGuide currentStatus={caseDetail.status} />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">ภาพรวม</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <Paperclip className="h-4 w-4" />
              <span className="hidden sm:inline">ไฟล์</span>
              {caseDetail.attachments && caseDetail.attachments.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {caseDetail.attachments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <Edit3 className="h-4 w-4" />
              <span className="hidden sm:inline">รายละเอียด</span>
            </TabsTrigger>
          </TabsList>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  รายละเอียดปัญหา
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
                <CardHeader>
                  <CardTitle className="text-lg">ออเดอร์ที่เกี่ยวข้อง ({caseDetail.orders.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseDetail.orders.map((order: Order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-mono text-sm font-medium">{order.orderId}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt, "d MMM yyyy HH:mm", { locale: th })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resolution (if resolved/closed) */}
            {(caseDetail.status === "RESOLVED" || caseDetail.status === "CLOSED") && caseDetail.resolution && (
              <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    การแก้ไข
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {caseDetail.rootCause && (
                    <div>
                      <p className="text-xs font-semibold uppercase text-green-600/80 dark:text-green-400/80">สาเหตุ</p>
                      <p className="mt-1 text-sm">{caseDetail.rootCause}</p>
                    </div>
                  )}
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase text-green-600/80 dark:text-green-400/80">วิธีแก้ไข</p>
                    <p className="mt-1 text-sm">{caseDetail.resolution}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ประวัติการดำเนินการ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseDetail.activities && caseDetail.activities.map((activity: Activity, index: number) => {
                    const Icon = activityIcons[activity.type] || MessageSquare;
                    const activityDate = typeof activity.createdAt === "string" ? new Date(activity.createdAt) : activity.createdAt;
                    return (
                      <div key={activity.id} className="flex gap-4">
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border-2 border-background ring-2 ring-muted">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          {index < caseDetail.activities.length - 1 && (
                            <div className="absolute top-9 h-full w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{activity.title}</p>
                              {activity.description && (
                                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                                  {activity.description}
                                </p>
                              )}
                              {activity.user && (
                                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
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

                {/* Add note */}
                <Separator className="my-6" />
                <div>
                  <h3 className="font-semibold text-sm mb-3">เพิ่มบันทึก</h3>
                  <AddNoteForm caseId={caseDetail.id} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <FileAttachments 
              caseId={caseDetail.id} 
              onUploadSuccess={() => refetch()} 
            />
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Case Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ข้อมูลเคส</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">เลขที่เคส</p>
                    <p className="mt-1 font-mono">{caseDetail.caseNumber}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">ประเภท</p>
                    <p className="mt-1">{caseDetail.caseType?.name || "-"}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">แหล่งที่มา</p>
                    <p className="mt-1">{caseDetail.source}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">สร้างเมื่อ</p>
                    <p className="mt-1 text-sm">
                      {format(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, "d MMMM yyyy, HH:mm น.", { locale: th })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ({formatDistanceToNow(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, { addSuffix: true, locale: th })})
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-4 w-4" />
                    ข้อมูลลูกค้า
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">ชื่อ</p>
                    <p className="mt-1 font-medium">{caseDetail.customerName || "ไม่ระบุ"}</p>
                  </div>
                  {caseDetail.customerId && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Customer ID</p>
                        <p className="mt-1 font-mono text-sm">{caseDetail.customerId}</p>
                      </div>
                    </>
                  )}
                  {caseDetail.customerContact && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">ช่องทางติดต่อ</p>
                        <p className="mt-1 text-sm">{caseDetail.customerContact}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Provider Info */}
              {caseDetail.provider && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-4 w-4" />
                      Provider
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium">{caseDetail.provider.name}</p>
                  </CardContent>
                </Card>
              )}

              {/* Assigned To */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ผู้รับผิดชอบ</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseDetail.owner ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                        {caseDetail.owner.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{caseDetail.owner.name}</p>
                        <p className="text-sm text-muted-foreground">{caseDetail.owner.role}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ยังไม่มีผู้รับผิดชอบ</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
