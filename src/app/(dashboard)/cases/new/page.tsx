"use client";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Info, Clock, X, CheckCircle2, DollarSign, Package, Settings, Building2, FileText, AlertCircle, AlertTriangle, User, Phone, Hash, Ticket, Upload, Image as ImageIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
  isActive: boolean;
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
  const [source, setSource] = useState<"LINE" | "TICKET" | "">("");
  const [severity, setSeverity] = useState("");
  const [providerId, setProviderId] = useState("");
  // Customer info - based on source (LINE/TICKET)
  const [customerName, setCustomerName] = useState("");
  // LINE fields
  const [chatUrl, setChatUrl] = useState("");
  const [chatName, setChatName] = useState("");
  // TICKET fields
  const [ticketUrl, setTicketUrl] = useState("");
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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
      setProviders(provs.filter((p: Provider) => p.isActive));
      
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isImage) {
        toast.error(`${file.name} ไม่ใช่ไฟล์รูปภาพ`);
        return false;
      }
      if (!isUnder5MB) {
        toast.error(`${file.name} มีขนาดเกิน 5MB`);
        return false;
      }
      return true;
    });
    
    setAttachments([...attachments, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

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

    // Validate customer name (required)
    if (!customerName.trim()) {
      toast.error("กรุณากรอกชื่อลูกค้า");
      setIsLoading(false);
      return;
    }

    // Validate fields based on source (LINE/TICKET)
    if (source === "LINE") {
      if (!chatUrl.trim()) {
        toast.error("กรุณากรอก URL แชท");
        setIsLoading(false);
        return;
      }
      if (!chatName.trim()) {
        toast.error("กรุณากรอกชื่อแชท");
        setIsLoading(false);
        return;
      }
    } else if (source === "TICKET") {
      if (!ticketUrl.trim()) {
        toast.error("กรุณากรอก URL Ticket");
        setIsLoading(false);
        return;
      }
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
          customerName: customerName.trim(),
          // Store source-specific contact info
          customerContact: source === "LINE" 
            ? `${chatUrl}|${chatName}` 
            : source === "TICKET" 
            ? ticketUrl 
            : undefined,
          orders: orders.length > 0 ? orders : undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create case");
      }

      const newCase = await res.json();

      // Upload attachments if any
      if (attachments.length > 0) {
        setUploading(true);
        try {
          const uploadPromises = attachments.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('caseId', newCase.id);
            
            const uploadRes = await fetch('/api/attachments', {
              method: 'POST',
              body: formData,
            });
            
            if (!uploadRes.ok) {
              throw new Error(`Failed to upload ${file.name}`);
            }
            return uploadRes.json();
          });

          await Promise.all(uploadPromises);
          toast.success("อัปโหลดไฟล์เรียบร้อย", {
            description: `อัปโหลด ${attachments.length} ไฟล์`,
          });
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.warning("สร้างเคสสำเร็จแต่อัปโหลดไฟล์บางไฟล์ไม่สำเร็จ");
        } finally {
          setUploading(false);
        }
      }

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
    <div className="min-h-screen pb-10">
      <Header />
      
      <div className="p-3 sm:p-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Link href="/cases">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">สร้างเคสใหม่</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">กรอกข้อมูลเพื่อสร้างเคสติดตามปัญหา</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            
            {/* Main Column - Left Side */}
            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
              
              {/* Step 1: ประเภทเคส & รายละเอียด */}
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    ข้อมูลเคส
                  </CardTitle>
                  <CardDescription>ระบุประเภทของปัญหาและรายละเอียด</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Category & Case Type Selectors */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">หมวดหมู่ <span className="text-red-500">*</span></Label>
                      <Select 
                        value={category} 
                        onValueChange={setCategory}
                        required
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-11 bg-muted/20">
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              <span className="flex items-center gap-2">
                                {cat === "PAYMENT" && <DollarSign className="h-4 w-4 text-green-500" />}
                                {cat === "ORDER" && <Package className="h-4 w-4 text-blue-500" />}
                                {cat === "SYSTEM" && <Settings className="h-4 w-4 text-purple-500" />}
                                {cat === "PROVIDER" && <Building2 className="h-4 w-4 text-orange-500" />}
                                {cat === "OTHER" && <FileText className="h-4 w-4 text-gray-500" />}
                                <span className="font-medium">
                                  {cat === "PAYMENT" && "การชำระเงิน"}
                                  {cat === "ORDER" && "ออเดอร์"}
                                  {cat === "SYSTEM" && "ระบบ"}
                                  {cat === "PROVIDER" && "Provider"}
                                  {cat === "OTHER" && "อื่นๆ"}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">หัวข้อปัญหา <span className="text-red-500">*</span></Label>
                      <Select 
                        value={caseTypeId} 
                        onValueChange={setCaseTypeId}
                        required
                        disabled={isLoading || !category}
                      >
                        <SelectTrigger className="h-11 bg-muted/20">
                          <SelectValue placeholder={category ? "เลือกหัวข้อปัญหา" : "กรุณาเลือกหมวดหมู่ก่อน"} />
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
                                        <Info className="h-3.5 w-3.5 text-muted-foreground" />
                                      </TooltipTrigger>
                                      <TooltipContent side="right">
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

                  {/* Info Box */}
                  {selectedCaseType && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="rounded-lg border border-primary/10 bg-primary/5 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-semibold text-primary">
                                {selectedCaseType.name}
                              </h4>
                              {selectedCaseType.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {selectedCaseType.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="bg-background/50 gap-1.5 py-1">
                                <Clock className="h-3 w-3" />
                                SLA: {selectedCaseType.defaultSlaMinutes} นาที
                              </Badge>
                              {selectedCaseType.requireProvider && (
                                <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                                  ต้องระบุ Provider
                                </Badge>
                              )}
                              {selectedCaseType.requireOrderId && (
                                <Badge variant="destructive" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800">
                                  ต้องระบุ Order ID
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description - Show only when type is selected */}
                  {selectedCaseType && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label htmlFor="description" className="text-sm font-medium">
                        รายละเอียดเพิ่มเติม
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="อธิบายปัญหาที่พบอย่างละเอียด..."
                        className="min-h-[120px] resize-none bg-muted/20"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Order Info (Conditional) */}
              {selectedCaseType?.requireOrderId && (
                <Card className="border-none shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      ข้อมูล Order <span className="text-red-500 text-sm ml-1">* จำเป็น</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="orderId"
                          placeholder="กรอก Order ID แล้วกด Enter"
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
                          className={cn(
                            "pl-9 h-11 bg-muted/20",
                            selectedCaseType?.requireOrderId && orderIds.length === 0 ? "border-red-300 focus-visible:ring-red-300" : ""
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          if (orderIdInput.trim()) {
                            setOrderIds([...orderIds, orderIdInput.trim()]);
                            setOrderIdInput("");
                          }
                        }}
                        disabled={isLoading || !orderIdInput.trim()}
                        className="h-11 px-4 sm:px-6 w-full sm:w-auto"
                      >
                        เพิ่ม
                      </Button>
                    </div>
                    
                    {/* Order IDs List */}
                    {orderIds.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {orderIds.map((id, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="pl-3 pr-1 py-1.5 text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                          >
                            {id}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 ml-1.5 rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/50"
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
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                        ยังไม่มี Order ID ที่ถูกเพิ่ม
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Attachments (Optional) */}
              {selectedCaseType && (
                <Card className="border-none shadow-md animate-in fade-in duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-purple-500" />
                      แนบไฟล์ภาพ (Optional)
                    </CardTitle>
                    <CardDescription>อัปโหลดภาพหน้าจอหรือหลักฐานประกอบ (สูงสุด 5MB/ไฟล์)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Upload Button */}
                    <div>
                      <label 
                        htmlFor="file-upload" 
                        className={cn(
                          "flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                          "hover:bg-muted/50 border-muted-foreground/25 hover:border-primary/50",
                          isLoading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">PNG, JPG, JPEG (MAX. 5MB)</p>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handleFileChange}
                          disabled={isLoading}
                        />
                      </label>
                    </div>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">ไฟล์ที่แนบ ({attachments.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="relative group rounded-lg border bg-muted/30 p-3 flex items-center gap-3"
                            >
                              <ImageIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => removeAttachment(index)}
                                disabled={isLoading}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar Column - Right Side */}
            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
              
              {/* Card 2: Settings (Source, Severity, Provider) */}
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    การตั้งค่า
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Source - determines customer info fields */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">แหล่งที่มา <span className="text-red-500">*</span></Label>
                    <Select 
                      value={source} 
                      onValueChange={(value: "LINE" | "TICKET") => {
                        setSource(value);
                        // Reset source-specific fields
                        setChatUrl("");
                        setChatName("");
                        setTicketUrl("");
                      }}
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-muted/20">
                        <SelectValue placeholder="เลือกแหล่งที่มา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LINE">
                          <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-green-500" /> Line</span>
                        </SelectItem>
                        <SelectItem value="TICKET">
                          <span className="flex items-center gap-2"><Ticket className="h-4 w-4 text-blue-500" /> Ticket</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Severity */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">ความรุนแรง <span className="text-red-500">*</span></Label>
                    <Select 
                      value={severity} 
                      onValueChange={setSeverity}
                      required
                      disabled={isLoading}
                    >
                      <SelectTrigger className="bg-muted/20">
                        <SelectValue placeholder="เลือกความรุนแรง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CRITICAL">
                          <span className="flex items-center gap-2 text-red-600 font-medium">
                            <AlertCircle className="h-4 w-4" /> วิกฤต
                          </span>
                        </SelectItem>
                        <SelectItem value="HIGH">
                          <span className="flex items-center gap-2 text-orange-600 font-medium">
                            <AlertTriangle className="h-4 w-4" /> สูง
                          </span>
                        </SelectItem>
                        <SelectItem value="NORMAL">
                          <span className="flex items-center gap-2 text-blue-600 font-medium">
                            <Info className="h-4 w-4" /> ปกติ
                          </span>
                        </SelectItem>
                        <SelectItem value="LOW">
                          <span className="flex items-center gap-2 text-gray-600 font-medium">
                            <CheckCircle2 className="h-4 w-4" /> ต่ำ
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Provider */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                      Provider {selectedCaseType?.requireProvider && <span className="text-red-500">*</span>}
                    </Label>
                    <Select 
                      value={providerId} 
                      onValueChange={setProviderId}
                      disabled={isLoading}
                      required={selectedCaseType?.requireProvider}
                    >
                      <SelectTrigger className={cn(
                        "bg-muted/20",
                        selectedCaseType?.requireProvider && !providerId ? "border-red-300" : ""
                      )}>
                        <SelectValue placeholder={selectedCaseType?.requireProvider ? "เลือก Provider" : "ไม่ระบุ"} />
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
                </CardContent>
              </Card>

              {/* Card 3: Customer Info - Based on Source */}
              {source && (
              <Card className="border-none shadow-md animate-in fade-in duration-300">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ข้อมูลลูกค้า ({source === "LINE" ? "Line" : "Ticket"})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Customer Name - Required */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase">
                      ชื่อลูกค้า <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      placeholder="กรอกชื่อลูกค้า (username)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      disabled={isLoading}
                      required
                      className={cn(
                        "bg-muted/20",
                        !customerName.trim() && "border-red-300"
                      )}
                    />
                  </div>

                  {/* LINE Fields */}
                  {source === "LINE" && (
                    <div className="space-y-3 animate-in fade-in duration-300">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                          URL แชท <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="https://line.me/..."
                          value={chatUrl}
                          onChange={(e) => setChatUrl(e.target.value)}
                          disabled={isLoading}
                          required
                          className={cn(
                            "bg-muted/20",
                            source === "LINE" && !chatUrl.trim() && "border-red-300"
                          )}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase">
                          ชื่อแชท <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="ชื่อแชท Line"
                          value={chatName}
                          onChange={(e) => setChatName(e.target.value)}
                          disabled={isLoading}
                          required
                          className={cn(
                            "bg-muted/20",
                            source === "LINE" && !chatName.trim() && "border-red-300"
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* TICKET Fields */}
                  {source === "TICKET" && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase">
                        URL Ticket <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        placeholder="https://..."
                        value={ticketUrl}
                        onChange={(e) => setTicketUrl(e.target.value)}
                        disabled={isLoading}
                        required
                        className={cn(
                          "bg-muted/20",
                          source === "TICKET" && !ticketUrl.trim() && "border-red-300"
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Actions - Sticky bottom on mobile, inline on desktop sidebar */}
              <div className="pt-4 flex flex-col gap-3">
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full shadow-lg hover:shadow-xl transition-all"
                  disabled={
                    isLoading || 
                    uploading ||
                    !category ||
                    !caseTypeId || 
                    !source ||
                    !severity ||
                    !customerName.trim() ||
                    (source === "LINE" && (!chatUrl.trim() || !chatName.trim())) ||
                    (source === "TICKET" && !ticketUrl.trim()) ||
                    (selectedCaseType?.requireProvider && (!providerId || providerId === "none")) ||
                    (selectedCaseType?.requireOrderId && orderIds.length === 0)
                  }
                >
                  {isLoading || uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {uploading ? "กำลังอัปโหลดไฟล์..." : "กำลังสร้าง..."}
                    </>
                  ) : (
                    "สร้างเคส"
                  )}
                </Button>
                <Link href="/cases" className="w-full">
                  <Button variant="outline" className="w-full" disabled={isLoading}>
                    ยกเลิก
                  </Button>
                </Link>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
