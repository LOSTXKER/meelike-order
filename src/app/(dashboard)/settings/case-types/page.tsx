"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useCaseTypes } from "@/hooks/use-case-types";
import { LoadingScreen } from "@/components/ui/loading-screen";

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

const categoryLabels: Record<string, { label: string; className: string }> = {
  PAYMENT: { label: "การชำระเงิน", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  ORDER: { label: "ออเดอร์", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  SYSTEM: { label: "ระบบ", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  PROVIDER: { label: "Provider", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  TECHNICAL: { label: "เทคนิค", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400" },
  OTHER: { label: "อื่นๆ", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

const severityLabels: Record<string, string> = {
  CRITICAL: "วิกฤต",
  HIGH: "สูง",
  NORMAL: "ปกติ",
  LOW: "ต่ำ",
};

export default function CaseTypesPage() {
  const { data: caseTypes = [], isLoading, refetch, isFetching } = useCaseTypes();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CaseType | null>(null);

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [defaultSeverity, setDefaultSeverity] = useState("NORMAL");
  const [defaultSlaMinutes, setDefaultSlaMinutes] = useState("120");
  const [requireProvider, setRequireProvider] = useState(false);
  const [requireOrderId, setRequireOrderId] = useState(false);
  const [lineNotification, setLineNotification] = useState(false);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Filter case types
  const filteredCaseTypes = caseTypes.filter((type) => {
    if (filterCategory !== "all" && type.category !== filterCategory) return false;
    if (filterStatus === "active" && !type.isActive) return false;
    if (filterStatus === "inactive" && type.isActive) return false;
    return true;
  });

  // Removed useEffect and loadCaseTypes - using React Query hook now

  const resetForm = () => {
    setName("");
    setCategory("OTHER");
    setDefaultSeverity("NORMAL");
    setDefaultSlaMinutes("120");
    setRequireProvider(false);
    setRequireOrderId(false);
    setLineNotification(false);
    setDescription("");
    setIsActive(true);
    setEditingType(null);
  };

  const openEditDialog = (caseType: CaseType) => {
    setEditingType(caseType);
    setName(caseType.name);
    setCategory(caseType.category);
    setDefaultSeverity(caseType.defaultSeverity);
    setDefaultSlaMinutes(caseType.defaultSlaMinutes.toString());
    setRequireProvider(caseType.requireProvider);
    setRequireOrderId(caseType.requireOrderId);
    setLineNotification(caseType.lineNotification);
    setDescription(caseType.description || "");
    setIsActive(caseType.isActive);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      category,
      defaultSeverity,
      defaultSlaMinutes: parseInt(defaultSlaMinutes),
      requireProvider,
      requireOrderId,
      lineNotification,
      description: description || undefined,
      isActive,
    };

    try {
      let res;
      if (editingType) {
        // Update existing
        res = await fetch(`/api/case-types/${editingType.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new
        res = await fetch("/api/case-types", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        throw new Error("Failed");
      }

      toast.success(editingType ? "อัพเดทประเภทเคสเรียบร้อย" : "สร้างประเภทเคสเรียบร้อย");
      setIsDialogOpen(false);
      refetch();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(editingType ? "ไม่สามารถอัพเดทประเภทเคสได้" : "ไม่สามารถสร้างประเภทเคสได้");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบประเภทเคสนี้หรือไม่?")) return;

    try {
      const res = await fetch(`/api/case-types/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("ลบประเภทเคสเรียบร้อย");
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถลบประเภทเคสได้");
    }
  };

  if (isLoading) {
    return <LoadingScreen title="กำลังโหลดประเภทเคส" variant="minimal" />;
  }

  return (
    <div className="min-h-screen">
      <Header title="ตั้งค่า - ประเภทเคส" />

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">ประเภทเคส</h2>
            <p className="text-muted-foreground">
              จัดการประเภทเคสและการตั้งค่า SLA ({filteredCaseTypes.length} รายการ)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  เพิ่มประเภทเคส
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingType ? "แก้ไขประเภทเคส" : "เพิ่มประเภทเคสใหม่"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">ชื่อประเภทเคส *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น เติมเงินไม่เข้า"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>หมวดหมู่ *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PAYMENT">การชำระเงิน</SelectItem>
                        <SelectItem value="ORDER">ออเดอร์</SelectItem>
                        <SelectItem value="SYSTEM">ระบบ</SelectItem>
                        <SelectItem value="PROVIDER">Provider</SelectItem>
                        <SelectItem value="TECHNICAL">เทคนิค</SelectItem>
                        <SelectItem value="OTHER">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">คำอธิบาย</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="อธิบายประเภทเคสนี้"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>ความรุนแรงเริ่มต้น</Label>
                    <Select value={defaultSeverity} onValueChange={setDefaultSeverity}>
                      <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label htmlFor="sla">SLA (นาที)</Label>
                    <Input
                      id="sla"
                      type="number"
                      value={defaultSlaMinutes}
                      onChange={(e) => setDefaultSlaMinutes(e.target.value)}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requireProvider"
                      checked={requireProvider}
                      onChange={(e) => setRequireProvider(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="requireProvider" className="cursor-pointer">
                      ต้องระบุ Provider
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="requireOrderId"
                      checked={requireOrderId}
                      onChange={(e) => setRequireOrderId(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="requireOrderId" className="cursor-pointer">
                      ต้องระบุ Order ID
                    </Label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="lineNotification"
                      checked={lineNotification}
                      onChange={(e) => setLineNotification(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="lineNotification" className="cursor-pointer">
                      ส่งการแจ้งเตือน Line
                    </Label>
                  </div>

                  {editingType && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isActive"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="rounded"
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        เปิดใช้งาน
                      </Label>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">
                    {editingType ? "บันทึกการแก้ไข" : "สร้างประเภทเคส"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">กรองตามหมวดหมู่</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="PAYMENT">การชำระเงิน</SelectItem>
                  <SelectItem value="ORDER">ออเดอร์</SelectItem>
                  <SelectItem value="SYSTEM">ระบบ</SelectItem>
                  <SelectItem value="PROVIDER">Provider</SelectItem>
                  <SelectItem value="TECHNICAL">เทคนิค</SelectItem>
                  <SelectItem value="OTHER">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">กรองตามสถานะ</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">เปิดใช้งาน</SelectItem>
                  <SelectItem value="inactive">ปิดใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(filterCategory !== "all" || filterStatus !== "all") && (
              <Button
                variant="ghost"
                className="self-end"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterStatus("all");
                }}
              >
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </Card>

        {/* Case Types Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ชื่อ</TableHead>
                <TableHead className="w-[120px]">หมวดหมู่</TableHead>
                <TableHead className="w-[100px]">ความรุนแรง</TableHead>
                <TableHead className="w-[100px] text-right">SLA</TableHead>
                <TableHead className="w-[200px]">การตั้งค่า</TableHead>
                <TableHead className="w-[80px]">สถานะ</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCaseTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    {caseTypes.length === 0 ? "ไม่พบประเภทเคส" : "ไม่พบประเภทเคสที่ตรงกับตัวกรอง"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCaseTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{type.name}</p>
                        {type.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {type.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", categoryLabels[type.category]?.className)}
                      >
                        {categoryLabels[type.category]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{severityLabels[type.defaultSeverity]}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      {type.defaultSlaMinutes} นาที
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {type.requireProvider && (
                          <Badge variant="outline" className="text-xs">
                            Provider
                          </Badge>
                        )}
                        {type.requireOrderId && (
                          <Badge variant="outline" className="text-xs">
                            Order ID
                          </Badge>
                        )}
                        {type.lineNotification && (
                          <Badge variant="outline" className="text-xs">
                            Line
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "h-2 w-2 rounded-full",
                        type.isActive ? "bg-green-500" : "bg-gray-400"
                      )} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(type)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
