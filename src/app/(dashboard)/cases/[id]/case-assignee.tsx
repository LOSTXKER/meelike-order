"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, User, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useTeam } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CaseAssigneeProps {
  caseId: string;
  owner: {
    id: string;
    name: string | null;
    role: string;
  } | null;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  SUPPORT: "Support",
  VIEWER: "Viewer",
};

export function CaseAssignee({ caseId, owner }: CaseAssigneeProps) {
  const queryClient = useQueryClient();
  const { data: teamMembers } = useTeam();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

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

  return (
    <>
      <div className="p-3">
        <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
          <User className="h-3.5 w-3.5" /> ผู้รับผิดชอบ
        </p>
        
        {owner ? (
          <div className="flex items-center gap-2 group relative">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
              {owner.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{owner.name}</p>
              <p className="text-xs text-muted-foreground">{roleLabels[owner.role] || owner.role}</p>
            </div>
            {/* Quick re-assign button visible on hover */}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0"
              onClick={() => setShowAssignDialog(true)}
            >
              <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-muted-foreground border-dashed hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <UserPlus className="h-3.5 w-3.5 mr-2" />
                  กดเพื่อมอบหมายงาน
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>มอบหมายงานให้ทีม</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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
                    {isUpdating && member.id === owner?.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
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

