"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Ban,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

// Order Status configuration
export const orderStatusConfig: Record<string, { 
  label: string; 
  className: string;
  icon: typeof Clock;
  description: string;
}> = {
  PENDING: { 
    label: "รอดำเนินการ", 
    className: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
    icon: Clock,
    description: "รอตรวจสอบ/ดำเนินการ"
  },
  PROCESSING: { 
    label: "กำลังดำเนินการ", 
    className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700",
    icon: Loader2,
    description: "กำลังติดต่อ Provider"
  },
  COMPLETED: { 
    label: "สำเร็จ", 
    className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700",
    icon: CheckCircle2,
    description: "ดำเนินการเรียบร้อย"
  },
  FAILED: { 
    label: "ไม่สำเร็จ", 
    className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700",
    icon: XCircle,
    description: "ไม่สามารถดำเนินการได้"
  },
  REFUNDED: { 
    label: "คืนเงินแล้ว", 
    className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700",
    icon: RefreshCcw,
    description: "คืนเงินให้ลูกค้าแล้ว"
  },
  CANCELLED: { 
    label: "ยกเลิก", 
    className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    icon: Ban,
    description: "ลูกค้าขอยกเลิก"
  },
};

interface Order {
  id: string;
  orderId: string;
  amount: unknown;
  status: string;
  createdAt: Date | string;
  provider?: { id: string; name: string } | null;
}

interface OrderStatusSelectProps {
  order: Order;
  caseId: string;
  onUpdate?: () => void;
}

export function OrderStatusSelect({ order, caseId, onUpdate }: OrderStatusSelectProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  
  const currentStatus = orderStatusConfig[order.status] || orderStatusConfig.PENDING;
  const StatusIcon = currentStatus.icon;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.status) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update order status");
      }

      toast.success("อัพเดทสถานะ Order สำเร็จ", {
        description: `${order.orderId} → ${orderStatusConfig[newStatus]?.label}`,
      });

      // Invalidate case query to refresh data
      queryClient.invalidateQueries({ queryKey: [`case-${caseId}`] });
      onUpdate?.();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถอัพเดทสถานะได้", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted/50 border flex items-center justify-center">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-mono text-sm font-semibold">{order.orderId}</p>
          <p className="text-xs text-muted-foreground">
            {format(typeof order.createdAt === "string" ? new Date(order.createdAt) : order.createdAt, "d MMM yyyy HH:mm", { locale: th })}
            {order.provider && (
              <span className="ml-2 text-muted-foreground/70">• {order.provider.name}</span>
            )}
          </p>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "gap-1.5 min-w-[140px] justify-between font-medium",
              currentStatus.className
            )}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <StatusIcon className={cn("h-3.5 w-3.5", order.status === "PROCESSING" && "animate-spin")} />
            )}
            <span>{currentStatus.label}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {Object.entries(orderStatusConfig).map(([status, config]) => {
            const Icon = config.icon;
            const isActive = status === order.status;
            
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  isActive && "bg-muted"
                )}
              >
                <Icon className={cn("h-4 w-4", status === "PROCESSING" && "animate-spin")} />
                <div className="flex-1">
                  <p className="font-medium">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                {isActive && (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Simple badge display for sidebar
export function OrderStatusBadge({ status }: { status: string }) {
  const config = orderStatusConfig[status] || orderStatusConfig.PENDING;
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className={cn("gap-1", config.className)}>
      <Icon className={cn("h-3 w-3", status === "PROCESSING" && "animate-spin")} />
      {config.label}
    </Badge>
  );
}

