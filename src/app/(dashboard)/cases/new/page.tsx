"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Info, Clock, X, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CaseType {
  id: string;
  name: string;
  category: string;
  defaultSeverity: string;
  requireProvider: boolean;
  requireOrderId: boolean;
  description: string | null;
  defaultSlaMinutes: number;
}

interface Provider {
  id: string;
  name: string;
}

// Quick Create mapping
const quickCreateMapping: Record<string, { category: string; caseTypeName: string }> = {
  "deposit-issue": { category: "PAYMENT", caseTypeName: "เติมเงินไม่เข้า" },
  "topup": { category: "PAYMENT", caseTypeName: "ขอเติมยอด" },
  "incomplete": { category: "ORDER", caseTypeName: "ยอดไม่ครบ" },
  "system": { category: "SYSTEM", caseTypeName: "ปัญหาเว็บไซต์/ข้อเสนอ" },
};

export default function NewCasePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quickType = searchParams.get("type");
  
  const [isLoading, setIsLoading] = useState(false);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Form state
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [caseTypeId, setCaseTypeId] = useState("");
  const [source, setSource] = useState("");
  const [severity, setSeverity] = useState("");
  const [providerId, setProviderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [orderIdInput, setOrderIdInput] = useState("");

  // Get selected case type to check requirements
  const selectedCaseType = caseTypes.find((t) => t.id === caseTypeId);
  
  // Filter case types by selected category
  const filteredCaseTypes = category
    ? caseTypes.filter((t) => t.category === category)
    : [];

  // Get unique categories
  const categories = Array.from(new Set(caseTypes.map((t) => t.category)));

  useEffect(() => {
    // Load case types and providers
    Promise.all([
      fetch("/api/case-types").then((r) => r.json()),
      fetch("/api/providers").then((r) => r.json()),
    ]).then(([types, provs]) => {
      setCaseTypes(types);
      setProviders(provs.filter((p: Provider & { isActive: boolean }) => p.isActive));
      
      // Quick Create: Auto-fill category and case type from URL params
      if (quickType && quickCreateMapping[quickType]) {
        const mapping = quickCreateMapping[quickType];
        setCategory(mapping.category);
        
        // Find and set case type after a small delay to ensure state is updated
        setTimeout(() => {
          const matchedType = types.find((t: CaseType) => t.name === mapping.caseTypeName);
          if (matchedType) {
            setCaseTypeId(matchedType.id);
          }
        }, 100);
      }
    });
  }, [quickType]);

  // Auto-set severity when case type changes
  useEffect(() => {
    if (selectedCaseType) {
      setSeverity(selectedCaseType.defaultSeverity);
    }
  }, [selectedCaseType]);

  // Reset case type when category changes
  useEffect(() => {
    setCaseTypeId("");
    setSeverity("");
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate required fields
    if (!source) {
      toast.error("กรุณาเลือกแหล่งที่มา");
      setIsLoading(false);
      return;
    }

    if (!severity) {
      toast.error("กรุณาเลือกความรุนแรง");
      setIsLoading(false);
      return;
    }

    // Validate required fields based on case type
    if (selectedCaseType?.requireProvider && (!providerId || providerId === "none")) {
      toast.error("กรุณาเลือก Provider", {
        description: "ประเภทเคสนี้ต้องระบุ Provider",
      });
      setIsLoading(false);
      return;
    }

    if (selectedCaseType?.requireOrderId && orderIds.length === 0) {
      toast.error("กรุณากรอก Order ID อย่างน้อย 1 รายการ", {
        description: "ประเภทเคสนี้ต้องระบุ Order ID",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Create orders array from orderIds
      const orders = orderIds
        .filter((id) => id.trim())
        .map((orderId) => ({
          orderId: orderId.trim(),
          amount: 0,
          providerId: providerId && providerId !== "none" ? providerId : undefined,
        }));

      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedCaseType?.name || "เคสใหม่",
          description,
          caseTypeId,
          source,
          severity,
          providerId: providerId && providerId !== "none" ? providerId : undefined,
          customerName: customerName || undefined,
          customerId: customerId || undefined,
          customerContact: customerContact || undefined,
          orders: orders.length > 0 ? orders : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create case");
      }

      const newCase = await res.json();
      toast.success("สร้างเคสเรียบร้อย", {
        description: `เลขเคส: ${newCase.caseNumber}`,
      });
      
      router.push(`/cases/${newCase.id}`);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถสร้างเคสได้", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Link href="/cases">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">สร้างเคสใหม่</h1>
            <p className="text-muted-foreground">กรอกข้อมูลเพื่อสร้างเคสติดตามปัญหา</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: เลือกประเภทเคส */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>
                เลือกประเภทเคส
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>หมวดหมู่ *</Label>
                  <Select 
                    value={category} 
                    onValueChange={setCategory}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="เลือกหมวดหมู่" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat === "PAYMENT" && "💰 การชำระเงิน"}
                          {cat === "ORDER" && "📦 ออเดอร์"}
                          {cat === "SYSTEM" && "⚙️ ระบบ"}
                          {cat === "PROVIDER" && "🏢 Provider"}
                          {cat === "TECHNICAL" && "🔧 เทคนิค"}
                          {cat === "OTHER" && "📋 อื่นๆ"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ประเภทเคส *</Label>
                  <Select 
                    value={caseTypeId} 
                    onValueChange={setCaseTypeId}
                    required
                    disabled={isLoading || !category}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={category ? "เลือกประเภทเคส" : "เลือกหมวดหมู่ก่อน"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCaseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <span>{type.name}</span>
                            {type.description && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{type.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Selected Case Type Info */}
              {selectedCaseType && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        หัวข้อ: {selectedCaseType.name}
                      </h4>
                      {selectedCaseType.description && (
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          {selectedCaseType.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <Clock className="h-3 w-3" />
                          <span>SLA: {selectedCaseType.defaultSlaMinutes} นาที</span>
                        </div>
                        {selectedCaseType.requireProvider && (
                          <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300">
                            ต้องระบุ Provider
                          </Badge>
                        )}
                        {selectedCaseType.requireOrderId && (
                          <Badge variant="outline" className="text-orange-600 dark:text-orange-400 border-orange-300">
                            ต้องระบุ Order ID
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: รายละเอียดเคส - แสดงหลังเลือกประเภทเคส */}
          {selectedCaseType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>
                  รายละเอียดเคส
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* รายละเอียด */}
                <div className="space-y-2">
                  <Label htmlFor="description">รายละเอียดปัญหา</Label>
                  <Textarea
                    id="description"
                    placeholder="อธิบายปัญหาโดยละเอียด เช่น เกิดอะไรขึ้น, เวลาที่เกิดปัญหา, ข้อมูลเพิ่มเติม..."
                    className="min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>แหล่งที่มา *</Label>
                    <Select 
                      value={source} 
                      onValueChange={setSource}
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกแหล่งที่มา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LINE">📱 Line</SelectItem>
                        <SelectItem value="TICKET">🎫 Ticket</SelectItem>
                        <SelectItem value="API">🔗 API</SelectItem>
                        <SelectItem value="MANUAL">✍️ สร้างเอง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ความรุนแรง *</Label>
                    <Select 
                      value={severity} 
                      onValueChange={setSeverity}
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกความรุนแรง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRITICAL">🔴 วิกฤต</SelectItem>
                        <SelectItem value="HIGH">🟠 สูง</SelectItem>
                        <SelectItem value="NORMAL">🔵 ปกติ</SelectItem>
                        <SelectItem value="LOW">⚪ ต่ำ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Provider */}
                <div className="space-y-2">
                  <Label>
                    Provider {selectedCaseType?.requireProvider && <span className="text-red-500">*</span>}
                  </Label>
                  <Select 
                    value={providerId} 
                    onValueChange={setProviderId}
                    disabled={isLoading}
                    required={selectedCaseType?.requireProvider}
                  >
                    <SelectTrigger className={selectedCaseType?.requireProvider && !providerId ? "border-red-500" : ""}>
                      <SelectValue placeholder={selectedCaseType?.requireProvider ? "เลือก Provider" : "เลือก Provider (ถ้ามี)"} />
                    </SelectTrigger>
                    <SelectContent>
                      {!selectedCaseType?.requireProvider && <SelectItem value="none">ไม่ระบุ</SelectItem>}
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              {/* Order Info - Show if requireOrderId is true */}
              {selectedCaseType?.requireOrderId && (
                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4 flex items-center gap-2">
                    📋 ข้อมูล Order <span className="text-red-500">*</span>
                  </h3>
                  <div className="space-y-3">
                    {/* Order ID Input */}
                    <div className="flex gap-2">
                      <Input
                        id="orderId"
                        placeholder="กรอก Order ID แล้วกด Enter หรือ เพิ่ม"
                        value={orderIdInput}
                        onChange={(e) => setOrderIdInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (orderIdInput.trim()) {
                              setOrderIds([...orderIds, orderIdInput.trim()]);
                              setOrderIdInput("");
                            }
                          }
                        }}
                        disabled={isLoading}
                        className={selectedCaseType?.requireOrderId && orderIds.length === 0 ? "border-red-500" : ""}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (orderIdInput.trim()) {
                            setOrderIds([...orderIds, orderIdInput.trim()]);
                            setOrderIdInput("");
                          }
                        }}
                        disabled={isLoading || !orderIdInput.trim()}
                      >
                        เพิ่ม
                      </Button>
                    </div>
                    
                    {/* Order IDs List */}
                    {orderIds.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">
                          Order ID ที่เพิ่มแล้ว ({orderIds.length} รายการ)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {orderIds.map((id, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="gap-1 pr-1 text-sm"
                            >
                              {id}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-1 hover:bg-destructive/20"
                                onClick={() => {
                                  setOrderIds(orderIds.filter((_, i) => i !== index));
                                }}
                                disabled={isLoading}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground">
                      💡 สามารถเพิ่มได้หลาย Order ID โดยกรอกแล้วกด Enter หรือกดปุ่มเพิ่ม
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Step 3: Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">3</span>
                ข้อมูลลูกค้า (ไม่บังคับ)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">ชื่อลูกค้า</Label>
                  <Input
                    id="customerName"
                    placeholder="ชื่อ-นามสกุล"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerId">User ID</Label>
                  <Input
                    id="customerId"
                    placeholder="รหัสผู้ใช้ในระบบ"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerContact">ช่องทางติดต่อ</Label>
                <Input
                  id="customerContact"
                  placeholder="Line ID, เบอร์โทร, Email"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Link href="/cases">
              <Button variant="outline" disabled={isLoading}>
                ยกเลิก
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={
                isLoading || 
                !category ||
                !caseTypeId || 
                !source ||
                !severity ||
                (selectedCaseType?.requireProvider && (!providerId || providerId === "none")) ||
                (selectedCaseType?.requireOrderId && orderIds.length === 0)
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังสร้าง...
                </>
              ) : (
                "สร้างเคส"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
