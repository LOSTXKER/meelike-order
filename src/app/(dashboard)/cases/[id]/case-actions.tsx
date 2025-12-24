"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { UserPlus, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTeam } from "@/hooks";
import { cn } from "@/lib/utils";

interface CaseActionsProps {
  caseId: string;
  currentStatus: string;
  currentOwnerId?: string | null;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SUPPORT: "Support",
  VIEWER: "Viewer",
};

export function CaseActions({ caseId, currentStatus, currentOwnerId }: CaseActionsProps) {
  const queryClient = useQueryClient();
  const { data: teamMembers } = useTeam();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [rootCause, setRootCause] = useState("");
  const [resolution, setResolution] = useState("");
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: string) => {
    // If changing to RESOLVED, show dialog to enter resolution
    if (newStatus === "RESOLVED" || newStatus === "CLOSED") {
      setPendingStatus(newStatus);
      setShowResolveDialog(true);
      return;
    }

    await updateCaseStatus(newStatus);
  };

  const updateCaseStatus = async (newStatus: string, extraData?: Record<string, string>) => {
    setIsUpdating(true);
    setStatus(newStatus);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, ...extraData }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("อัพเดทสถานะเรียบร้อย");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`case-${caseId}`] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch {
      toast.error("ไม่สามารถอัพเดทสถานะได้");
      setStatus(currentStatus);
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

  const handleAssign = async (userId: string) => {
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: userId }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign");
      }

      const assignedUser = teamMembers?.find((u: { id: string }) => u.id === userId);
      toast.success("มอบหมายงานเรียบร้อย", {
        description: `มอบหมายให้ ${assignedUser?.name || "Unknown"}`,
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`case-${caseId}`] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
      
      setShowAssignDialog(false);
    } catch {
      toast.error("ไม่สามารถมอบหมายงานได้");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle "แจ้งลูกค้าแล้ว" - close case after notifying customer
  const handleNotifyAndClose = async () => {
    setIsUpdating(true);
    
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "CLOSED",
          customerNotified: true, // Mark as customer notified
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to close case");
      }

      toast.success("ปิดเคสเรียบร้อย", {
        description: "บันทึกว่าแจ้งลูกค้าแล้ว",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: [`case-${caseId}`] });
      queryClient.invalidateQueries({ queryKey: ["cases"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      
      setStatus("CLOSED");
    } catch {
      toast.error("ไม่สามารถปิดเคสได้");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* "แจ้งลูกค้าแล้ว" Button - Only show when RESOLVED */}
        {currentStatus === "RESOLVED" && (
          <Button
            size="sm"
            onClick={handleNotifyAndClose}
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4 mr-1" />
            )}
            แจ้งลูกค้าแล้ว
          </Button>
        )}

        {/* Assign Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAssignDialog(true)}
          disabled={isUpdating}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          มอบหมาย
        </Button>

        {/* Status Select */}
        <Select
          value={status}
          onValueChange={handleStatusChange}
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[160px]">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SelectValue placeholder="เปลี่ยนสถานะ" />
            )}
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
                    member.id === currentOwnerId && "bg-primary/5 border-primary"
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
                    {member.id === currentOwnerId && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
