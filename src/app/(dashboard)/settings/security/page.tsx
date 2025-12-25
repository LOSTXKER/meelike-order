"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, Key, Shield, AlertTriangle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";

export default function SecurityPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">ความปลอดภัย</h1>
        <p className="text-sm text-muted-foreground">จัดการรหัสผ่านและความปลอดภัยของบัญชี</p>
      </div>

      {/* Warning Banner */}
      <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">ข้อควรระวัง</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>รหัสผ่านควรมีความยาวอย่างน้อย 8 ตัวอักษร</li>
              <li>ควรประกอบด้วยตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ</li>
              <li>อย่าใช้รหัสผ่านเดียวกันกับบัญชีอื่น</li>
              <li>เปลี่ยนรหัสผ่านเป็นประจำทุก 3-6 เดือน</li>
            </ul>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
            </div>
            <CardDescription>
              อัพเดทรหัสผ่านของคุณเพื่อความปลอดภัย
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.currentPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, currentPassword: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.newPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newPassword: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle>การจัดการ Session</CardTitle>
            <CardDescription>
              ข้อมูลเกี่ยวกับการเข้าสู่ระบบของคุณ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">Session ปัจจุบัน</div>
                <div className="text-sm text-muted-foreground">
                  {session?.user?.email}
                </div>
              </div>
              <Badge>Active</Badge>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>Session จะหมดอายุอัตโนมัติหลังจาก 30 วัน</p>
            </div>
          </CardContent>
        </Card>

        {/* Future Features */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">ฟีเจอร์ที่กำลังจะมา</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                Two-Factor Authentication (2FA)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                ประวัติการเข้าสู่ระบบ
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                จัดการอุปกรณ์ที่เชื่อมต่อ
              </li>
            </ul>
          </CardContent>
        </Card>
    </div>
  );
}

