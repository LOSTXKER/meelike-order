"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  DollarSign,
  Package,
  Settings,
  Building2,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CaseType {
  id: string;
  name: string;
  category: string;
  defaultSeverity: string;
  defaultSlaMinutes: number;
  requireProvider: boolean;
  requireOrderId: boolean;
  lineNotification: boolean;
  description: string | null;
  isActive: boolean;
}

interface CaseTypeTableProps {
  caseTypes: CaseType[];
  onEdit: (caseType: CaseType) => void;
  onDelete: (caseType: CaseType) => void;
}

const categoryLabels: Record<string, { label: string; className: string; icon: typeof DollarSign }> = {
  PAYMENT: { label: "การชำระเงิน", className: "bg-green-500/10 text-green-600 dark:text-green-400", icon: DollarSign },
  ORDER: { label: "ออเดอร์", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Package },
  SYSTEM: { label: "ระบบ", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: Settings },
  PROVIDER: { label: "Provider", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: Building2 },
  OTHER: { label: "อื่นๆ", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: FileText },
};

const severityLabels: Record<string, string> = {
  CRITICAL: "วิกฤต",
  HIGH: "สูง",
  NORMAL: "ปกติ",
  LOW: "ต่ำ",
};

export function CaseTypeTable({ caseTypes, onEdit, onDelete }: CaseTypeTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ชื่อ</TableHead>
            <TableHead>หมวดหมู่</TableHead>
            <TableHead>ความรุนแรง</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>การแจ้งเตือน</TableHead>
            <TableHead>สถานะ</TableHead>
            <TableHead className="text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {caseTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                ไม่พบประเภทเคส
              </TableCell>
            </TableRow>
          )}
          {caseTypes.map((type) => {
            const categoryInfo = categoryLabels[type.category];
            const CategoryIcon = categoryInfo?.icon || FileText;

            return (
              <TableRow key={type.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{type.name}</div>
                    {type.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {type.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(categoryInfo?.className)}>
                    <CategoryIcon className="w-3 h-3 mr-1" />
                    {categoryInfo?.label || type.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {severityLabels[type.defaultSeverity] || type.defaultSeverity}
                  </Badge>
                </TableCell>
                <TableCell>
                  {type.defaultSlaMinutes < 60
                    ? `${type.defaultSlaMinutes} นาที`
                    : `${Math.floor(type.defaultSlaMinutes / 60)} ชม.`}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-xs">
                    {type.lineNotification && (
                      <Badge variant="secondary" className="w-fit">
                        Line
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {type.isActive ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs">ใช้งาน</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs">ปิด</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(type)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(type)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

