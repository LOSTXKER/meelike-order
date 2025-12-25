"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, File, Image as ImageIcon, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FileUploadProps {
  caseId: string;
  onUploadComplete?: (attachment: any) => void;
  maxSize?: number; // in MB
  accept?: string;
}

export function FileUpload({
  caseId,
  onUploadComplete,
  maxSize = 10,
  accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt",
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate file sizes
    const validFiles = selectedFiles.filter((file) => {
      const sizeMB = file.size / 1024 / 1024;
      if (sizeMB > maxSize) {
        toast.error(`${file.name} เกินขนาด ${maxSize}MB`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caseId", caseId);

        const res = await fetch("/api/attachments", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const attachment = await res.json();
        onUploadComplete?.(attachment);

        // Remove uploaded file from list
        setFiles((prev) => prev.filter((f) => f !== file));
      }

      toast.success("อัพโหลดไฟล์สำเร็จ");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("ไม่สามารถอัพโหลดไฟล์ได้");
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />;
    }
    
    if (["pdf"].includes(ext || "")) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
          "hover:border-primary hover:bg-primary/5",
          "border-border bg-muted/20"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="flex flex-col items-center justify-center gap-2 text-center">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">คลิกเพื่ออัพโหลดไฟล์</p>
            <p className="text-sm text-muted-foreground">
              หรือลากไฟล์มาวาง (สูงสุด {maxSize}MB)
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            รองรับ: รูปภาพ, PDF, เอกสาร
          </p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              ไฟล์ที่เลือก ({files.length})
            </p>
            {!uploading && (
              <Button size="sm" onClick={uploadFiles}>
                อัพโหลดทั้งหมด
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center gap-3">
                  {getFileIcon(file.name)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {!uploading && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {uploading && (
        <div className="flex items-center justify-center gap-2 p-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm text-muted-foreground">กำลังอัพโหลด...</p>
        </div>
      )}
    </div>
  );
}



