"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, X, Download, Loader2, Image, Video, FileText, FileSpreadsheet, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  publicUrl: string;
  createdAt: string;
  uploadedBy: {
    name: string | null;
  };
}

interface FileAttachmentsProps {
  caseId: string;
  onUploadSuccess?: () => void;
}

export function FileAttachments({ caseId, onUploadSuccess }: FileAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAttachments();
  }, [caseId]);

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/attachments?caseId=${caseId}`);
      if (!res.ok) throw new Error("Failed to fetch attachments");
      const data = await res.json();
      setAttachments(data);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("ไฟล์ต้องมีขนาดไม่เกิน 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caseId", caseId);

      const res = await fetch("/api/attachments", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Upload failed");
      }

      toast.success("อัปโหลดไฟล์สำเร็จ");
      fetchAttachments();
      onUploadSuccess?.();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบไฟล์นี้?")) return;

    try {
      const res = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      toast.success("ลบไฟล์สำเร็จ");
      fetchAttachments();
      onUploadSuccess?.();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบไฟล์");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return Image;
    if (fileType.startsWith("video/")) return Video;
    if (fileType.includes("pdf")) return File;
    if (fileType.includes("word") || fileType.includes("document")) return FileText;
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return FileSpreadsheet;
    return Paperclip;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">ไฟล์แนบ ({attachments.length})</CardTitle>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                กำลังอัปโหลด...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                อัปโหลดไฟล์
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">กำลังโหลด...</p>
        ) : attachments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            ยังไม่มีไฟล์แนบ
          </p>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {(() => {
                    const IconComponent = getFileIcon(attachment.fileType);
                    return <IconComponent className="h-8 w-8 text-muted-foreground" />;
                  })()}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{attachment.fileName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.fileSize)}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(attachment.createdAt), {
                          addSuffix: true,
                          locale: th,
                        })}
                      </span>
                      {attachment.uploadedBy.name && (
                        <>
                          <span>•</span>
                          <span>โดย {attachment.uploadedBy.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(attachment.publicUrl, "_blank")}
                    title="ดาวน์โหลด"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(attachment.id)}
                    title="ลบ"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          * รองรับไฟล์ทุกประเภท ขนาดไม่เกิน 10MB
        </p>
      </CardContent>
    </Card>
  );
}

