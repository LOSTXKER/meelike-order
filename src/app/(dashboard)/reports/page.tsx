"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Clock, CheckCircle2, RefreshCw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReports } from "@/hooks/use-reports";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { toast } from "sonner";

const COLORS = {
  primary: "#2563eb",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: COLORS.primary,
  INVESTIGATING: COLORS.purple,
  WAITING_CUSTOMER: COLORS.warning,
  WAITING_PROVIDER: "#f97316",
  FIXING: COLORS.cyan,
  RESOLVED: COLORS.success,
  CLOSED: "#6b7280",
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: COLORS.danger,
  HIGH: "#f97316",
  NORMAL: COLORS.primary,
  LOW: "#6b7280",
};

export default function ReportsPage() {
  const { data, isLoading, refetch, isFetching } = useReports();

  const exportToCSV = () => {
    if (!data) return;

    try {
      // Prepare CSV data
      const csvData = [];
      
      // Header
      csvData.push(["Meelike Reports Export", new Date().toISOString()]);
      csvData.push([]);
      
      // Summary Stats
      csvData.push(["สรุปภาพรวม"]);
      csvData.push(["เวลาแก้ไขเฉลี่ย", `${data.avgResolutionTime} นาที`]);
      csvData.push(["SLA Compliance", `${data.slaCompliance}%`]);
      csvData.push(["Growth", `${data.growth}%`]);
      csvData.push([]);
      
      // Monthly Trend
      csvData.push(["แนวโน้มรายเดือน"]);
      csvData.push(["เดือน", "ทั้งหมด", "แก้ไขแล้ว"]);
      data.monthlyTrend.forEach((item: { month: string; total: number; resolved: number }) => {
        csvData.push([item.month, item.total, item.resolved]);
      });
      csvData.push([]);
      
      // Cases by Status
      csvData.push(["จำนวนเคสตามสถานะ"]);
      csvData.push(["สถานะ", "จำนวน"]);
      Object.entries(data.casesByStatus).forEach(([status, count]) => {
        csvData.push([status, count]);
      });
      csvData.push([]);
      
      // Cases by Severity
      csvData.push(["จำนวนเคสตามความรุนแรง"]);
      csvData.push(["ความรุนแรง", "จำนวน"]);
      Object.entries(data.casesBySeverity).forEach(([severity, count]) => {
        csvData.push([severity, count]);
      });
      csvData.push([]);
      
      // Top Providers
      csvData.push(["Top Providers"]);
      csvData.push(["Provider", "เคสทั้งหมด", "แก้ไขแล้ว", "% แก้ไข"]);
      data.topProviders.forEach((provider: { name: string; totalCases: number; resolvedCases: number }) => {
        const resolvedPct = provider.totalCases > 0 
          ? ((provider.resolvedCases / provider.totalCases) * 100).toFixed(1) 
          : "0";
        csvData.push([provider.name, provider.totalCases, provider.resolvedCases, `${resolvedPct}%`]);
      });
      
      // Convert to CSV string
      const csvString = csvData.map(row => row.join(",")).join("\n");
      
      // Create blob and download
      const blob = new Blob(["\ufeff" + csvString], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `meelike-reports-${new Date().toISOString().split("T")[0]}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("ส่งออกรายงานสำเร็จ");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออก");
    }
  };

  if (isLoading) {
    return <LoadingScreen title="กำลังโหลดรายงาน" variant="default" />;
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <Header title="รายงานและสถิติ" />
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">ไม่พบข้อมูล</p>
        </div>
      </div>
    );
  }

  const statusData = Object.entries(data.casesByStatus).map(([name, value]) => ({
    name,
    value,
  }));

  const severityData = Object.entries(data.casesBySeverity).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="min-h-screen">
      <Header title="รายงานและสถิติ" />

      <div className="p-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isFetching && "animate-spin")} />
            {isFetching ? "กำลังโหลด..." : "รีเฟรช"}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                เวลาแก้ไขเฉลี่ย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">{data.avgResolutionTime}</span>
                <span className="text-muted-foreground">นาที</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                SLA Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">{data.slaCompliance}%</span>
              </div>
              <p className={cn(
                "text-xs mt-1",
                data.slaCompliance >= 95 ? "text-green-500" : "text-amber-500"
              )}>
                {data.slaCompliance >= 95 ? "เป้าหมายบรรลุ" : "ต่ำกว่าเป้าหมาย (95%)"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                เคสเดือนนี้
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.monthlyTrend[data.monthlyTrend.length - 1]?.total || 0}
              </div>
              <p className={cn(
                "text-xs mt-1 flex items-center gap-1",
                data.growth >= 0 ? "text-green-500" : "text-red-500"
              )}>
                {data.growth >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {data.growth >= 0 ? "+" : ""}{data.growth}% จากเดือนก่อน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                อัตราแก้ไขสำเร็จ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {data.monthlyTrend[data.monthlyTrend.length - 1]?.total > 0
                  ? Math.round(
                      (data.monthlyTrend[data.monthlyTrend.length - 1].resolved /
                        data.monthlyTrend[data.monthlyTrend.length - 1].total) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground mt-1">เดือนนี้</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>แนวโน้มรายเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="เคสทั้งหมด"
                    dot={{ fill: COLORS.primary }}
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="แก้ไขแล้ว"
                    dot={{ fill: COLORS.success }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cases by Status */}
          <Card>
            <CardHeader>
              <CardTitle>สถานะเคส</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.name] || COLORS.primary}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Case Types */}
          <Card>
            <CardHeader>
              <CardTitle>ประเภทเคส Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.casesByCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} angle={-45} textAnchor="end" height={100} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill={COLORS.primary} name="จำนวนเคส" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cases by Severity */}
          <Card>
            <CardHeader>
              <CardTitle>ความรุนแรง</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={severityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#6b7280" fontSize={12} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value" name="จำนวนเคส" radius={[0, 8, 8, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.name] || COLORS.primary}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Providers */}
          <Card>
            <CardHeader>
              <CardTitle>Provider อันดับต้น</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topProviders.map((provider, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.resolvedCases}/{provider.totalCases} แก้ไขแล้ว
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{provider.totalCases} เคส</p>
                      {provider.refundRate !== null && (
                        <p className={cn(
                          "text-sm",
                          provider.refundRate > 5 ? "text-red-500" : "text-green-500"
                        )}>
                          Refund: {provider.refundRate.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>ประสิทธิภาพทีม (เดือนนี้)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.teamPerformance.slice(0, 5).map((member, index) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{member.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{member.casesThisMonth} เคส</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
