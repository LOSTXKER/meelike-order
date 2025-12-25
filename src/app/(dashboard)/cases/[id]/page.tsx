"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  UserCircle,
  Phone,
  Link as LinkIcon,
  AlertTriangle,
  Search,
  Wrench,
  CircleDot,
  UserX,
  HourglassIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCase } from "@/hooks";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { th } from "date-fns/locale";
import { CaseActionCenter } from "./case-action-center";
import { FileAttachments } from "./file-attachments";
import { OrderStatusSelect, BulkOrderActions } from "./order-status-select";
import { useParams } from "next/navigation";
import { useState } from "react";

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

// Progress Steps Configuration
const PROGRESS_STEPS = [
  { status: "NEW", label: "ใหม่", icon: CircleDot, color: "blue" },
  { status: "INVESTIGATING", label: "ตรวจสอบ", icon: Search, color: "violet" },
  { status: "FIXING", label: "แก้ไข", icon: Wrench, color: "cyan" },
  { status: "RESOLVED", label: "แก้ไขแล้ว", icon: CheckCircle2, color: "green" },
  { status: "CLOSED", label: "ปิดเคส", icon: CheckCircle2, color: "gray" },
];

// Waiting states
const WAITING_STATES = {
  WAITING_CUSTOMER: { label: "รอลูกค้า", icon: UserX, color: "amber" },
  WAITING_PROVIDER: { label: "รอ Provider", icon: HourglassIcon, color: "orange" },
};

interface CaseProgressBarProps {
  currentStatus: string;
}

