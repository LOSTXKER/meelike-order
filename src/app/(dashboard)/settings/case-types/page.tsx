"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Settings2, 
  X, 
  CheckCircle2, 
  XCircle,
  Clipboard,
  DollarSign,
  Package,
  Settings,
  Building2,
  Wrench,
  FileText,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  MessageSquare
} from "lucide-react";
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

const categoryOptions = [
  { value: "all", label: "ทั้งหมด", icon: Clipboard },
  { value: "PAYMENT", label: "การชำระเงิน", icon: DollarSign },
  { value: "ORDER", label: "ออเดอร์", icon: Package },
  { value: "SYSTEM", label: "ระบบ", icon: Settings },
  { value: "PROVIDER", label: "Provider", icon: Building2 },
  { value: "TECHNICAL", label: "เทคนิค", icon: Wrench },
  { value: "OTHER", label: "อื่นๆ", icon: FileText },
];

const categoryLabels: Record<string, { label: string; className: string; icon: typeof DollarSign }> = {
  PAYMENT: { label: "การชำระเงิน", className: "bg-green-500/10 text-green-600 dark:text-green-400", icon: DollarSign },
  ORDER: { label: "ออเดอร์", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: Package },
  SYSTEM: { label: "ระบบ", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400", icon: Settings },
  PROVIDER: { label: "Provider", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400", icon: Building2 },
  TECHNICAL: { label: "เทคนิค", className: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", icon: Wrench },
  OTHER: { label: "อื่นๆ", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400", icon: FileText },
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

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  
  // Bulk edit form state
  const [bulkCategory, setBulkCategory] = useState<string>("");
  const [bulkSeverity, setBulkSeverity] = useState<string>("");
  const [bulkSlaMinutes, setBulkSlaMinutes] = useState<string>("");
  const [bulkRequireProvider, setBulkRequireProvider] = useState<string>("");
  const [bulkRequireOrderId, setBulkRequireOrderId] = useState<string>("");
  const [bulkLineNotification, setBulkLineNotification] = useState<string>("");
  const [bulkIsActive, setBulkIsActive] = useState<string>("");

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

  // Bulk selection helpers
  const isAllSelected = filteredCaseTypes.length > 0 && 
    filteredCaseTypes.every(type => selectedIds.has(type.id));
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCaseTypes.map(type => type.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const resetBulkForm = () => {
    setBulkCategory("");
    setBulkSeverity("");
    setBulkSlaMinutes("");
    setBulkRequireProvider("");
    setBulkRequireOrderId("");
    setBulkLineNotification("");
    setBulkIsActive("");
  };

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

  const handleBulkSubmit = async () => {
    // Build payload with only changed fields
    const payload: Record<string, unknown> = {};
    if (bulkCategory) payload.category = bulkCategory;
    if (bulkSeverity) payload.defaultSeverity = bulkSeverity;
    if (bulkSlaMinutes) payload.defaultSlaMinutes = parseInt(bulkSlaMinutes);
    if (bulkRequireProvider) payload.requireProvider = bulkRequireProvider === "true";
    if (bulkRequireOrderId) payload.requireOrderId = bulkRequireOrderId === "true";
    if (bulkLineNotification) payload.lineNotification = bulkLineNotification === "true";
    if (bulkIsActive) payload.isActive = bulkIsActive === "true";

    if (Object.keys(payload).length === 0) {
      toast.error("กรุณาเลือกค่าที่ต้องการแก้ไขอย่างน้อย 1 รายการ");
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      let successCount = 0;
      
      for (const id of ids) {
        const res = await fetch(`/api/case-types/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) successCount++;
      }

      toast.success(`อัพเดท ${successCount} รายการเรียบร้อย`);
      setIsBulkDialogOpen(false);
      resetBulkForm();
      clearSelection();
      refetch();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถอัพเดทประเภทเคสได้");
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (!confirm(`ต้องการลบ ${count} รายการหรือไม่?`)) return;

    try {
      const ids = Array.from(selectedIds);
      let successCount = 0;
      
      for (const id of ids) {
        const res = await fetch(`/api/case-types/${id}`, {
          method: "DELETE",
        });
        if (res.ok) successCount++;
      }

      toast.success(`ลบ ${successCount} รายการเรียบร้อย`);
      clearSelection();
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

        {/* Filter Tabs - Category */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Button
                  key={cat.value}
                  variant={filterCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "gap-1.5 transition-all",
                    filterCategory === cat.value && "shadow-md"
                  )}
                  onClick={() => setFilterCategory(cat.value)}
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                  {cat.value !== "all" && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {caseTypes.filter(t => t.category === cat.value).length}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">สถานะ:</span>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              <Button
                variant={filterStatus === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3"
                onClick={() => setFilterStatus("all")}
              >
                ทั้งหมด
              </Button>
              <Button
                variant={filterStatus === "active" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 gap-1"
                onClick={() => setFilterStatus("active")}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                เปิดใช้งาน
              </Button>
              <Button
                variant={filterStatus === "inactive" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-3 gap-1"
                onClick={() => setFilterStatus("inactive")}
              >
                <XCircle className="h-3.5 w-3.5 text-gray-400" />
                ปิดใช้งาน
              </Button>
            </div>
            
            {(filterCategory !== "all" || filterStatus !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFilterCategory("all");
                  setFilterStatus("all");
                }}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && (
          <Card className="border-primary/50 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-sm">
                    {selectedIds.size}
                  </div>
                  <span className="font-medium">รายการที่เลือก</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="h-7 text-muted-foreground"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  ยกเลิกการเลือก
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Dialog open={isBulkDialogOpen} onOpenChange={(open) => {
                  setIsBulkDialogOpen(open);
                  if (!open) resetBulkForm();
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Settings2 className="h-4 w-4" />
                      แก้ไขพร้อมกัน
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>แก้ไข {selectedIds.size} รายการพร้อมกัน</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        เลือกค่าที่ต้องการเปลี่ยน (ค่าที่ไม่ได้เลือกจะคงเดิม)
                      </p>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label>หมวดหมู่</Label>
                          <Select value={bulkCategory} onValueChange={setBulkCategory}>
                            <SelectTrigger>
                              <SelectValue placeholder="ไม่เปลี่ยน" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PAYMENT">
                                <span className="flex items-center gap-1.5">
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>การชำระเงิน</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="ORDER">
                                <span className="flex items-center gap-1.5">
                                  <Package className="h-3.5 w-3.5" />
                                  <span>ออเดอร์</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="SYSTEM">
                                <span className="flex items-center gap-1.5">
                                  <Settings className="h-3.5 w-3.5" />
                                  <span>ระบบ</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="PROVIDER">
                                <span className="flex items-center gap-1.5">
                                  <Building2 className="h-3.5 w-3.5" />
                                  <span>Provider</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="TECHNICAL">
                                <span className="flex items-center gap-1.5">
                                  <Wrench className="h-3.5 w-3.5" />
                                  <span>เทคนิค</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="OTHER">
                                <span className="flex items-center gap-1.5">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>อื่นๆ</span>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>ความรุนแรงเริ่มต้น</Label>
                          <Select value={bulkSeverity} onValueChange={setBulkSeverity}>
                            <SelectTrigger>
                              <SelectValue placeholder="ไม่เปลี่ยน" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CRITICAL">
                                <span className="flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                  <span>วิกฤต</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="HIGH">
                                <span className="flex items-center gap-1.5">
                                  <AlertTriangle className="h-3.5 w-3.5 text-orange-600" />
                                  <span>สูง</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="NORMAL">
                                <span className="flex items-center gap-1.5">
                                  <Info className="h-3.5 w-3.5 text-yellow-600" />
                                  <span>ปกติ</span>
                                </span>
                              </SelectItem>
                              <SelectItem value="LOW">
                                <span className="flex items-center gap-1.5">
                                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                  <span>ต่ำ</span>
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>SLA (นาที)</Label>
                          <Input
                            type="number"
                            value={bulkSlaMinutes}
                            onChange={(e) => setBulkSlaMinutes(e.target.value)}
                            placeholder="ไม่เปลี่ยน"
                            min="1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>ต้องระบุ Provider</Label>
                            <Select value={bulkRequireProvider} onValueChange={setBulkRequireProvider}>
                              <SelectTrigger>
                                <SelectValue placeholder="ไม่เปลี่ยน" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    <span>ต้องระบุ</span>
                                  </span>
                                </SelectItem>
                                <SelectItem value="false">
                                  <span className="flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                    <span>ไม่ต้องระบุ</span>
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>ต้องระบุ Order ID</Label>
                            <Select value={bulkRequireOrderId} onValueChange={setBulkRequireOrderId}>
                              <SelectTrigger>
                                <SelectValue placeholder="ไม่เปลี่ยน" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    <span>ต้องระบุ</span>
                                  </span>
                                </SelectItem>
                                <SelectItem value="false">
                                  <span className="flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                    <span>ไม่ต้องระบุ</span>
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>แจ้งเตือน Line</Label>
                            <Select value={bulkLineNotification} onValueChange={setBulkLineNotification}>
                              <SelectTrigger>
                                <SelectValue placeholder="ไม่เปลี่ยน" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">
                                  <span className="flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5 text-green-600" />
                                    <span>เปิด</span>
                                  </span>
                                </SelectItem>
                                <SelectItem value="false">
                                  <span className="flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                    <span>ปิด</span>
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>สถานะ</Label>
                            <Select value={bulkIsActive} onValueChange={setBulkIsActive}>
                              <SelectTrigger>
                                <SelectValue placeholder="ไม่เปลี่ยน" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">
                                  <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    <span>เปิดใช้งาน</span>
                                  </span>
                                </SelectItem>
                                <SelectItem value="false">
                                  <span className="flex items-center gap-1.5">
                                    <XCircle className="h-3.5 w-3.5 text-gray-400" />
                                    <span>ปิดใช้งาน</span>
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsBulkDialogOpen(false);
                            resetBulkForm();
                          }}
                        >
                          ยกเลิก
                        </Button>
                        <Button onClick={handleBulkSubmit}>
                          บันทึกการแก้ไข
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  ลบทั้งหมด
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Case Types Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="เลือกทั้งหมด"
                  />
                </TableHead>
                <TableHead>ชื่อ</TableHead>
                <TableHead className="w-[130px]">หมวดหมู่</TableHead>
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
                  <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                    {caseTypes.length === 0 ? "ไม่พบประเภทเคส" : "ไม่พบประเภทเคสที่ตรงกับตัวกรอง"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCaseTypes.map((type) => (
                  <TableRow 
                    key={type.id}
                    className={cn(selectedIds.has(type.id) && "bg-primary/5")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(type.id)}
                        onCheckedChange={() => toggleSelect(type.id)}
                        aria-label={`เลือก ${type.name}`}
                      />
                    </TableCell>
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
                        className={cn("text-xs gap-1", categoryLabels[type.category]?.className)}
                      >
                        {(() => {
                          const IconComponent = categoryLabels[type.category]?.icon;
                          return IconComponent ? <IconComponent className="h-3 w-3" /> : null;
                        })()}
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
                          <Badge variant="outline" className="text-xs gap-1">
                            <Building2 className="h-3 w-3" />
                            Provider
                          </Badge>
                        )}
                        {type.requireOrderId && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Clipboard className="h-3 w-3" />
                            Order
                          </Badge>
                        )}
                        {type.lineNotification && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <MessageSquare className="h-3 w-3" />
                            Line
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "flex items-center gap-1.5",
                      )}>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          type.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-xs text-muted-foreground">
                          {type.isActive ? "เปิด" : "ปิด"}
                        </span>
                      </div>
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
