import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  Inbox,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface RecentCase {
  id: string;
  caseNumber: string;
  title: string;
  customerName: string | null;
  severity: string;
  status: string;
  createdAt: Date;
  caseType: { name: string };
  owner: { name: string | null } | null;
}

interface CriticalCase {
  id: string;
  caseNumber: string;
  title: string;
  slaDeadline: Date | null;
}

interface ProviderWithIssues {
  id: string;
  name: string;
  riskLevel: string | null;
  _count: { cases: number };
}

interface Stat {
  title: string;
  value: string;
  icon: typeof Inbox;
  color: string;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  INVESTIGATING: { label: "กำลังตรวจสอบ", className: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  FIXING: { label: "กำลังแก้ไข", className: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-500/10 text-green-500 border-green-500/20" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

const severityLabels: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "วิกฤต", className: "bg-red-500/10 text-red-500 border-red-500/20" },
  HIGH: { label: "สูง", className: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  NORMAL: { label: "ปกติ", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  LOW: { label: "ต่ำ", className: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
};

async function getDashboardData() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [
    totalCases,
    newCases,
    inProgressCases,
    resolvedToday,
    slaMissed,
    recentCases,
    criticalCases,
    providersWithIssues,
  ] = await Promise.all([
    prisma.case.count(),
    prisma.case.count({ where: { status: "NEW" } }),
    prisma.case.count({
      where: {
        status: { in: ["INVESTIGATING", "WAITING_CUSTOMER", "WAITING_PROVIDER", "FIXING"] },
      },
    }),
    prisma.case.count({
      where: { resolvedAt: { gte: todayStart } },
    }),
    prisma.case.count({
      where: {
        slaMissed: true,
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
    }),
    prisma.case.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        caseType: { select: { name: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.case.findMany({
      where: {
        severity: "CRITICAL",
        status: { notIn: ["RESOLVED", "CLOSED"] },
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    }),
    prisma.provider.findMany({
      where: {
        cases: {
          some: {
            status: { notIn: ["RESOLVED", "CLOSED"] },
          },
        },
      },
      select: {
        id: true,
        name: true,
        riskLevel: true,
        _count: {
          select: {
            cases: {
              where: {
                status: { notIn: ["RESOLVED", "CLOSED"] },
              },
            },
          },
        },
      },
      orderBy: {
        cases: { _count: "desc" },
      },
      take: 5,
    }),
  ]);

  return {
    totalCases,
    newCases,
    inProgressCases,
    resolvedToday,
    slaMissed,
    recentCases,
    criticalCases,
    providersWithIssues,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const data = await getDashboardData();

  const stats = [
    {
      title: "เคสทั้งหมด",
      value: data.totalCases.toString(),
      icon: Inbox,
      color: "text-primary",
    },
    {
      title: "กำลังดำเนินการ",
      value: data.inProgressCases.toString(),
      icon: Clock,
      color: "text-amber-500",
    },
    {
      title: "แก้ไขแล้ววันนี้",
      value: data.resolvedToday.toString(),
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      title: "SLA เกินกำหนด",
      value: data.slaMissed.toString(),
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
              สวัสดี, {user?.name || "User"} 👋
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

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat: Stat) => (
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
                {data.recentCases.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    ยังไม่มีเคส
                  </p>
                ) : (
                  data.recentCases.map((caseItem: RecentCase) => (
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
                          {formatDistanceToNow(caseItem.createdAt, {
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
                  เคสวิกฤต ({data.criticalCases.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.criticalCases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ไม่มีเคสวิกฤต 🎉
                    </p>
                  ) : (
                    data.criticalCases.map((caseItem: CriticalCase) => (
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
                            SLA: {formatDistanceToNow(caseItem.slaDeadline, { locale: th })}
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
                  {data.providersWithIssues.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      ไม่มี Provider ที่มีปัญหา
                    </p>
                  ) : (
                    data.providersWithIssues.map((provider: ProviderWithIssues) => (
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
