import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDistanceToNow, differenceInMinutes, format } from "date-fns";
import { th } from "date-fns/locale";
import { CaseActions } from "./case-actions";
import { AddNoteForm } from "./add-note-form";

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

function formatSlaRemaining(deadline: Date | null): { text: string; isUrgent: boolean; isMissed: boolean } {
  if (!deadline) return { text: "-", isUrgent: false, isMissed: false };
  
  const now = new Date();
  const diffMins = differenceInMinutes(deadline, now);
  
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
  createdAt: Date;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  createdAt: Date;
  user: { id: string; name: string | null } | null;
}

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: CaseDetailPageProps) {
  const { id } = await params;
  
  const caseDetail = await prisma.case.findUnique({
    where: { id },
    include: {
      caseType: true,
      owner: { select: { id: true, name: true, role: true } },
      provider: { select: { id: true, name: true } },
      orders: {
        include: {
          provider: { select: { name: true } },
        },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!caseDetail) {
    notFound();
  }

  const sla = formatSlaRemaining(caseDetail.slaDeadline);

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Back button and header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/cases">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">{caseDetail.caseNumber}</h1>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium", severityLabels[caseDetail.severity]?.className)}
                >
                  {severityLabels[caseDetail.severity]?.label}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium", statusLabels[caseDetail.status]?.className)}
                >
                  {statusLabels[caseDetail.status]?.label}
                </Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{caseDetail.title}</p>
            </div>
          </div>
          <CaseActions caseId={caseDetail.id} currentStatus={caseDetail.status} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายละเอียด</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {caseDetail.description || "ไม่มีรายละเอียด"}
                </p>
              </CardContent>
            </Card>

            {/* Orders */}
            {caseDetail.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ออเดอร์ที่เกี่ยวข้อง</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {caseDetail.orders.map((order: Order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="font-mono text-sm font-medium">{order.orderId}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(order.createdAt, "d MMM yyyy HH:mm", { locale: th })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">฿{Number(order.amount).toLocaleString()}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {caseDetail.activities.map((activity: Activity, index: number) => {
                    const Icon = activityIcons[activity.type] || MessageSquare;
                    return (
                      <div key={activity.id} className="flex gap-4">
                        <div className="relative flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          {index < caseDetail.activities.length - 1 && (
                            <div className="absolute top-8 h-full w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{activity.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {format(activity.createdAt, "HH:mm")}
                            </span>
                          </div>
                          {activity.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {activity.description}
                            </p>
                          )}
                          {activity.user && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              โดย {activity.user.name}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add note */}
                <Separator className="my-6" />
                <AddNoteForm caseId={caseDetail.id} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SLA Alert */}
            {caseDetail.slaDeadline && caseDetail.status !== "RESOLVED" && caseDetail.status !== "CLOSED" && (
              <Card className={cn(
                "border-2",
                sla.isMissed ? "border-red-500 bg-red-50 dark:bg-red-950/30" : 
                sla.isUrgent ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : 
                "border-green-500 bg-green-50 dark:bg-green-950/30"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className={cn(
                      "h-5 w-5",
                      sla.isMissed ? "text-red-500" :
                      sla.isUrgent ? "text-amber-500" : "text-green-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium">SLA Deadline</p>
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

            {/* Case Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูลเคส</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">ประเภท</p>
                  <p className="mt-1">{caseDetail.caseType.name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">แหล่งที่มา</p>
                  <p className="mt-1">{caseDetail.source}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">สร้างเมื่อ</p>
                  <p className="mt-1 text-sm">
                    {format(caseDetail.createdAt, "d MMM yyyy HH:mm", { locale: th })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ({formatDistanceToNow(caseDetail.createdAt, { addSuffix: true, locale: th })})
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-4 w-4" />
                  ลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{caseDetail.customerName || "ไม่ระบุ"}</p>
                  {caseDetail.customerId && (
                    <p className="text-sm text-muted-foreground">{caseDetail.customerId}</p>
                  )}
                </div>
                {caseDetail.customerContact && (
                  <div className="text-sm text-muted-foreground">
                    {caseDetail.customerContact}
                  </div>
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-sm font-medium">
                        {caseDetail.owner.name?.charAt(0) || "?"}
                      </span>
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

            {/* Resolution (if resolved/closed) */}
            {(caseDetail.status === "RESOLVED" || caseDetail.status === "CLOSED") && caseDetail.resolution && (
              <Card className="border-green-200 dark:border-green-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    การแก้ไข
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {caseDetail.rootCause && (
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">สาเหตุ</p>
                      <p className="mt-1 text-sm">{caseDetail.rootCause}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">วิธีแก้ไข</p>
                    <p className="mt-1 text-sm">{caseDetail.resolution}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
