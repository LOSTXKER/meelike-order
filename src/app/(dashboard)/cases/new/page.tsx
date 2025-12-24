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
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CaseType {
  id: string;
  name: string;
  category: string;
  defaultSeverity: string;
}

interface Provider {
  id: string;
  name: string;
}

export default function NewCasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caseTypeId, setCaseTypeId] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [severity, setSeverity] = useState("NORMAL");
  const [providerId, setProviderId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerContact, setCustomerContact] = useState("");

  useEffect(() => {
    // Load case types and providers
    Promise.all([
      fetch("/api/case-types").then((r) => r.json()),
      fetch("/api/providers").then((r) => r.json()),
    ]).then(([types, provs]) => {
      setCaseTypes(types);
      setProviders(provs.filter((p: Provider & { isActive: boolean }) => p.isActive));
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          caseTypeId,
          source,
          severity,
          providerId: providerId && providerId !== "none" ? providerId : undefined,
          customerName: customerName || undefined,
          customerId: customerId || undefined,
          customerContact: customerContact || undefined,
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
          {/* Case Details */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลเคส</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">หัวข้อ *</Label>
                <Input
                  id="title"
                  placeholder="ระบุหัวข้อปัญหา"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">รายละเอียด</Label>
                <Textarea
                  id="description"
                  placeholder="อธิบายปัญหาโดยละเอียด..."
                  className="min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>ประเภทเคส *</Label>
                  <Select 
                    value={caseTypeId} 
                    onValueChange={setCaseTypeId}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>แหล่งที่มา</Label>
                  <Select 
                    value={source} 
                    onValueChange={setSource}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINE">Line</SelectItem>
                      <SelectItem value="TICKET">Ticket</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                      <SelectItem value="MANUAL">สร้างเอง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>ความรุนแรง</Label>
                  <Select 
                    value={severity} 
                    onValueChange={setSeverity}
                    disabled={isLoading}
                  >
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
                  <Label>Provider</Label>
                  <Select 
                    value={providerId} 
                    onValueChange={setProviderId}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือก Provider (ถ้ามี)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่ระบุ</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลลูกค้า</CardTitle>
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
            <Button type="submit" disabled={isLoading || !caseTypeId || !title}>
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
