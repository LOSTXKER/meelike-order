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
import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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
  PAYMENT: { label: "การเงิน", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
  ORDER: { label: "ออเดอร์", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  SYSTEM: { label: "ระบบ", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  PROVIDER: { label: "Provider", className: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  OTHER: { label: "อื่นๆ", className: "bg-gray-500/10 text-gray-600 dark:text-gray-400" },
};

const severityLabels: Record<string, string> = {
  CRITICAL: "วิกฤต",
  HIGH: "สูง",
  NORMAL: "ปกติ",
  LOW: "ต่ำ",
};

export default function CaseTypesPage() {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [defaultSeverity, setDefaultSeverity] = useState("NORMAL");
  const [defaultSlaMinutes, setDefaultSlaMinutes] = useState("120");
  const [requireProvider, setRequireProvider] = useState(false);
  const [requireOrderId, setRequireOrderId] = useState(false);
  const [lineNotification, setLineNotification] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadCaseTypes();
  }, []);

  const loadCaseTypes = () => {
    fetch("/api/case-types")
      .then((r) => r.json())
      .then((d) => {
        setCaseTypes(d);
        setIsLoading(false);
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/case-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          defaultSeverity,
          defaultSlaMinutes: parseInt(defaultSlaMinutes),
          requireProvider,
          requireOrderId,
          lineNotification,
          description: description || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create case type");
      }

      toast.success("สร้างประเภทเคสเรียบร้อย");
      setIsDialogOpen(false);
      loadCaseTypes();
      
      // Reset form
      setName("");
      setCategory("OTHER");
      setDefaultSeverity("NORMAL");
      setDefaultSlaMinutes("120");
      setRequireProvider(false);
      setRequireOrderId(false);
      setLineNotification(false);
      setDescription("");
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถสร้างประเภทเคสได้");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="ประเภทเคส" />
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
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
              จัดการประเภทเคสและการตั้งค่า SLA
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                เพิ่มประเภทเคส
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>เพิ่มประเภทเคสใหม่</DialogTitle>
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
                        <SelectItem value="PAYMENT">การเงิน</SelectItem>
                        <SelectItem value="ORDER">ออเดอร์</SelectItem>
                        <SelectItem value="SYSTEM">ระบบ</SelectItem>
                        <SelectItem value="PROVIDER">Provider</SelectItem>
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
                </div>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button type="submit">สร้างประเภทเคส</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

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
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {caseTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    ไม่พบประเภทเคส
                  </TableCell>
                </TableRow>
              ) : (
                caseTypes.map((type) => (
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
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
