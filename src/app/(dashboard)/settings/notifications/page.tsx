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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface NotificationTemplate {
  id: string;
  name: string;
  event: string;
  template: string;
  isActive: boolean;
}

interface LineChannel {
  id: string;
  name: string;
  accessToken: string;
  defaultGroupId: string | null;
  enabledEvents: string[];
  isActive: boolean;
}

const AVAILABLE_EVENTS = [
  { value: "case_created", label: "สร้างเคสใหม่" },
  { value: "case_assigned", label: "มอบหมายเคส" },
  { value: "case_status_changed", label: "เปลี่ยนสถานะเคส" },
  { value: "case_resolved", label: "แก้ไขเคสเสร็จ" },
  { value: "sla_warning", label: "SLA ใกล้หมดเวลา" },
  { value: "sla_missed", label: "SLA เกินกำหนด" },
  { value: "provider_issue", label: "Provider มีปัญหา" },
];

const TEMPLATE_VARIABLES = [
  "{{case_number}}",
  "{{case_title}}",
  "{{status}}",
  "{{severity}}",
  "{{customer_name}}",
  "{{owner_name}}",
  "{{provider_name}}",
  "{{sla_remaining}}",
];

export default function NotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [channels, setChannels] = useState<LineChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);

  // Template form state
  const [templateName, setTemplateName] = useState("");
  const [templateEvent, setTemplateEvent] = useState("");
  const [templateText, setTemplateText] = useState("");

  // Channel form state
  const [channelName, setChannelName] = useState("");
  const [channelToken, setChannelToken] = useState("");
  const [channelGroupId, setChannelGroupId] = useState("");
  const [channelEvents, setChannelEvents] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
    loadChannels();
  }, []);

  const loadTemplates = () => {
    fetch("/api/notifications/templates")
      .then((r) => r.json())
      .then((d) => {
        setTemplates(d);
        setIsLoading(false);
      });
  };

  const loadChannels = () => {
    fetch("/api/notifications/channels")
      .then((r) => r.json())
      .then((d) => {
        setChannels(d);
      });
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/notifications/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          event: templateEvent,
          template: templateText,
        }),
      });

      if (!res.ok) throw new Error("Failed to create template");

      toast.success("สร้าง Template เรียบร้อย");
      setIsTemplateDialogOpen(false);
      loadTemplates();

      // Reset form
      setTemplateName("");
      setTemplateEvent("");
      setTemplateText("");
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถสร้าง Template ได้");
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/notifications/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: channelName,
          accessToken: channelToken,
          defaultGroupId: channelGroupId || null,
          enabledEvents: channelEvents,
        }),
      });

      if (!res.ok) throw new Error("Failed to create channel");

      toast.success("เพิ่ม Line Channel เรียบร้อย");
      setIsChannelDialogOpen(false);
      loadChannels();

      // Reset form
      setChannelName("");
      setChannelToken("");
      setChannelGroupId("");
      setChannelEvents([]);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถเพิ่ม Channel ได้");
    }
  };

  const insertVariable = (variable: string) => {
    setTemplateText((prev) => prev + " " + variable);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="การแจ้งเตือน" />
        <div className="p-6 flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="ตั้งค่า - การแจ้งเตือน" />

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-semibold">การแจ้งเตือน</h2>
          <p className="text-muted-foreground">
            จัดการ Line Notification และ Template
          </p>
        </div>

        <Tabs defaultValue="templates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="templates">
              <MessageSquare className="h-4 w-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="channels">
              <Send className="h-4 w-4 mr-2" />
              Line Channels
            </TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-end">
              <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่ม Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>เพิ่ม Notification Template</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-name">ชื่อ Template *</Label>
                      <Input
                        id="template-name"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="เช่น เคสใหม่สำหรับทีม"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-event">Event *</Label>
                      <Input
                        id="template-event"
                        value={templateEvent}
                        onChange={(e) => setTemplateEvent(e.target.value)}
                        placeholder="เช่น case_created"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Event IDs: {AVAILABLE_EVENTS.map((e) => e.value).join(", ")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="template-text">ข้อความ Template *</Label>
                      <Textarea
                        id="template-text"
                        value={templateText}
                        onChange={(e) => setTemplateText(e.target.value)}
                        placeholder="พิมพ์ข้อความ Template..."
                        className="min-h-[120px]"
                        required
                      />
                      <div className="flex flex-wrap gap-1 mt-2">
                        {TEMPLATE_VARIABLES.map((v) => (
                          <Button
                            key={v}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => insertVariable(v)}
                          >
                            {v}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsTemplateDialogOpen(false)}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="submit">สร้าง Template</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>ชื่อ</TableHead>
                    <TableHead className="w-[150px]">Event</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead className="w-[80px]">สถานะ</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        ไม่พบ Template
                      </TableCell>
                    </TableRow>
                  ) : (
                    templates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {template.event}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.template}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            template.isActive ? "bg-green-500" : "bg-gray-400"
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
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-4">
            <div className="flex items-center justify-end">
              <Dialog open={isChannelDialogOpen} onOpenChange={setIsChannelDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่ม Line Channel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>เพิ่ม Line Channel</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateChannel} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="channel-name">ชื่อ Channel *</Label>
                      <Input
                        id="channel-name"
                        value={channelName}
                        onChange={(e) => setChannelName(e.target.value)}
                        placeholder="เช่น ทีม Support"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channel-token">Access Token *</Label>
                      <Textarea
                        id="channel-token"
                        value={channelToken}
                        onChange={(e) => setChannelToken(e.target.value)}
                        placeholder="ใส่ Line Channel Access Token"
                        className="min-h-[80px] font-mono text-xs"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channel-group">Default Group ID (Optional)</Label>
                      <Input
                        id="channel-group"
                        value={channelGroupId}
                        onChange={(e) => setChannelGroupId(e.target.value)}
                        placeholder="ใส่ Line Group ID"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Events ที่ต้องการแจ้งเตือน</Label>
                      <div className="space-y-2">
                        {AVAILABLE_EVENTS.map((event) => (
                          <div key={event.value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`event-${event.value}`}
                              checked={channelEvents.includes(event.value)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setChannelEvents([...channelEvents, event.value]);
                                } else {
                                  setChannelEvents(channelEvents.filter((ev) => ev !== event.value));
                                }
                              }}
                              className="rounded"
                            />
                            <Label htmlFor={`event-${event.value}`} className="cursor-pointer">
                              {event.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsChannelDialogOpen(false)}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="submit">เพิ่ม Channel</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {channels.length === 0 ? (
                <Card className="md:col-span-2 lg:col-span-3">
                  <CardContent className="flex items-center justify-center h-32">
                    <p className="text-muted-foreground">ไม่พบ Line Channel</p>
                  </CardContent>
                </Card>
              ) : (
                channels.map((channel) => (
                  <Card key={channel.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          channel.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Access Token</p>
                        <p className="font-mono text-xs truncate">
                          {channel.accessToken.slice(0, 20)}...
                        </p>
                      </div>
                      {channel.defaultGroupId && (
                        <div>
                          <p className="text-xs text-muted-foreground">Group ID</p>
                          <p className="text-sm">{channel.defaultGroupId}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Enabled Events</p>
                        <div className="flex flex-wrap gap-1">
                          {(channel.enabledEvents as string[]).map((event) => (
                            <Badge key={event} variant="outline" className="text-xs">
                              {AVAILABLE_EVENTS.find((e) => e.value === event)?.label || event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full">
                        <Pencil className="h-3 w-3 mr-2" />
                        แก้ไข
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
