"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface AddNoteFormProps {
  caseId: string;
}

export function AddNoteForm({ caseId }: AddNoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!note.trim()) return;

    try {
      const res = await fetch(`/api/cases/${caseId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE_ADDED",
          title: "เพิ่มบันทึก",
          description: note,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add note");
      }

      toast.success("เพิ่มบันทึกเรียบร้อย");
      setNote("");
      
      startTransition(() => {
        router.refresh();
      });
    } catch {
      toast.error("ไม่สามารถเพิ่มบันทึกได้");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="เพิ่มบันทึก..."
        className="min-h-[80px] resize-none"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        disabled={isPending}
      />
      <div className="flex justify-end">
        <Button className="gap-2" type="submit" disabled={isPending || !note.trim()}>
          <Send className="h-4 w-4" />
          บันทึก
        </Button>
      </div>
    </form>
  );
}

