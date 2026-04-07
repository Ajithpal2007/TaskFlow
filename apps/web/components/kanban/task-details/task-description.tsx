"use client";

import { useState, useEffect } from "react";
import { AlignLeft, Sparkles, Loader2 } from "lucide-react";
import { RichTextEditor } from "@/components/kanban/rich-text-editor";
import { Button } from "@repo/ui/components/button";
import { useTask } from "@/hooks/api/use-task";
import { useParams } from "next/navigation";

interface TaskDescriptionProps {
  task: any;
  updateTask: (data: any) => void;
  
}

export function TaskDescription({ task , updateTask}: TaskDescriptionProps) {

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const params = useParams();
const workspaceId = params.workspaceId as string;

  // 🟢 THE FIX: Removed `isLoading` from this hook entirely!
  // It will now safely hold the AI text while the database saves in the background.
  useEffect(() => {
    setDescription(task?.description || "");
  }, [task?.id]);

  const handleSave = () => {
    if (!isLoading && description !== (task?.description || "")) {
      // 🟢 THE FIX: Send the flat object! No more "updates" wrapper!
      updateTask({ 
        description: description 
      });
    }
  };

  const handleAutoDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);

    setIsLoading(true);
    setCompletion("");

    const aiPrompt = description
      ? `Expand these rough notes into a professional technical ticket in HTML format: ${description}`
      : `Draft a professional technical ticket for this title in HTML format: ${task.title}`;

    try {
      const response = await fetch(`${apiUrl}/api/ai/${workspaceId}/generate-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
        credentials: "include",
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();

       if (done) {
          setDescription(accumulatedText);
          
          // 🟢 THE FIX: Send the flat object here too!
          updateTask({ 
            description: accumulatedText 
          });
          
          break;
        }

        accumulatedText += decoder.decode(value, { stream: true });
        setCompletion(accumulatedText);
      }
    } catch (error) {
      console.error("Stream failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = !description || description === "<p></p>" || description === "";



  return (
    // 🟢 1. Added 'min-w-0 w-full overflow-hidden' to the outermost wrapper
    <div className="px-6 md:px-8 pt-4 pb-6 space-y-3 min-w-0 w-full overflow-hidden">

      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 font-semibold text-lg text-foreground truncate">
          <AlignLeft className="h-5 w-5 text-muted-foreground shrink-0" />
          <span className="truncate">Description</span>
        </div>

        {(isEmpty || isEditing) && (
          <Button
            variant="secondary"
            size="sm"
            onMouseDown={handleAutoDraft}
            disabled={isLoading || (!task?.title && !description)}
            className="h-7 text-xs bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors shrink-0 ml-4"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            )}
            {isLoading ? "Drafting..." : "Auto-Draft"}
          </Button>
        )}
      </div>

      {/* 🟢 2. Added 'min-w-0 w-full' here to protect the editor wrappers */}
      <div className="ml-7 min-w-0 w-full pr-7">
        {!isEditing && isEmpty && !isLoading && (
          <div
            onClick={() => setIsEditing(true)}
            className="py-6 px-4 text-sm text-muted-foreground bg-muted/20 hover:bg-muted/50 border border-dashed rounded-lg cursor-text transition-all text-center w-full"
          >
            No description provided. Click to add one or use the Auto-Draft button above.
          </div>
        )}

        {isLoading ? (
          /* 🟢 3. Added 'overflow-x-hidden break-words' so AI generated HTML doesn't blow out the width */
          <div
            className="p-4 border rounded-md bg-muted/10 min-h-[150px] max-h-[400px] overflow-y-auto overflow-x-hidden break-words prose prose-sm dark:prose-invert max-w-none w-full"
            dangerouslySetInnerHTML={{ __html: completion }}
          />
        ) : (
          /* 🟢 4. Added 'overflow-x-hidden w-full min-w-0' to permanently cage the RichTextEditor */
          <div className={!isEditing && isEmpty ? "hidden" : "block max-h-[400px] overflow-y-auto overflow-x-hidden rounded-md w-full min-w-0"}>
            <RichTextEditor
              value={description}
              onChange={setDescription}
              onBlur={handleSave}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
          </div>
        )}
      </div>
    </div>
  );
}