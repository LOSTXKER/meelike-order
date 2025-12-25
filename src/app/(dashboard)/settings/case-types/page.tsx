"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  RefreshCw, 
  Clipboard,
  DollarSign,
  Package,
  Settings,
  Building2,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCaseTypes } from "@/hooks/use-case-types";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { CaseTypeForm } from "@/components/case-types/case-type-form";
import { CaseTypeTable } from "@/components/case-types/case-type-table";

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

const categoryOptions = [
  { value: "all", label: "ทั้งหมด", icon: Clipboard },
  { value: "PAYMENT", label: "การชำระเงิน", icon: DollarSign },
  { value: "ORDER", label: "ออเดอร์", icon: Package },
  { value: "SYSTEM", label: "ระบบ", icon: Settings },
  { value: "PROVIDER", label: "Provider", icon: Building2 },
  { value: "OTHER", label: "อื่นๆ", icon: FileText },
];

export default function CaseTypesPage() {
  const { data: caseTypes = [], isLoading, refetch, isFetching } = useCaseTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CaseType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter case types by category
  const filteredTypes = selectedCategory === "all"
    ? caseTypes
    : caseTypes.filter((type: CaseType) => type.category === selectedCategory);

  const handleEdit = (type: CaseType) => {
    setEditingType(type);
    setIsDialogOpen(true);
  };

  const handleDelete = async (type: CaseType) => {
    if (!confirm(`ต้องการลบประเภทเคส "${type.name}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/case-types/${type.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete case type");
      }

      toast.success("ลบประเภทเคสสำเร็จ");
      refetch();
    } catch (error: any) {
      console.error("Error deleting case type:", error);
      toast.error(error.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingType(null);
    }
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingType(null);
    refetch();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ประเภทเคส</h1>
          <p className="text-sm text-muted-foreground mt-1">
            จัดการประเภทและหมวดหมู่ของเคส
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                สร้างประเภทเคสใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "แก้ไขประเภทเคส" : "สร้างประเภทเคสใหม่"}
                </DialogTitle>
              </DialogHeader>
              <CaseTypeForm
                caseType={editingType}
                onSuccess={handleFormSuccess}
                onCancel={() => handleDialogClose(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-full sm:w-64">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="หมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            รายการประเภทเคส ({filteredTypes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CaseTypeTable
            caseTypes={filteredTypes}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