function CaseProgressBar({ currentStatus }: CaseProgressBarProps) {
  const isWaitingState = currentStatus === "WAITING_CUSTOMER" || currentStatus === "WAITING_PROVIDER";
  
  const getCurrentStepIndex = () => {
    if (isWaitingState) return 1;
    return PROGRESS_STEPS.findIndex(step => step.status === currentStatus);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-3">
      {/* Waiting State Banner */}
      {isWaitingState && (
        <div className={cn(
          "mb-3 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm mx-auto w-fit",
          currentStatus === "WAITING_CUSTOMER" 
            ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/10 dark:text-amber-100 dark:border-amber-800"
            : "bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/10 dark:text-orange-100 dark:border-orange-800"
        )}>
          {currentStatus === "WAITING_CUSTOMER" ? (
            <UserX className="h-3.5 w-3.5" />
          ) : (
            <HourglassIcon className="h-3.5 w-3.5" />
          )}
          <span className="font-medium">
            {WAITING_STATES[currentStatus as keyof typeof WAITING_STATES]?.label}
          </span>
        </div>
      )}

      {/* Progress Steps */}
      <div className="relative max-w-2xl mx-auto">
        {/* Progress Line */}
        <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-border hidden sm:block">
          <div 
            className={cn(
              "h-full transition-all duration-500",
              currentStepIndex >= 0 && "bg-gradient-to-r from-blue-500 to-green-500"
            )}
            style={{ 
              width: `${currentStepIndex >= 0 ? (currentStepIndex / (PROGRESS_STEPS.length - 1)) * 100 : 0}%` 
            }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {PROGRESS_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isPassed = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isFuture = index > currentStepIndex;

            return (
              <div key={step.status} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={cn(
                    "relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 bg-background",
                    isPassed && "bg-green-500 border-green-500 text-white shadow-sm",
                    isCurrent && cn(
                      "h-8 w-8 border-2 shadow-md",
                      step.status === "NEW" && "border-blue-500 text-blue-600",
                      step.status === "INVESTIGATING" && "border-violet-500 text-violet-600",
                      step.status === "FIXING" && "border-cyan-500 text-cyan-600",
                      step.status === "RESOLVED" && "border-green-500 text-green-600",
                      step.status === "CLOSED" && "border-gray-500 text-gray-600"
                    ),
                    isFuture && "border-border text-muted-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", isCurrent && "h-4 w-4")} />
                </div>

                <p className={cn(
                  "text-[10px] font-medium transition-colors whitespace-nowrap hidden sm:block",
                  isPassed && "text-muted-foreground",
                  isCurrent && cn(
                    "font-semibold",
                    step.status === "NEW" && "text-blue-600",
                    step.status === "INVESTIGATING" && "text-violet-600",
                    step.status === "FIXING" && "text-cyan-600",
                    step.status === "RESOLVED" && "text-green-600",
                    step.status === "CLOSED" && "text-gray-600"
                  ),
                  isFuture && "text-muted-foreground"
                )}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cases">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-lg font-bold tracking-tight">
                {caseDetail.caseNumber}
              </h1>
              {/* SLA Badge in Header */}
              {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs font-medium",
                    sla.isMissed ? "bg-red-50 text-red-700 border-red-200" : 
                    sla.isUrgent ? "bg-amber-50 text-amber-700 border-amber-200" : 
                    "bg-green-50 text-green-700 border-green-200"
                  )}
                >
                  {sla.isMissed ? <AlertTriangle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                  SLA: {sla.text}
                </Badge>
              )}
            </div>
            <RefreshButton invalidateKeys={[["case", id], "cases", "dashboard"]} size="sm" />
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-4">
        {/* Progress Bar */}
        <CaseProgressBar currentStatus={caseDetail.status} />

        {/* Action Center */}
        <div className="mb-6">
          <CaseActionCenter 
            caseId={caseDetail.id}
            currentStatus={caseDetail.status}
            owner={caseDetail.owner}
            orders={caseDetail.orders}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Section */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold leading-tight">{caseDetail.title}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn(severityLabels[caseDetail.severity]?.className)}>
                  {severityLabels[caseDetail.severity]?.label}
                </Badge>
                <Badge variant="secondary" className="font-normal">
                  {categoryLabels[caseDetail.caseType?.category || ""] || caseDetail.caseType?.category || "General"}
                </Badge>
                {caseDetail.caseType?.name && (
                  <span className="text-sm text-muted-foreground">
                    / {caseDetail.caseType.name}
                  </span>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
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
                    {caseDetail.description ? (
                      <p className="text-base leading-relaxed whitespace-pre-wrap">
                        {caseDetail.description}
                      </p>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">ไม่มีรายละเอียดเพิ่มเติม</p>
                      </div>
                    )}
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
                      <div className="text-center py-6 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                         <p className="text-sm">ไม่มีออเดอร์ที่เกี่ยวข้อง</p>
                      </div>
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
            <Card>
              <CardHeader className="pb-3 border-b bg-muted/10 px-4 py-3">
                <CardTitle className="text-sm font-medium">ข้อมูลทั่วไป</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {/* Assignee */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> ผู้รับผิดชอบ
                    </p>
                    {caseDetail.owner ? (
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                          {caseDetail.owner.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{caseDetail.owner.name}</p>
                          <p className="text-xs text-muted-foreground">{caseDetail.owner.role}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-600 italic">ยังไม่มอบหมาย</p>
                    )}
                  </div>

                  {/* Customer Info */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <UserCircle className="h-3.5 w-3.5" /> ลูกค้า
                    </p>
                    {caseDetail.customerName ? (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{caseDetail.customerName}</p>
                        {caseDetail.customerContact && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {caseDetail.customerContact}
                          </p>
                        )}
                        {caseDetail.customerId && (
                          <p className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded w-fit">
                            ID: {caseDetail.customerId}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">- ไม่ระบุ -</p>
                    )}
                  </div>

                  {/* Provider */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> Provider
                    </p>
                    <p className="text-sm font-medium">{caseDetail.provider?.name || "-"}</p>
                  </div>

                  {/* Metadata */}
                  <div className="p-3 bg-muted/5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">แหล่งที่มา</span>
                      <span className="font-medium flex items-center gap-1">
                        {caseDetail.source === 'TICKET' && <LinkIcon className="h-3 w-3" />}
                        {caseDetail.source || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">สร้างเมื่อ</span>
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
