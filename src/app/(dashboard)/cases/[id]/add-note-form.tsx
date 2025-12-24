"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, useRef } from "react";
import { toast } from "sonner";

interface AddNoteFormProps {
  caseId: string;
}

export function AddNoteForm({ caseId }: AddNoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("ไฟล์มีขนาดใหญ่เกิน 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note.trim() && !file) return;

    setIsUploading(true);

    try {
      let attachmentUrl: string | undefined;

      // Upload file first if exists
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caseId", caseId);

        const uploadRes = await fetch("/api/attachments", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file");
        }

        const uploadData = await uploadRes.json();
        attachmentUrl = uploadData.publicUrl;
      }

      // Add note/activity
      if (note.trim() || attachmentUrl) {
        const res = await fetch(`/api/cases/${caseId}/activities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: file ? "FILE_ATTACHED" : "NOTE_ADDED",
            title: file ? `แนบไฟล์: ${file.name}` : "เพิ่มบันทึก",
            description: note || `อัปโหลดไฟล์ ${file?.name}`,
            attachmentUrl,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to add note");
        }
      }

      toast.success(file ? "อัปโหลดไฟล์สำเร็จ" : "เพิ่มบันทึกเรียบร้อย");
      setNote("");
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถบันทึกได้");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label>บันทึกหรือแนบไฟล์</Label>
        <Textarea
          placeholder="เพิ่มบันทึก..."
          className="min-h-[80px] resize-none"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isPending || isUploading}
        />
      </div>

      {/* File Input */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        
        {file ? (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm flex-1">{file.name}</span>
            <span className="text-xs text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRemoveFile}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isUploading}
          >
            <Paperclip className="h-4 w-4 mr-2" />
            แนบไฟล์
          </Button>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          className="gap-2"
          type="submit"
          disabled={isPending || isUploading || (!note.trim() && !file)}
        >
          <Send className="h-4 w-4" />
          {isUploading ? "กำลังอัปโหลด..." : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}
