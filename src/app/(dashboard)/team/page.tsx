"use client";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  totalCases: number;
  resolvedCases: number;
  casesThisMonth: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

const roleLabels: Record<string, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
  MANAGER: { label: "Manager", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  SUPPORT: { label: "Support", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  CEO: { label: "CEO", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
};

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((d) => {
        setTeam(d);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="ทีมงาน" />
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  const activeMembers = team.filter((m) => m.isActive).length;
  const totalCasesHandled = team.reduce((sum, m) => sum + m.totalCases, 0);
  const avgTeamResolution = team.length > 0
    ? Math.round(
        team.reduce((sum, m) => sum + m.avgResolutionTime, 0) / team.length
      )
    : 0;
  const avgResolutionRate = team.length > 0
    ? Math.round(
        team.reduce((sum, m) => sum + m.resolutionRate, 0) / team.length
      )
    : 0;

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen">
      <Header title="ทีมงาน" />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                จำนวนสมาชิก
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{team.length}</div>
              <p className="text-xs text-muted-foreground">
                Active: {activeMembers}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                เคสที่จัดการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCasesHandled}</div>
              <p className="text-xs text-muted-foreground">ทั้งหมด</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                เวลาเฉลี่ยทีม
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgTeamResolution}</div>
              <p className="text-xs text-muted-foreground">นาที/เคส</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                อัตราแก้ไขเฉลี่ย
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgResolutionRate}%</div>
              <p className={cn(
                "text-xs",
                avgResolutionRate >= 80 ? "text-green-500" : "text-amber-500"
              )}>
                {avgResolutionRate >= 80 ? "ดีมาก" : "พอใช้"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        <div className="grid gap-6 lg:grid-cols-3">
          {team.slice(0, 3).map((member, index) => (
            <Card key={member.id} className={cn(
              index === 0 && "border-amber-200 dark:border-amber-900"
            )}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  {index === 0 && (
                    <div className="text-2xl">🏆</div>
                  )}
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="text-lg">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{member.name || "Unknown"}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-xs mt-1", roleLabels[member.role]?.className)}
                    >
                      {roleLabels[member.role]?.label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">เคสทั้งหมด</span>
                  <span className="font-semibold">{member.totalCases}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">เดือนนี้</span>
                  <span className="font-semibold">{member.casesThisMonth}</span>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">อัตราแก้ไข</span>
                    <span className="font-semibold">{member.resolutionRate}%</span>
                  </div>
                  <Progress value={member.resolutionRate} className="h-2" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">เวลาเฉลี่ย</span>
                  <span className="font-semibold">{member.avgResolutionTime} นาที</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Team Table */}
        <Card>
          <CardHeader>
            <CardTitle>สมาชิกทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>สมาชิก</TableHead>
                  <TableHead className="w-[100px]">บทบาท</TableHead>
                  <TableHead className="w-[100px] text-right">เคสทั้งหมด</TableHead>
                  <TableHead className="w-[100px] text-right">แก้ไขแล้ว</TableHead>
                  <TableHead className="w-[100px] text-right">เดือนนี้</TableHead>
                  <TableHead className="w-[120px]">อัตราแก้ไข</TableHead>
                  <TableHead className="w-[100px] text-right">เวลาเฉลี่ย</TableHead>
                  <TableHead className="w-[80px]">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {team.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", roleLabels[member.role]?.className)}
                      >
                        {roleLabels[member.role]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{member.totalCases}</TableCell>
                    <TableCell className="text-right">{member.resolvedCases}</TableCell>
                    <TableCell className="text-right">{member.casesThisMonth}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress value={member.resolutionRate} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-right">
                          {member.resolutionRate}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{member.avgResolutionTime} นาที</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          member.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-xs text-muted-foreground">
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
