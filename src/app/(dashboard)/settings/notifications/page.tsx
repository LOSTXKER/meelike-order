"use client";

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
import { Plus, Pencil, Send, MessageSquare, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useNotificationTemplates, useLineChannels } from "@/hooks/use-notifications";
import { LoadingScreen } from "@/components/ui/loading-screen";

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
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates, isFetching: templatesFetching } = useNotificationTemplates();
  const { data: channels = [], isLoading: channelsLoading, refetch: refetchChannels, isFetching: channelsFetching } = useLineChannels();
  
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isChannelDialogOpen, setIsChannelDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [editingChannel, setEditingChannel] = useState<LineChannel | null>(null);
  
  const isLoading = templatesLoading || channelsLoading;

  // Template form state
  const [templateName, setTemplateName] = useState("");
  const [templateEvent, setTemplateEvent] = useState("");
  const [templateText, setTemplateText] = useState("");
  const [templateIsActive, setTemplateIsActive] = useState(true);

  // Channel form state
  const [channelName, setChannelName] = useState("");
  const [channelToken, setChannelToken] = useState("");
  const [channelGroupId, setChannelGroupId] = useState("");
  const [channelEvents, setChannelEvents] = useState<string[]>([]);
  const [channelIsActive, setChannelIsActive] = useState(true);

  // Removed useEffect and load functions - using React Query hooks now

  const resetTemplateForm = () => {
    setTemplateName("");
    setTemplateEvent("");
    setTemplateText("");
    setTemplateIsActive(true);
    setEditingTemplate(null);
  };

  const resetChannelForm = () => {
    setChannelName("");
    setChannelToken("");
    setChannelGroupId("");
    setChannelEvents([]);
    setChannelIsActive(true);
    setEditingChannel(null);
  };

  const openEditTemplateDialog = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateEvent(template.event);
    setTemplateText(template.template);
    setTemplateIsActive(template.isActive);
    setIsTemplateDialogOpen(true);
  };

  const openEditChannelDialog = (channel: LineChannel) => {
    setEditingChannel(channel);
    setChannelName(channel.name);
    setChannelToken(channel.accessToken);
    setChannelGroupId(channel.defaultGroupId || "");
    setChannelEvents(channel.enabledEvents);
    setChannelIsActive(channel.isActive);
    setIsChannelDialogOpen(true);
  };

  const handleSubmitTemplate = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: templateName,
      event: templateEvent,
      template: templateText,
      isActive: templateIsActive,
    };

    try {
      let res;
      if (editingTemplate) {
        res = await fetch(`/api/notifications/templates/${editingTemplate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/notifications/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed");

      toast.success(editingTemplate ? "อัพเดท Template เรียบร้อย" : "สร้าง Template เรียบร้อย");
      setIsTemplateDialogOpen(false);
      refetchTemplates();
      resetTemplateForm();
    } catch (error) {
      console.error(error);
      toast.error(editingTemplate ? "ไม่สามารถอัพเดท Template ได้" : "ไม่สามารถสร้าง Template ได้");
    }
  };

  const handleSubmitChannel = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: channelName,
      accessToken: channelToken,
      defaultGroupId: channelGroupId || null,
      enabledEvents: channelEvents,
      isActive: channelIsActive,
    };

    try {
      let res;
      if (editingChannel) {
        res = await fetch(`/api/notifications/channels/${editingChannel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/notifications/channels", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error("Failed");

      toast.success(editingChannel ? "อัพเดท Channel เรียบร้อย" : "เพิ่ม Channel เรียบร้อย");
      setIsChannelDialogOpen(false);
      refetchChannels();
      resetChannelForm();
    } catch (error) {
      console.error(error);
      toast.error(editingChannel ? "ไม่สามารถอัพเดท Channel ได้" : "ไม่สามารถเพิ่ม Channel ได้");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("ต้องการลบ Template นี้หรือไม่?")) return;

    try {
      const res = await fetch(`/api/notifications/templates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("ลบ Template เรียบร้อย");
      refetchTemplates();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถลบ Template ได้");
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (!confirm("ต้องการลบ Channel นี้หรือไม่?")) return;

    try {
      const res = await fetch(`/api/notifications/channels/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("ลบ Channel เรียบร้อย");
      refetchChannels();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถลบ Channel ได้");
    }
  };

  const insertVariable = (variable: string) => {
    setTemplateText((prev) => prev + " " + variable);
  };

  if (isLoading) {
    return <LoadingScreen title="กำลังโหลดการแจ้งเตือน" variant="minimal" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">การแจ้งเตือน</h1>
        <p className="text-sm text-muted-foreground">
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
              <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
                setIsTemplateDialogOpen(open);
                if (!open) resetTemplateForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่ม Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingTemplate ? "แก้ไข Template" : "เพิ่ม Notification Template"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitTemplate} className="space-y-4">
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

                    {editingTemplate && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="template-active"
                          checked={templateIsActive}
                          onChange={(e) => setTemplateIsActive(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="template-active" className="cursor-pointer">
                          เปิดใช้งาน
                        </Label>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsTemplateDialogOpen(false);
                          resetTemplateForm();
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="submit">
                        {editingTemplate ? "บันทึกการแก้ไข" : "สร้าง Template"}
                      </Button>
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
                    <TableHead className="w-[100px]"></TableHead>
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
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditTemplateDialog(template)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTemplate(template.id)}
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
          </TabsContent>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-4">
            <div className="flex items-center justify-end">
              <Dialog open={isChannelDialogOpen} onOpenChange={(open) => {
                setIsChannelDialogOpen(open);
                if (!open) resetChannelForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    เพิ่ม Line Channel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingChannel ? "แก้ไข Line Channel" : "เพิ่ม Line Channel"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitChannel} className="space-y-4">
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

                    {editingChannel && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="channel-active"
                          checked={channelIsActive}
                          onChange={(e) => setChannelIsActive(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="channel-active" className="cursor-pointer">
                          เปิดใช้งาน
                        </Label>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChannelDialogOpen(false);
                          resetChannelForm();
                        }}
                      >
                        ยกเลิก
                      </Button>
                      <Button type="submit">
                        {editingChannel ? "บันทึกการแก้ไข" : "เพิ่ม Channel"}
                      </Button>
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => openEditChannelDialog(channel)}
                        >
                          <Pencil className="h-3 w-3 mr-2" />
                          แก้ไข
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteChannel(channel.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
