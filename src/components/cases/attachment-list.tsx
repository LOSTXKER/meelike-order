"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { File, Image as ImageIcon, FileText, Download, Trash2, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  publicUrl: string;
  uploadedBy: {
    name: string | null;
  };
  createdAt: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
}

export function AttachmentList({ attachments, onDelete }: AttachmentListProps) {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    
    if (fileType === "application/pdf") {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const handleDownload = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("ดาวน์โหลดไฟล์สำเร็จ");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("ไม่สามารถดาวน์โหลดไฟล์ได้");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบไฟล์นี้หรือไม่?")) return;

    try {
      const res = await fetch(`/api/attachments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      onDelete?.(id);
      toast.success("ลบไฟล์สำเร็จ");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("ไม่สามารถลบไฟล์ได้");
    }
  };

  if (attachments.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีไฟล์แนบ</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map((attachment) => (
        <Card key={attachment.id} className="p-4 hover:bg-muted/50 transition-colors">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              {getFileIcon(attachment.fileType)}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <a
                href={attachment.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium hover:underline truncate block"
              >
                {attachment.fileName}
              </a>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{formatFileSize(attachment.fileSize)}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(attachment.createdAt), {
                    addSuffix: true,
                    locale: th,
                  })}
                </span>
                <span>•</span>
                <span>โดย {attachment.uploadedBy.name || "Unknown"}</span>
              </div>
            </div>

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleDownload(attachment.publicUrl, attachment.fileName)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  ดาวน์โหลด
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => window.open(attachment.publicUrl, "_blank")}
                >
                  <File className="h-4 w-4 mr-2" />
                  เปิดในแท็บใหม่
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(attachment.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  ลบ
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Preview for images */}
          {attachment.fileType.startsWith("image/") && (
            <div className="mt-3">
              <img
                src={attachment.publicUrl}
                alt={attachment.fileName}
                className="max-w-full h-auto max-h-48 rounded-lg border"
              />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}


