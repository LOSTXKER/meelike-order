"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CheckSquare, MoreVertical, UserPlus, XCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  totalCount: number;
}

export function BulkActions({
  selectedIds,
  onSelectionChange,
  totalCount,
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBulkAssign = async () => {
    // TODO: Implement assign dialog
    toast.info("กำลังพัฒนา: เลือกผู้รับผิดชอบ");
  };

  const handleBulkClose = async () => {
    if (!confirm(`ต้องการปิดเคส ${selectedIds.length} รายการหรือไม่?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/cases/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseIds: selectedIds,
          action: "close",
        }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success(`ปิดเคสสำเร็จ ${selectedIds.length} รายการ`);
      onSelectionChange([]);
      // Refresh page
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถปิดเคสได้");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkResolve = async () => {
    if (!confirm(`ต้องการแก้ไขเคส ${selectedIds.length} รายการหรือไม่?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/cases/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseIds: selectedIds,
          action: "resolve",
        }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success(`แก้ไขเคสสำเร็จ ${selectedIds.length} รายการ`);
      onSelectionChange([]);
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถแก้ไขเคสได้");
    } finally {
      setIsProcessing(false);
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <CheckSquare className="h-5 w-5 text-primary" />
      <span className="font-medium">
        เลือกแล้ว {selectedIds.length} จาก {totalCount} รายการ
      </span>

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" size="sm" disabled={isProcessing}>
            <MoreVertical className="h-4 w-4 mr-2" />
            จัดการ
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleBulkAssign}>
            <UserPlus className="h-4 w-4 mr-2" />
            มอบหมายเคส
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleBulkResolve}>
            <CheckCircle className="h-4 w-4 mr-2" />
            ทำเครื่องหมายว่าแก้ไขแล้ว
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBulkClose} className="text-red-600">
            <XCircle className="h-4 w-4 mr-2" />
            ปิดเคส
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onSelectionChange([])}
      >
        ยกเลิก
      </Button>
    </div>
  );
}

