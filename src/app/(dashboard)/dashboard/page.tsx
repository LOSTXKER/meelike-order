"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Inbox,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Zap,
  CreditCard,
  Package,
  Settings,
  Timer,
  Loader2,
  RefreshCcw,
  XCircle,
  Bell,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useDashboard } from "@/hooks";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface RecentCase {
  id: string;
  caseNumber: string;
  title: string;
  customerName: string | null;
  severity: string;
  status: string;
  createdAt: string;
  caseType: { name: string };
  owner: { name: string | null } | null;
}

interface CriticalCase {
  id: string;
  caseNumber: string;
  title: string;
  slaDeadline: string | null;
}

interface ProviderWithIssues {
  id: string;
  name: string;
  riskLevel: string | null;
  _count: { cases: number };
}

interface UrgentSlaCase {
  id: string;
  caseNumber: string;
  title: string;
  slaDeadline: string;
  minutesRemaining: number;
}

interface AwaitingNotificationCase {
  id: string;
  caseNumber: string;
  title: string;
  customerName: string | null;
  resolvedAt: string | null;
  resolution: string | null;
  caseType: { name: string };
  owner: { name: string | null } | null;
}

interface DashboardData {
  totalCases: number;
  newCases: number;
  inProgressCases: number;
  resolvedToday: number;
  slaMissed: number;
  recentCases: RecentCase[];
  criticalCases: CriticalCase[];
  providersWithIssues: ProviderWithIssues[];
  urgentSlaCases?: UrgentSlaCase[];
  // Order stats
  totalOrders?: number;
  pendingOrders?: number;
  processingOrders?: number;
  completedOrders?: number;
  refundedOrders?: number;
  failedOrders?: number;
  // Cases awaiting customer notification
  casesAwaitingNotification?: number;
  awaitingNotificationCases?: AwaitingNotificationCase[];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  // INVESTIGATING and FIXING now both display as "กำลังดำเนินการ" (merged flow)
  INVESTIGATING: { label: "กำลังดำเนินการ", className: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  FIXING: { label: "กำลังดำเนินการ", className: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

const severityLabels: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "วิกฤต", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  HIGH: { label: "สูง", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  NORMAL: { label: "ปกติ", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  LOW: { label: "ต่ำ", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <LoadingScreen variant="dots" />;
  }

  const dashboardData = data as DashboardData;

  const stats = [
    {
      title: "เคสทั้งหมด",
      value: dashboardData.totalCases.toString(),
      icon: Inbox,
      color: "text-primary",
    },
    {
      title: "กำลังดำเนินการ",
      value: dashboardData.inProgressCases.toString(),
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "แก้ไขแล้ววันนี้",
      value: dashboardData.resolvedToday.toString(),
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "SLA เกินกำหนด",
      value: dashboardData.slaMissed.toString(),
      icon: AlertCircle,
      color: "text-red-500",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="แดชบอร์ด" />
      
      <div className="p-6 space-y-6">
        {/* Welcome section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              ภาพรวมระบบ 👋
            </h2>
            <p className="text-muted-foreground">
              ภาพรวมระบบจัดการเคสวันนี้
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton invalidateKeys={["dashboard"]} />
            <Link href="/cases/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                สร้างเคสใหม่
              </Button>
            </Link>
          </div>
        </div>

        {/* Awaiting Customer Notification Banner - For Admin */}
        {(dashboardData.casesAwaitingNotification ?? 0) > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                  มี {dashboardData.casesAwaitingNotification} เคสที่แก้แล้ว - รอแจ้งลูกค้า
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  เคสเหล่านี้แก้ไขเสร็จแล้ว กรุณาแจ้งลูกค้าและปิดเคส
                </p>
              </div>
              <Link href="/cases?status=RESOLVED">
                <Button variant="outline" size="sm" className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-100">
                  ดูเคสรอแจ้ง
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* SLA Alert Banner - แสดงเมื่อมีเคสที่ใกล้หมดเวลา */}
        {dashboardData.slaMissed > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                <Timer className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200">
                  มี {dashboardData.slaMissed} เคสที่ SLA เกินกำหนด!
                </h3>
                <p className="text-sm text-red-600 dark:text-red-400">
                  กรุณาดำเนินการโดยเร็วที่สุด
                </p>
              </div>
              <Link href="/cases?status=SLA_BREACH">
                <Button variant="destructive" size="sm" className="gap-1">
                  ดูเคสทั้งหมด
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
              {/* Decorative gradient */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </Card>
          ))}
        </div>

        {/* Order Stats */}
        {(dashboardData.totalOrders ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Package className="h-5 w-5 text-blue-500" />
                สถิติ Orders
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                ภาพรวม Orders ทั้งหมดในระบบ
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800">
                    <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.pendingOrders || 0}</p>
                    <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800">
                    <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.processingOrders || 0}</p>
                    <p className="text-xs text-muted-foreground">กำลังดำเนินการ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-200 dark:bg-green-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.completedOrders || 0}</p>
                    <p className="text-xs text-muted-foreground">สำเร็จ</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-200 dark:bg-purple-800">
                    <RefreshCcw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.refundedOrders || 0}</p>
                    <p className="text-xs text-muted-foreground">คืนเงิน</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-200 dark:bg-red-800">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{dashboardData.failedOrders || 0}</p>
                    <p className="text-xs text-muted-foreground">ไม่สำเร็จ</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Cases */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">เคสล่าสุด</CardTitle>
              <Link href="/cases">
                <Button variant="ghost" size="sm" className="gap-1">
                  ดูทั้งหมด
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentCases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    ยังไม่มีเคส
                  </p>
                ) : (
                  dashboardData.recentCases.map((caseItem: RecentCase) => (
                    <Link
                      key={caseItem.id}
                      href={`/cases/${caseItem.id}`}
                      className="flex items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {caseItem.caseNumber}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              severityLabels[caseItem.severity]?.className
                            )}
                          >
                            {severityLabels[caseItem.severity]?.label}
                          </Badge>
                        </div>
                        <p className="font-medium">{caseItem.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {caseItem.customerName || "ไม่ระบุลูกค้า"}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            statusLabels[caseItem.status]?.className
                          )}
                        >
                          {statusLabels[caseItem.status]?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(caseItem.createdAt), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats / Alerts */}
          <div className="space-y-6">
            {/* Critical Alerts */}
            <Card className="border-red-200 dark:border-red-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-red-600 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  เคสวิกฤต ({dashboardData.criticalCases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.criticalCases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ไม่มีเคสวิกฤต 🎉
                    </p>
                  ) : (
                    dashboardData.criticalCases.map((caseItem: CriticalCase) => (
                      <Link
                        key={caseItem.id}
                        href={`/cases/${caseItem.id}`}
                        className="flex items-center justify-between rounded-lg bg-red-50 p-3 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium">{caseItem.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {caseItem.caseNumber}
                          </p>
                        </div>
                        {caseItem.slaDeadline && (
                          <Badge variant="destructive" className="text-xs">
                            SLA: {formatDistanceToNow(new Date(caseItem.slaDeadline), { locale: th })}
                          </Badge>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Provider Issues */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  Provider มีปัญหา
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.providersWithIssues.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ไม่มี Provider ที่มีปัญหา
                    </p>
                  ) : (
                    dashboardData.providersWithIssues.map((provider: ProviderWithIssues) => (
                      <div
                        key={provider.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              "h-2 w-2 rounded-full",
                              provider.riskLevel === "CRITICAL"
                                ? "bg-red-500"
                                : provider.riskLevel === "HIGH"
                                ? "bg-orange-500"
                                : provider.riskLevel === "MEDIUM"
                                ? "bg-amber-500"
                                : "bg-green-500"
                            )}
                          />
                          <span className="text-sm">{provider.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {provider._count.cases} เคส
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
