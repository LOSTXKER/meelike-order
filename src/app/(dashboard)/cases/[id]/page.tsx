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
  Package,
  History,
  Info,
  Calendar,
  UserCircle,
  Phone,
  Link as LinkIcon,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCase } from "@/hooks";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { th } from "date-fns/locale";
import { CaseActions } from "./case-actions";
import { FileAttachments } from "./file-attachments";
import { OrderStatusSelect, OrderStatusBadge, BulkOrderActions } from "./order-status-select";
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

const categoryLabels: Record<string, string> = {
  PAYMENT: "การชำระเงิน",
  ORDER: "ออเดอร์",
  SYSTEM: "ระบบ",
  PROVIDER: "Provider",
  TECHNICAL: "เทคนิค",
  OTHER: "อื่นๆ",
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
  provider?: { id: string; name: string } | null;
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
    <div className="min-h-screen bg-muted/10">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/cases">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold tracking-tight">{caseDetail.caseNumber}</h1>
                  <Badge variant="outline" className={cn("font-medium", statusLabels[caseDetail.status]?.className)}>
                    {statusLabels[caseDetail.status]?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
                  {caseDetail.title}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RefreshButton invalidateKeys={[`case-${id}`]} size="sm" />
              <CaseActions 
                caseId={caseDetail.id} 
                currentStatus={caseDetail.status} 
                currentOwnerId={caseDetail.ownerId}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6">
        {/* SLA Alert - Slim Banner */}
        {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
          <div className={cn(
            "mb-6 flex items-center justify-between rounded-lg border-l-4 px-4 py-3 shadow-sm",
            sla.isMissed ? "bg-red-50 border-red-500 text-red-900 dark:bg-red-900/10 dark:text-red-100" : 
            sla.isUrgent ? "bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-900/10 dark:text-amber-100" : 
            "bg-green-50 border-green-500 text-green-900 dark:bg-green-900/10 dark:text-green-100"
          )}>
            <div className="flex items-center gap-3">
              {sla.isMissed ? <AlertTriangle className="h-5 w-5 text-red-600" /> : 
               sla.isUrgent ? <AlertCircle className="h-5 w-5 text-amber-600" /> : 
               <Clock className="h-5 w-5 text-green-600" />}
              <div>
                <p className="font-semibold text-sm">
                  {sla.isMissed ? "SLA Overdue" : sla.isUrgent ? "SLA Warning" : "SLA On Track"}
                </p>
                <p className="text-xs opacity-90">
                  {sla.isMissed ? `เกินกำหนดมาแล้ว ${sla.text}` : `เหลือเวลาอีก ${sla.text}`}
                </p>
              </div>
            </div>
            {sla.isUrgent && (
              <Badge variant="outline" className="bg-background/50 ml-2">
                Action Required
              </Badge>
            )}
          </div>
        )}

        {/* Smart Suggest: All Orders Handled */}
        {caseDetail.orders && 
         caseDetail.orders.length > 0 && 
         caseDetail.status !== "RESOLVED" && 
         caseDetail.status !== "CLOSED" &&
         !caseDetail.orders.some((o: Order) => o.status === "PENDING" || o.status === "PROCESSING") && (
          <div className="mb-6 flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-sm text-green-900 dark:text-green-100">
                  Orders ทั้งหมดจัดการแล้ว!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  พิจารณาปิดเคสหรือเปลี่ยนสถานะเป็น &quot;แก้ไขแล้ว&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section (Visible on mobile/desktop) */}
            <div>
              <h2 className="text-2xl font-bold leading-tight mb-2">{caseDetail.title}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(severityLabels[caseDetail.severity]?.className)}>
                  {severityLabels[caseDetail.severity]?.label}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {caseDetail.caseType?.name}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, { addSuffix: true, locale: th })}
                </span>
              </div>
            </div>

            {/* Resolution Card */}
            {(caseDetail.status === "RESOLVED" || caseDetail.status === "CLOSED") && caseDetail.resolution && (
              <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-semibold text-green-900 dark:text-green-100">การแก้ไขปัญหา</h3>
                      {caseDetail.rootCause && (
                        <div>
                          <p className="text-xs font-medium uppercase text-green-700/70 dark:text-green-400/70 mb-1">สาเหตุ</p>
                          <p className="text-sm text-green-900 dark:text-green-100">{caseDetail.rootCause}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium uppercase text-green-700/70 dark:text-green-400/70 mb-1">วิธีแก้ไข</p>
                        <p className="text-sm text-green-900 dark:text-green-100">{caseDetail.resolution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                <TabsTrigger value="timeline">
                  ประวัติ
                  {caseDetail.activities && caseDetail.activities.length > 0 && (
                    <span className="ml-2 rounded-full bg-muted-foreground/20 px-2 py-0.5 text-xs">
                      {caseDetail.activities.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* TAB: Details */}
              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      รายละเอียด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">
                      {caseDetail.description || "ไม่มีรายละเอียด"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        ออเดอร์ที่เกี่ยวข้อง
                        {caseDetail.orders && caseDetail.orders.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {caseDetail.orders.length} รายการ
                          </Badge>
                        )}
                      </CardTitle>
                      {/* Bulk Actions */}
                      {caseDetail.orders && caseDetail.orders.length > 1 && (
                        <BulkOrderActions 
                          orders={caseDetail.orders} 
                          caseId={caseDetail.id}
                          onUpdate={() => refetch()}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {caseDetail.orders && caseDetail.orders.length > 0 ? (
                      <div className="space-y-2">
                        {caseDetail.orders.map((order: Order) => (
                          <OrderStatusSelect
                            key={order.id}
                            order={order}
                            caseId={caseDetail.id}
                            onUpdate={() => refetch()}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">-</p>
                    )}
                  </CardContent>
                </Card>

                <FileAttachments caseId={caseDetail.id} onUploadSuccess={() => refetch()} />
              </TabsContent>

              {/* TAB: Timeline */}
              <TabsContent value="timeline">
                <Card>
                  <CardContent className="p-6">
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {/* Activities List */}
                      {caseDetail.activities && caseDetail.activities.map((activity: Activity) => {
                        const Icon = activityIcons[activity.type] || MessageSquare;
                        const activityDate = typeof activity.createdAt === "string" ? new Date(activity.createdAt) : activity.createdAt;
                        
                        return (
                          <div key={activity.id} className="relative pl-8 group">
                            <div className="absolute left-2.5 top-1 h-5 w-5 -translate-x-1/2 rounded-full border bg-background flex items-center justify-center ring-4 ring-background group-hover:border-primary transition-colors">
                              <Icon className="h-2.5 w-2.5 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium">{activity.title}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {formatDistanceToNow(activityDate, { addSuffix: true, locale: th })}
                                </span>
                              </div>
                              {activity.description && (
                                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md mt-1">
                                  {activity.description}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {activity.user && (
                                  <span className="text-xs font-medium flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                                    {activity.user.name}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground/50">
                                  {format(activityDate, "d MMM HH:mm", { locale: th })}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: Sidebar Info (1/3) */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10">
                <CardTitle className="text-sm font-medium">ข้อมูลทั่วไป</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {/* Customer */}
                  <div className="p-4 flex gap-3">
                    <UserCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">ลูกค้า</p>
                      <p className="text-sm font-medium">{caseDetail.customerName || "-"}</p>
                    </div>
                  </div>

                  {/* Customer ID */}
                  <div className="p-4 flex gap-3">
                    <div className="h-5 w-5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Customer ID</p>
                      <p className="text-xs font-mono truncate">{caseDetail.customerId || "-"}</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="p-4 flex gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">ติดต่อ</p>
                      <p className="text-xs truncate">{caseDetail.customerContact || "-"}</p>
                    </div>
                  </div>

                  {/* Provider */}
                  <div className="p-4 flex gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">Provider</p>
                      <p className="text-sm font-medium">{caseDetail.provider?.name || "-"}</p>
                    </div>
                  </div>

                  {/* Orders Summary */}
                  <div className="p-4 flex gap-3">
                    <Package className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Orders ({caseDetail.orders?.length || 0})</p>
                      {caseDetail.orders && caseDetail.orders.length > 0 ? (
                        <div className="space-y-1.5">
                          {caseDetail.orders.slice(0, 3).map((order: Order) => (
                            <div key={order.id} className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono truncate">{order.orderId}</span>
                              <OrderStatusBadge status={order.status} />
                            </div>
                          ))}
                          {caseDetail.orders.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{caseDetail.orders.length - 3} อื่นๆ
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div className="p-4 flex gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-0.5">ผู้รับผิดชอบ</p>
                      {caseDetail.owner ? (
                        <>
                          <p className="text-sm font-medium">{caseDetail.owner.name}</p>
                          <p className="text-xs text-muted-foreground">{caseDetail.owner.role}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="p-4 bg-muted/5 space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <LinkIcon className="h-3 w-3" /> แหล่งที่มา
                      </span>
                      <span className="font-medium">{caseDetail.source || "-"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tag className="h-3 w-3" /> หมวดหมู่
                      </span>
                      <span className="font-medium">{categoryLabels[caseDetail.caseType?.category || ""] || caseDetail.caseType?.category || "-"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> สร้างเมื่อ
                      </span>
                      <span className="font-medium">
                        {format(typeof caseDetail.createdAt === "string" ? new Date(caseDetail.createdAt) : caseDetail.createdAt, "d MMM yyyy", { locale: th })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
