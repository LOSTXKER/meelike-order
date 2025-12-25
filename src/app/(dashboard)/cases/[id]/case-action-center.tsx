"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Clock,
  UserX,
  HourglassIcon,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTeam } from "@/hooks";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderId: string;
  status: string;
}

interface CaseActionCenterProps {
  caseId: string;
  currentStatus: string;
  owner: {
    id: string;
    name: string | null;
    role: string;
  } | null;
  orders?: Order[];
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SUPPORT: "Support",
  VIEWER: "Viewer",
};

// Status flow configuration
const STATUS_FLOW: Record<string, { next?: string; prev?: string; nextLabel?: string; prevLabel?: string }> = {
  NEW: { 
    next: "INVESTIGATING",
    nextLabel: "เริ่มตรวจสอบ",
  },
  INVESTIGATING: { 
    next: "FIXING", 
    prev: "NEW",
    nextLabel: "เริ่มแก้ไข",
    prevLabel: "กลับเป็นใหม่",
  },
  WAITING_CUSTOMER: { 
    next: "FIXING", 
    prev: "INVESTIGATING",
    nextLabel: "เริ่มแก้ไข",
    prevLabel: "กลับตรวจสอบ",
  },
  WAITING_PROVIDER: { 
    next: "FIXING", 
    prev: "INVESTIGATING",
    nextLabel: "เริ่มแก้ไข",
    prevLabel: "กลับตรวจสอบ",
  },
  FIXING: { 
    next: "RESOLVED", 
    prev: "INVESTIGATING",
    nextLabel: "แก้ไขเสร็จ",
    prevLabel: "กลับตรวจสอบ",
  },
  RESOLVED: { 
    next: "CLOSED", 
    prev: "FIXING",
    nextLabel: "ปิดเคส",
    prevLabel: "กลับแก้ไข",
  },
  CLOSED: { 
    prev: "RESOLVED",
    prevLabel: "เปิดเคสใหม่",
  },
};

