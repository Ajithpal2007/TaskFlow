"use client";

import { useRef } from "react"; // 🟢 1. Import useRef
import { Paperclip, X, FileIcon, Download, Loader2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useUploadThing } from "@/app/lib/uploadthing";

export function TaskAttachments({ task }: { task: any }) {
  const queryClient = useQueryClient();
  // 🟢 2. Create the reference
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveAttachmentMutation = useMutation({
    mutationFn: async (fileData: { name: string; url: string; size: number; type: string }) => {
      console.log("🚀 1. FRONTEND: Attempting to save to database...", fileData);
      // Let's see exactly where this is trying to go!
      const res = await apiClient.post(`/tasks/${task.id}/attachments`, fileData);
      return res.data;
    },
    onSuccess: () => {
      console.log("✅ 3. FRONTEND: Successfully saved to database!");
      queryClient.invalidateQueries({ queryKey: ["task", task.id] });
    },
    onError: (error: any) => {
      // 🔴 THIS WILL CATCH THE BUG
      console.error("❌ FRONTEND MUTATION FAILED:", error.response?.data || error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/tasks/attachments/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["task", task.id] })
  });

  const { startUpload, isUploading } = useUploadThing("attachmentUploader", {
    onClientUploadComplete: (res) => {
      if (res && res.length > 0) {
        const file = res[0];
        saveAttachmentMutation.mutate({
          name: file.name,
          url: file.ufsUrl,
          size: file.size,
          type: file.type,
        });
      }
    },
    onUploadError: (error: Error) => {
      console.error("Upload failed:", error);
      alert(`Upload failed: ${error.message}`);
    },
  });

  return (
    <div className="px-6 md:px-8 pt-4 pb-6 space-y-4 border-t" id="attachments-section">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
          <Paperclip className="h-5 w-5 text-muted-foreground" />
          Attachments
        </div>

        {/* 🟢 THE FIX */}
        <div>
          {/* 1. Attach the ref to the hidden input */}
          <input

            type="file"
            ref={fileInputRef}
            className="hidden"
            title="Upload file attachment"
            onChange={(e) => {
              if (!e.target.files || e.target.files.length === 0) return;
              startUpload(Array.from(e.target.files));

              // Clear the input value so you can upload the exact same file again if needed
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
          />

          {/* 2. Remove 'asChild' and use a standard onClick to trigger the hidden input */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isUploading || saveAttachmentMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5 mr-1.5" />}
            {isUploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </div>

      {/* --- RENDER FILES LIST --- */}
      <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {saveAttachmentMutation.isPending && (
          <div className="col-span-full py-4 text-center text-xs text-muted-foreground animate-pulse">
            Saving file to database...
          </div>
        )}

        {!task.attachments || task.attachments.length === 0 ? (
          <div className="col-span-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <p className="text-sm">No files attached yet.</p>
          </div>
        ) : (
          task.attachments?.map((file: any) => (
            <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-all group">
              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                <FileIcon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{file.size}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:bg-destructive/10"
                  onClick={() => deleteMutation.mutate(file.id)}
                  disabled={deleteMutation.isPending}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}