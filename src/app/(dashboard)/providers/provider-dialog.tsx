"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Provider {
  id?: string;
  name: string;
  type: string;
  defaultSlaMinutes: number;
  contactChannel: string | null;
  notificationPreference: string | null;
  riskLevel: string;
  isActive: boolean;
}

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: Provider | null;
  onSuccess: () => void;
}

export function ProviderDialog({
  open,
  onOpenChange,
  provider,
  onSuccess,
}: ProviderDialogProps) {
  const [formData, setFormData] = useState<Provider>({
    name: provider?.name || "",
    type: provider?.type || "API",
    defaultSlaMinutes: provider?.defaultSlaMinutes || 60,
    contactChannel: provider?.contactChannel || null,
    notificationPreference: provider?.notificationPreference || null,
    riskLevel: provider?.riskLevel || "LOW",
    isActive: provider?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = provider?.id
        ? `/api/providers/${provider.id}`
        : "/api/providers";
      const method = provider?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save provider");

      toast.success(provider?.id ? "อัปเดต Provider สำเร็จ" : "สร้าง Provider สำเร็จ");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving provider:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {provider?.id ? "แก้ไข Provider" : "เพิ่ม Provider"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อ Provider *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">ประเภท</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="API">API</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="WEBHOOK">Webhook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultSlaMinutes">SLA เริ่มต้น (นาที)</Label>
            <Input
              id="defaultSlaMinutes"
              type="number"
              value={formData.defaultSlaMinutes}
              onChange={(e) =>
                setFormData({ ...formData, defaultSlaMinutes: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactChannel">ช่องทางติดต่อ</Label>
            <Input
              id="contactChannel"
              value={formData.contactChannel || ""}
              onChange={(e) =>
                setFormData({ ...formData, contactChannel: e.target.value || null })
              }
              placeholder="Line, Email, Phone, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notificationPreference">การแจ้งเตือน</Label>
            <Select
              value={formData.notificationPreference || "EMAIL"}
              onValueChange={(value) =>
                setFormData({ ...formData, notificationPreference: value })
              }
            >
              <SelectTrigger id="notificationPreference">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="LINE">Line</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="NONE">ไม่แจ้งเตือน</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskLevel">ระดับความเสี่ยง</Label>
            <Select
              value={formData.riskLevel}
              onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}
            >
              <SelectTrigger id="riskLevel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">ต่ำ</SelectItem>
                <SelectItem value="MEDIUM">ปานกลาง</SelectItem>
                <SelectItem value="HIGH">สูง</SelectItem>
                <SelectItem value="CRITICAL">วิกฤต</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">เปิดใช้งาน</Label>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