export function CaseActionCenter({ caseId, currentStatus, owner, orders = [] }: CaseActionCenterProps) {
  const queryClient = useQueryClient();
  const { data: teamMembers } = useTeam();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const currentFlow = STATUS_FLOW[currentStatus];

  // Smart Alerts - Show only important warnings (no duplicate CTAs)
  const getAlerts = () => {
    const alerts: Array<{ type: "warning" | "success" | "info"; message: string }> = [];

    // No owner assigned - important warning
    if (!owner) {
      alerts.push({
        type: "warning",
        message: "⚠️ ยังไม่มีผู้รับผิดชอบ",
      });
    }

    // All orders are handled - success info
    if (orders.length > 0 && !orders.some(o => o.status === "PENDING" || o.status === "PROCESSING")) {
      if (currentStatus !== "RESOLVED" && currentStatus !== "CLOSED") {
        alerts.push({
          type: "success",
          message: "✓ Orders ทั้งหมดจัดการแล้ว",
        });
      }
    }

    return alerts;
  };

  const handleStatusChange = async (newStatus: string) => {
    // If changing to RESOLVED or CLOSED, show dialog
    if (newStatus === "RESOLVED" || newStatus === "CLOSED") {
      setPendingStatus(newStatus);
      setShowResolveDialog(true);
      return;
    }

    await updateCaseStatus(newStatus);
  };

  const updateCaseStatus = async (newStatus: string, extraData?: Record<string, string>) => {
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success("อัพเดทสถานะเรียบร้อย");
      
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      toast.error("ไม่สามารถอัพเดทสถานะได้");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!resolution.trim()) {
      toast.error("กรุณากรอกวิธีแก้ไข");
      return;
    }

    await updateCaseStatus(pendingStatus || "RESOLVED", {
      rootCause: rootCause.trim(),
      resolution: resolution.trim(),
    });

    setShowResolveDialog(false);
    setRootCause("");
    setResolution("");
    setPendingStatus(null);
  };

  const handleNotifyAndClose = async () => {
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "CLOSED",
          customerNotified: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to close case");

      toast.success("ปิดเคสเรียบร้อย", {
        description: "บันทึกว่าแจ้งลูกค้าแล้ว",
      });
      
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      toast.error("ไม่สามารถปิดเคสได้");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAssign = async (userId: string) => {
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: userId }),
      });

      if (!res.ok) throw new Error("Failed to assign");

      const assignedUser = teamMembers?.find((u: { id: string }) => u.id === userId);
      toast.success("มอบหมายงานเรียบร้อย", {
        description: `มอบหมายให้ ${assignedUser?.name || "Unknown"}`,
      });
      
      // Invalidate and refetch immediately
      await queryClient.invalidateQueries({ queryKey: ["case", caseId] });
      await queryClient.invalidateQueries({ queryKey: ["cases"] });
      await queryClient.invalidateQueries({ queryKey: ["team"] });
      
      setShowAssignDialog(false);
    } catch {
      toast.error("ไม่สามารถมอบหมายงานได้");
    } finally {
      setIsUpdating(false);
    }
  };

  const alerts = getAlerts();

  return (
    <>
      <div className="bg-muted/30 border rounded-lg p-4">
        {/* Quick Actions + Inline Alerts */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assign Button */}
          <Button
            variant={owner ? "outline" : "default"}
            size="sm"
            onClick={() => setShowAssignDialog(true)}
            disabled={isUpdating}
            className={cn(
              "gap-2",
              !owner && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            <UserPlus className="h-4 w-4" />
            {owner ? (
              <span className="flex items-center gap-1">
                <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-medium">
                  {owner.name?.charAt(0) || "?"}
                </span>
                {owner.name}
              </span>
            ) : (
              "มอบหมายงาน"
            )}
          </Button>

          <div className="h-6 w-px bg-border mx-1" />

          {/* Previous Step */}
          {currentFlow?.prev && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(currentFlow.prev!)}
              disabled={isUpdating}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentFlow.prevLabel || "ย้อนกลับ"}
            </Button>
          )}

          {/* Next Step */}
          {currentFlow?.next && (
            <Button
              size="sm"
              onClick={() => handleStatusChange(currentFlow.next!)}
              disabled={isUpdating}
              className="gap-1 bg-primary hover:bg-primary/90"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {currentFlow.nextLabel || "ถัดไป"}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}

          <div className="h-6 w-px bg-border mx-1" />

          {/* Waiting States */}
          {(currentStatus === "INVESTIGATING" || currentStatus === "FIXING") && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("WAITING_CUSTOMER")}
                disabled={isUpdating}
                className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
              >
                <UserX className="h-4 w-4" />
                รอลูกค้า
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("WAITING_PROVIDER")}
                disabled={isUpdating}
                className="gap-1 border-orange-300 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              >
                <HourglassIcon className="h-4 w-4" />
                รอ Provider
              </Button>
            </>
          )}

          {/* Notify & Close (only when RESOLVED) */}
          {currentStatus === "RESOLVED" && (
            <Button
              size="sm"
              onClick={handleNotifyAndClose}
              disabled={isUpdating}
              className="gap-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <MessageSquare className="h-4 w-4" />
              แจ้งลูกค้าแล้ว → ปิดเคส
            </Button>
          )}

          {/* Inline Alerts (compact, no CTA) */}
          {alerts.length > 0 && (
            <>
              <div className="h-6 w-px bg-border mx-1" />
              {alerts.map((alert, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded-full",
                    alert.type === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                    alert.type === "success" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                    alert.type === "info" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  )}
                >
                  {alert.message}
                </span>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              มอบหมายงาน
            </DialogTitle>
            <DialogDescription>
              เลือกผู้รับผิดชอบสำหรับเคสนี้
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {teamMembers?.map((member: { 
                id: string; 
                name: string | null; 
                email: string;
                role: string; 
                activeCases: number;
              }) => (
                <button
                  key={member.id}
                  onClick={() => handleAssign(member.id)}
                  disabled={isUpdating}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors",
                    "hover:bg-muted/50 hover:border-primary/50",
                    member.id === owner?.id && "bg-primary/5 border-primary"
                  )}
                >
                  <div>
                    <p className="font-medium">{member.name || member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {roleLabels[member.role] || member.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {member.activeCases} เคส
                    </Badge>
                    {member.id === owner?.id && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve/Close Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              {pendingStatus === "CLOSED" ? "ปิดเคส" : "แก้ไขเรียบร้อย"}
            </DialogTitle>
            <DialogDescription>
              กรุณากรอกรายละเอียดการแก้ไขปัญหา
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rootCause">สาเหตุของปัญหา (ถ้ามี)</Label>
              <Textarea
                id="rootCause"
                placeholder="อธิบายสาเหตุที่ทำให้เกิดปัญหา..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resolution">
                วิธีแก้ไข <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="resolution"
                placeholder="อธิบายวิธีที่ใช้แก้ไขปัญหา..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false);
                setPendingStatus(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleResolveSubmit}
              disabled={!resolution.trim() || isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

