"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/ui/loading-screen";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, Clock, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface Provider {
  id: string;
  name: string;
  type: string;
  defaultSlaMinutes: number;
  contactChannel: string | null;
  notificationPreference: string | null;
  totalCases: number;
  resolvedCases: number;
  avgResolutionMinutes: number | null;
  refundRate: number | null;
  riskLevel: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    cases: number;
  };
}

interface Case {
  id: string;
  caseNumber: string;
  title: string;
  status: string;
  severity: string;
  createdAt: string;
}

const riskLabels: Record<string, { label: string; className: string }> = {
  LOW: { label: "ต่ำ", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  MEDIUM: { label: "ปานกลาง", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  HIGH: { label: "สูง", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  CRITICAL: { label: "วิกฤต", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
  // INVESTIGATING and FIXING merged as "กำลังดำเนินการ"
  INVESTIGATING: { label: "กำลังดำเนินการ", className: "bg-violet-500/10 text-violet-600 border-violet-200" },
  FIXING: { label: "กำลังดำเนินการ", className: "bg-violet-500/10 text-violet-600 border-violet-200" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-500/10 text-orange-600 border-orange-200" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-500/10 text-green-600 border-green-200" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-500/10 text-gray-600 border-gray-200" },
};

const severityLabels: Record<string, { label: string; className: string }> = {
  CRITICAL: { label: "วิกฤต", className: "text-red-600" },
  HIGH: { label: "สูง", className: "text-orange-600" },
  NORMAL: { label: "ปกติ", className: "text-blue-600" },
  LOW: { label: "ต่ำ", className: "text-gray-600" },
};

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [provider, setProvider] = useState<Provider | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProviderDetails();
  }, [id]);

  const fetchProviderDetails = async () => {
    try {
      // Fetch provider details
      const providerRes = await fetch(`/api/providers/${id}`);
      if (!providerRes.ok) throw new Error("Provider not found");
      const providerData = await providerRes.json();
      setProvider(providerData);

      // Fetch related cases
      const casesRes = await fetch(`/api/cases?providerId=${id}&limit=10`);
      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setCases(casesData.cases || []);
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen variant="pulse" />;
  }

  if (!provider) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">ไม่พบ Provider</p>
            <Link href="/providers">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolutionRate = provider.totalCases > 0
    ? Math.round((provider.resolvedCases / provider.totalCases) * 100)
    : 0;

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="p-6 space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Link href="/providers">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-semibold">{provider.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{provider.type}</Badge>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", riskLabels[provider.riskLevel]?.className)}
                  >
                    {riskLabels[provider.riskLevel]?.label}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      provider.isActive ? "bg-green-500" : "bg-gray-400"
                    )} />
                    <span className="text-sm text-muted-foreground">
                      {provider.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                เคสทั้งหมด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{provider.totalCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                ตั้งแต่เริ่มใช้งาน
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                แก้ไขแล้ว
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-3xl font-bold">{provider.resolvedCases}</span>
              </div>
              <p className="text-xs text-green-500 mt-1">
                {resolutionRate}% ของทั้งหมด
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
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="text-3xl font-bold">
                  {provider.avgResolutionMinutes 
                    ? Math.round(provider.avgResolutionMinutes) 
                    : "—"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">นาที</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Refund Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className={cn(
                  "h-5 w-5",
                  !provider.refundRate || provider.refundRate <= 3 
                    ? "text-green-500" 
                    : provider.refundRate <= 5 
                    ? "text-amber-500" 
                    : "text-red-500"
                )} />
                <span className={cn(
                  "text-3xl font-bold",
                  !provider.refundRate || provider.refundRate <= 3 
                    ? "text-green-500" 
                    : provider.refundRate <= 5 
                    ? "text-amber-500" 
                    : "text-red-500"
                )}>
                  {provider.refundRate !== null ? provider.refundRate.toFixed(1) : "—"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">%</p>
            </CardContent>
          </Card>
        </div>

        {/* Details & Cases */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Provider Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ข้อมูล Provider</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">ประเภท</p>
                  <p className="mt-1">{provider.type}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">SLA เริ่มต้น</p>
                  <p className="mt-1">{provider.defaultSlaMinutes} นาที</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">ช่องทางติดต่อ</p>
                  <p className="mt-1">{provider.contactChannel || "—"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">การแจ้งเตือน</p>
                  <p className="mt-1">{provider.notificationPreference || "—"}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">สร้างเมื่อ</p>
                  <p className="mt-1 text-sm">
                    {formatDistanceToNow(new Date(provider.createdAt), { 
                      addSuffix: true, 
                      locale: th 
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Related Cases */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">เคสที่เกี่ยวข้อง</CardTitle>
                <Link href={`/cases?providerId=${provider.id}`}>
                  <Button variant="ghost" size="sm">
                    ดูทั้งหมด →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {cases.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    ยังไม่มีเคส
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>เลขเคส</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                        <TableHead>ความรุนแรง</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>สร้างเมื่อ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cases.map((caseItem) => (
                        <TableRow key={caseItem.id}>
                          <TableCell className="font-mono text-sm">
                            <Link 
                              href={`/cases/${caseItem.id}`}
                              className="hover:underline"
                            >
                              {caseItem.caseNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{caseItem.title}</TableCell>
                          <TableCell>
                            <span className={cn(
                              "text-sm font-medium",
                              severityLabels[caseItem.severity]?.className
                            )}>
                              {severityLabels[caseItem.severity]?.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn("text-xs", statusLabels[caseItem.status]?.className)}
                            >
                              {statusLabels[caseItem.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(caseItem.createdAt), { 
                              addSuffix: true, 
                              locale: th 
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

