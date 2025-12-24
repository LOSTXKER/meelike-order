"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Send, Copy, Eye, EyeOff } from "lucide-react";

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  description?: string;
  lastSuccess?: string;
  lastFailure?: string;
  failureCount: number;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { value: "case.created", label: "Case Created" },
  { value: "case.updated", label: "Case Updated" },
  { value: "case.status_changed", label: "Status Changed" },
  { value: "case.assigned", label: "Case Assigned" },
  { value: "case.resolved", label: "Case Resolved" },
  { value: "case.closed", label: "Case Closed" },
  { value: "case.note_added", label: "Note Added" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    description: "",
    events: [] as string[],
    isActive: true,
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWebhooks(data);
    } catch (error) {
      toast.error("ไม่สามารถโหลด webhooks ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.url) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create");

      const newWebhook = await res.json();
      toast.success("สร้าง Webhook สำเร็จ", {
        description: "คัดลอก Secret เก็บไว้ในระบบปลายทาง",
      });

      setWebhooks([newWebhook, ...webhooks]);
      setIsDialogOpen(false);
      setFormData({
        name: "",
        url: "",
        description: "",
        events: [],
        isActive: true,
      });
    } catch (error) {
      toast.error("ไม่สามารถสร้าง Webhook ได้");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบ Webhook นี้?")) return;

    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("ลบ Webhook สำเร็จ");
      setWebhooks(webhooks.filter((w) => w.id !== id));
    } catch (error) {
      toast.error("ไม่สามารถลบ Webhook ได้");
    }
  };

  const handleTest = async (id: string) => {
    toast.loading("กำลังส่ง test webhook...");

    try {
      const res = await fetch(`/api/webhooks/${id}/test`, {
        method: "POST",
      });

      const result = await res.json();
      toast.dismiss();

      if (result.success) {
        toast.success("Test Webhook สำเร็จ", {
          description: `Status: ${result.statusCode}`,
        });
      } else {
        toast.error("Test Webhook ล้มเหลว", {
          description: result.error,
        });
      }

      fetchWebhooks(); // Refresh to update stats
    } catch (error) {
      toast.dismiss();
      toast.error("ไม่สามารถทดสอบ Webhook ได้");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast.success(isActive ? "เปิดใช้งาน Webhook แล้ว" : "ปิดใช้งาน Webhook แล้ว");
      fetchWebhooks();
    } catch (error) {
      toast.error("ไม่สามารถอัพเดทสถานะได้");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกแล้ว");
  };

  const toggleShowSecret = (id: string) => {
    setShowSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="p-6">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Webhooks</h1>
            <p className="text-muted-foreground">
              ส่ง event notifications ไปยังระบบภายนอก
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Webhook</DialogTitle>
                <DialogDescription>
                  เพิ่ม webhook endpoint ใหม่เพื่อรับ event notifications
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    placeholder="Production API"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input
                    placeholder="https://api.example.com/webhooks"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Optional description..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Events to Subscribe</Label>
                  <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                    {AVAILABLE_EVENTS.map((event) => (
                      <div key={event.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={event.value}
                          checked={formData.events.includes(event.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                events: [...formData.events, event.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                events: formData.events.filter(
                                  (e) => e !== event.value
                                ),
                              });
                            }
                          }}
                        />
                        <label
                          htmlFor={event.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {event.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>Create Webhook</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Webhooks List */}
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                ยังไม่มี Webhook ที่ตั้งค่าไว้
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                เพิ่ม Webhook เพื่อรับ event notifications
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{webhook.name}</CardTitle>
                        <Badge variant={webhook.isActive ? "default" : "secondary"}>
                          {webhook.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {webhook.failureCount > 0 && (
                          <Badge variant="destructive">
                            {webhook.failureCount} failures
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="font-mono text-xs">
                        {webhook.url}
                      </CardDescription>
                      {webhook.description && (
                        <p className="text-sm text-muted-foreground">
                          {webhook.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.isActive}
                        onCheckedChange={(checked) =>
                          handleToggleActive(webhook.id, checked)
                        }
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(webhook.id)}
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(webhook.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Secret */}
                  <div className="space-y-2">
                    <Label className="text-xs">Secret (for signature verification)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        type={showSecrets[webhook.id] ? "text" : "password"}
                        value={webhook.secret}
                        className="font-mono text-xs"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => toggleShowSecret(webhook.id)}
                      >
                        {showSecrets[webhook.id] ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyToClipboard(webhook.secret)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-2">
                    <Label className="text-xs">Subscribed Events</Label>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="outline">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    {webhook.lastSuccess && (
                      <div>
                        <p className="text-xs text-muted-foreground">Last Success</p>
                        <p className="text-sm">
                          {new Date(webhook.lastSuccess).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {webhook.lastFailure && (
                      <div>
                        <p className="text-xs text-muted-foreground">Last Failure</p>
                        <p className="text-sm text-destructive">
                          {new Date(webhook.lastFailure).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle>📖 Webhook Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Signature Verification</h4>
              <p className="text-muted-foreground mb-2">
                ทุก webhook request จะมี header <code>X-Webhook-Signature</code>{" "}
                ที่เป็น HMAC SHA256 signature ของ request body
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`const crypto = require('crypto');

function verifySignature(body, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(body);
  const expectedSignature = hmac.digest('hex');
  return signature === expectedSignature;
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Payload Structure</h4>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{`{
  "event": "case.created",
  "timestamp": "2025-12-24T12:00:00.000Z",
  "data": {
    "caseId": "...",
    "caseNumber": "CASE-2025-0001",
    "title": "...",
    "status": "NEW",
    "severity": "NORMAL"
  }
}`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Response Requirements</h4>
              <p className="text-muted-foreground">
                - ต้อง respond ภายใน 10 วินาที<br />
                - HTTP status code 2xx = success<br />
                - อื่นๆ = failure และจะ retry อีก 3 ครั้ง
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

