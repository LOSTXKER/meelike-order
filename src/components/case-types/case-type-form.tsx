"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

interface CaseTypeFormProps {
  caseType?: CaseType | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CaseTypeForm({ caseType, onSuccess, onCancel }: CaseTypeFormProps) {
  const [formData, setFormData] = useState({
    name: caseType?.name || "",
    category: caseType?.category || "OTHER",
    defaultSeverity: caseType?.defaultSeverity || "NORMAL",
    defaultSlaMinutes: caseType?.defaultSlaMinutes?.toString() || "60",
    requireProvider: caseType?.requireProvider || false,
    requireOrderId: caseType?.requireOrderId || false,
    lineNotification: caseType?.lineNotification || false,
    description: caseType?.description || "",
    isActive: caseType?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = caseType
        ? `/api/case-types/${caseType.id}`
        : "/api/case-types";
      const method = caseType ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          defaultSlaMinutes: parseInt(formData.defaultSlaMinutes),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save case type");
      }

      toast.success(
        caseType
          ? "อัปเดตประเภทเคสสำเร็จ"
          : "สร้างประเภทเคสใหม่สำเร็จ"
      );
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving case type:", error);
      toast.error(error.message || "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อประเภทเคส *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="เช่น ปัญหาการชำระเงิน"
          required
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">หมวดหมู่ *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => setFormData({ ...formData, category: value })}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PAYMENT">การชำระเงิน</SelectItem>
            <SelectItem value="ORDER">ออเดอร์</SelectItem>
            <SelectItem value="SYSTEM">ระบบ</SelectItem>
            <SelectItem value="PROVIDER">Provider</SelectItem>
            <SelectItem value="OTHER">อื่นๆ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Default Severity */}
      <div className="space-y-2">
        <Label htmlFor="severity">ความรุนแรงเริ่มต้น *</Label>
        <Select
          value={formData.defaultSeverity}
          onValueChange={(value) =>
            setFormData({ ...formData, defaultSeverity: value })
          }
        >
          <SelectTrigger id="severity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CRITICAL">วิกฤต</SelectItem>
            <SelectItem value="HIGH">สูง</SelectItem>
            <SelectItem value="NORMAL">ปกติ</SelectItem>
            <SelectItem value="LOW">ต่ำ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* SLA */}
      <div className="space-y-2">
        <Label htmlFor="sla">SLA (นาที) *</Label>
        <Input
          id="sla"
          type="number"
          min="5"
          value={formData.defaultSlaMinutes}
          onChange={(e) =>
            setFormData({ ...formData, defaultSlaMinutes: e.target.value })
          }
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">คำอธิบาย</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="รายละเอียดเพิ่มเติม"
          rows={3}
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requireProvider"
            checked={formData.requireProvider}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, requireProvider: checked as boolean })
            }
          />
          <Label htmlFor="requireProvider" className="font-normal cursor-pointer">
            ต้องระบุ Provider
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="requireOrderId"
            checked={formData.requireOrderId}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, requireOrderId: checked as boolean })
            }
          />
          <Label htmlFor="requireOrderId" className="font-normal cursor-pointer">
            ต้องระบุเลขออเดอร์
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="lineNotification"
            checked={formData.lineNotification}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, lineNotification: checked as boolean })
            }
          />
          <Label htmlFor="lineNotification" className="font-normal cursor-pointer">
            ส่งการแจ้งเตือน Line
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, isActive: checked as boolean })
            }
          />
          <Label htmlFor="isActive" className="font-normal cursor-pointer">
            เปิดใช้งาน
          </Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "กำลังบันทึก..." : caseType ? "อัปเดต" : "สร้าง"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>
        )}
      </div>
    </form>
  );
}

