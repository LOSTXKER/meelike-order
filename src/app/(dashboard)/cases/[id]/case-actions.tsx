"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface CaseActionsProps {
  caseId: string;
  currentStatus: string;
}

export function CaseActions({ caseId, currentStatus }: CaseActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState(currentStatus);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("อัพเดทสถานะเรียบร้อย");
      
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("ไม่สามารถอัพเดทสถานะได้");
      setStatus(currentStatus);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={status}
        onValueChange={handleStatusChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="เปลี่ยนสถานะ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="NEW">ใหม่</SelectItem>
          <SelectItem value="INVESTIGATING">กำลังตรวจสอบ</SelectItem>
          <SelectItem value="WAITING_CUSTOMER">รอลูกค้า</SelectItem>
          <SelectItem value="WAITING_PROVIDER">รอ Provider</SelectItem>
          <SelectItem value="FIXING">กำลังแก้ไข</SelectItem>
          <SelectItem value="RESOLVED">แก้ไขแล้ว</SelectItem>
          <SelectItem value="CLOSED">ปิดเคส</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

