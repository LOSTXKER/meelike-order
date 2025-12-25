"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckSquare, MoreVertical, UserPlus, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface BulkActionsProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  totalCount: number;
}

interface User {
  id: string;
  name: string;
  role: string;
}

export function BulkActions({
  selectedIds,
  onSelectionChange,
  totalCount,
}: BulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (isAssignDialogOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isAssignDialogOpen]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.filter((u: User) => u.role === "TECHNICIAN" || u.role === "SUPPORT" || u.role === "MANAGER" || u.role === "CEO"));
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถโหลดรายชื่อผู้ใช้ได้");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedUserId) {
      toast.error("กรุณาเลือกผู้รับผิดชอบ");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/cases/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseIds: selectedIds,
          action: "assign",
          assigneeId: selectedUserId,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const selectedUser = users.find(u => u.id === selectedUserId);
      toast.success(`มอบหมายเคส ${selectedIds.length} รายการให้ ${selectedUser?.name || "ผู้รับผิดชอบ"}`);
      onSelectionChange([]);
      setIsAssignDialogOpen(false);
      setSelectedUserId("");
      window.location.reload();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถมอบหมายเคสได้");
    } finally {
      setIsProcessing(false);
    }
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
    <>
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
            <DropdownMenuItem onClick={() => setIsAssignDialogOpen(true)}>
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

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>มอบหมายเคส</DialogTitle>
            <DialogDescription>
              เลือกผู้รับผิดชอบสำหรับเคส {selectedIds.length} รายการ
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>ผู้รับผิดชอบ</Label>
              {isLoadingUsers ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังโหลด...
                </div>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedUserId("");
              }}
              disabled={isProcessing}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleBulkAssign}
              disabled={isProcessing || !selectedUserId}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังมอบหมาย...
                </>
              ) : (
                "มอบหมาย"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
