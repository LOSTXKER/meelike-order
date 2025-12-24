import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import prisma from "@/lib/prisma";
import Link from "next/link";

interface Provider {
  id: string;
  name: string;
  type: string;
  totalCases: number;
  resolvedCases: number;
  avgResolutionMinutes: number | null;
  refundRate: number | null;
  riskLevel: string;
  isActive: boolean;
}

const riskLabels: Record<string, { label: string; className: string }> = {
  LOW: { label: "ต่ำ", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  MEDIUM: { label: "ปานกลาง", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  HIGH: { label: "สูง", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  CRITICAL: { label: "วิกฤต", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

async function getProvidersData() {
  const providers = await prisma.provider.findMany({
    orderBy: [
      { riskLevel: "desc" },
      { name: "asc" },
    ],
  });

  return providers;
}

export default async function ProvidersPage() {
  const providers = await getProvidersData();

  // Calculate summary stats
  const totalCases = providers.reduce((sum: number, p: Provider) => sum + p.totalCases, 0);
  const avgResolution = totalCases > 0 
    ? Math.round(
        providers.reduce((sum: number, p: Provider) => sum + (p.avgResolutionMinutes || 0) * p.totalCases, 0) / totalCases
      )
    : 0;
  const highRiskCount = providers.filter(
    (p: Provider) => p.riskLevel === "HIGH" || p.riskLevel === "CRITICAL"
  ).length;

  return (
    <div className="min-h-screen">
      <Header title="Providers" />
      
      <div className="p-6 space-y-6">
        {/* Header with Refresh */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ภาพรวม Provider</h2>
          <RefreshButton invalidateKeys={["providers"]} />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                จำนวน Provider
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{providers.length}</div>
              <p className="text-xs text-muted-foreground">
                Active: {providers.filter((p: Provider) => p.isActive).length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                เคสทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCases}</div>
              <p className="text-xs text-green-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                ตั้งแต่เริ่มใช้งาน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                เวลาแก้ไขเฉลี่ย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgResolution} นาที</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                เฉลี่ยทุก Provider
              </p>
            </CardContent>
          </Card>

          <Card className={cn(highRiskCount > 0 && "border-red-200 dark:border-red-900")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                ความเสี่ยงสูง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{highRiskCount}</div>
              <p className="text-xs text-muted-foreground">
                ต้องติดตามใกล้ชิด
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Provider Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Provider</TableHead>
                <TableHead className="w-[100px]">ประเภท</TableHead>
                <TableHead className="w-[100px] text-right">เคสทั้งหมด</TableHead>
                <TableHead className="w-[120px] text-right">แก้ไขแล้ว</TableHead>
                <TableHead className="w-[120px] text-right">เวลาเฉลี่ย</TableHead>
                <TableHead className="w-[100px] text-right">Refund Rate</TableHead>
                <TableHead className="w-[100px]">ความเสี่ยง</TableHead>
                <TableHead className="w-[80px]">สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    ไม่พบ Provider
                  </TableCell>
                </TableRow>
              ) : (
                providers.map((provider: Provider) => (
                  <TableRow key={provider.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/providers/${provider.id}`} className="hover:underline">
                        {provider.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {provider.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{provider.totalCases}</TableCell>
                    <TableCell className="text-right">
                      {provider.resolvedCases}
                      {provider.totalCases > 0 && (
                        <span className="text-muted-foreground ml-1">
                          ({Math.round((provider.resolvedCases / provider.totalCases) * 100)}%)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {provider.avgResolutionMinutes ? `${Math.round(provider.avgResolutionMinutes)} นาที` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {provider.refundRate !== null ? (
                        <span className={cn(
                          provider.refundRate > 5 && "text-red-500",
                          provider.refundRate > 3 && provider.refundRate <= 5 && "text-amber-500"
                        )}>
                          {provider.refundRate.toFixed(1)}%
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", riskLabels[provider.riskLevel]?.className)}
                      >
                        {riskLabels[provider.riskLevel]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          provider.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-xs text-muted-foreground">
                          {provider.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
