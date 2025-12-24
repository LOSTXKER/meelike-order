"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusFlowGuideProps {
  currentStatus: string;
}

const statusFlow = [
  { 
    key: "NEW", 
    label: "ใหม่", 
    description: "เคสที่เพิ่งสร้าง รอดำเนินการ",
    color: "bg-blue-500" 
  },
  { 
    key: "INVESTIGATING", 
    label: "กำลังตรวจสอบ", 
    description: "กำลังวิเคราะห์และหาสาเหตุของปัญหา",
    color: "bg-violet-500" 
  },
  { 
    key: "WAITING_CUSTOMER", 
    label: "รอลูกค้า", 
    description: "รอข้อมูลเพิ่มเติมจากลูกค้า",
    color: "bg-amber-500" 
  },
  { 
    key: "WAITING_PROVIDER", 
    label: "รอ Provider", 
    description: "ส่งเรื่องให้ Provider ดำเนินการ",
    color: "bg-orange-500" 
  },
  { 
    key: "FIXING", 
    label: "กำลังแก้ไข", 
    description: "กำลังดำเนินการแก้ไขปัญหา",
    color: "bg-cyan-500" 
  },
  { 
    key: "RESOLVED", 
    label: "แก้ไขแล้ว", 
    description: "แก้ไขปัญหาเรียบร้อยแล้ว",
    color: "bg-green-500" 
  },
  { 
    key: "CLOSED", 
    label: "ปิดเคส", 
    description: "เคสถูกปิดและเสร็จสิ้น",
    color: "bg-gray-500" 
  },
];

export function StatusFlowGuide({ currentStatus }: StatusFlowGuideProps) {
  const currentIndex = statusFlow.findIndex((s) => s.key === currentStatus);

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
      <h4 className="text-sm font-medium mb-3">สถานะเคส</h4>
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {statusFlow.map((status, index) => {
          const isPast = index < currentIndex;
          const isCurrent = status.key === currentStatus;
          const isFuture = index > currentIndex;

          return (
            <TooltipProvider key={status.key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                          isPast && "bg-green-500 text-white",
                          isCurrent && `${status.color} text-white ring-2 ring-offset-2 ring-offset-background`,
                          isFuture && "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        {isPast ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs whitespace-nowrap",
                          isCurrent && "font-semibold",
                          isFuture && "text-muted-foreground"
                        )}
                      >
                        {status.label}
                      </span>
                    </div>
                    {index < statusFlow.length - 1 && (
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 mx-1 flex-shrink-0",
                          isPast ? "text-green-500" : "text-muted-foreground/30"
                        )}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{status.label}</p>
                  <p className="text-xs text-muted-foreground">{status.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
}


