"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  Clock, AlertCircle, AlertTriangle, CheckCircle2, Info, 
  ChevronRight, MoreHorizontal, User, Calendar 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { th } from "date-fns/locale";

interface CaseItem {
  id: string;
  caseNumber: string;
  title: string;
  customerName: string | null;
  severity: string;
  status: string;
  slaDeadline: Date | string | null;
  createdAt: Date | string;
  caseType: { name: string };
  owner: { name: string | null } | null;
  provider: { name: string | null } | null;
}

interface CaseCardProps {
  case: CaseItem;
  onDelete: (caseId: string) => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  NEW: { label: "ใหม่", className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  INVESTIGATING: { label: "กำลังดำเนินการ", className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800" },
  FIXING: { label: "กำลังดำเนินการ", className: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800" },
  WAITING_CUSTOMER: { label: "รอลูกค้า", className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  WAITING_PROVIDER: { label: "รอ Provider", className: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" },
  RESOLVED: { label: "แก้ไขแล้ว", className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  CLOSED: { label: "ปิดเคส", className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
};

const severityLabels: Record<string, { label: string; icon: any; color: string }> = {
  CRITICAL: { label: "วิกฤต", icon: AlertCircle, color: "text-red-600 dark:text-red-400" },
  HIGH: { label: "สูง", icon: AlertTriangle, color: "text-orange-600 dark:text-orange-400" },
  NORMAL: { label: "ปกติ", icon: Info, color: "text-blue-600 dark:text-blue-400" },
  LOW: { label: "ต่ำ", icon: CheckCircle2, color: "text-gray-500" },
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

export function CaseCard({ case: caseItem, onDelete }: CaseCardProps) {
  const statusInfo = statusLabels[caseItem.status] || statusLabels.NEW;
  const severityInfo = severityLabels[caseItem.severity] || severityLabels.NORMAL;
  const SeverityIcon = severityInfo.icon;
  const sla = formatSlaRemaining(caseItem.slaDeadline);

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <Link href={`/cases/${caseItem.id}`}>
                <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary">
                  {caseItem.title}
                </h3>
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                #{caseItem.caseNumber}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/cases/${caseItem.id}`}>ดูรายละเอียด</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(caseItem.id)} className="text-destructive">
                  ลบเคส
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={statusInfo.className}>
              {statusInfo.label}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <SeverityIcon className={cn("h-3 w-3", severityInfo.color)} />
              <span className={severityInfo.color}>{severityInfo.label}</span>
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{caseItem.owner?.name || "ยังไม่มอบหมาย"}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {formatDistanceToNow(new Date(caseItem.createdAt), { 
                  addSuffix: true, 
                  locale: th 
                })}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className={cn(
                "h-3.5 w-3.5 shrink-0",
                sla.isMissed ? "text-red-600" : sla.isUrgent ? "text-orange-600" : "text-muted-foreground"
              )} />
              <span className={cn(
                "text-xs truncate",
                sla.isMissed ? "text-red-600 font-medium" : sla.isUrgent ? "text-orange-600 font-medium" : ""
              )}>
                {sla.text}
              </span>
            </div>

            <div className="text-muted-foreground truncate">
              {caseItem.caseType.name}
            </div>
          </div>

          {/* Customer */}
          {caseItem.customerName && (
            <div className="text-xs text-muted-foreground border-t pt-2">
              ลูกค้า: <span className="text-foreground">{caseItem.customerName}</span>
            </div>
          )}

          {/* Action Button */}
          <Link href={`/cases/${caseItem.id}`} className="block">
            <Button variant="outline" size="sm" className="w-full gap-2">
              ดูรายละเอียด
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

