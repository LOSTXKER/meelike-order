"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/cases/file-upload";
import { AttachmentList } from "@/components/cases/attachment-list";
import { Paperclip } from "lucide-react";
import { useEffect, useState } from "react";

interface AttachmentsTabProps {
  caseId: string;
}

export function AttachmentsTab({ caseId }: AttachmentsTabProps) {
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAttachments = async () => {
    try {
      const res = await fetch(`/api/attachments?caseId=${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error("Load attachments error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttachments();
  }, [caseId]);

  const handleUploadComplete = (newAttachment: any) => {
    setAttachments((prev) => [newAttachment, ...prev]);
  };

  const handleDelete = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          ไฟล์แนบ ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">ไฟล์ทั้งหมด</TabsTrigger>
            <TabsTrigger value="upload">อัพโหลดไฟล์</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">กำลังโหลด...</p>
            ) : (
              <AttachmentList
                attachments={attachments}
                onDelete={handleDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="upload">
            <FileUpload
              caseId={caseId}
              onUploadComplete={handleUploadComplete}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

