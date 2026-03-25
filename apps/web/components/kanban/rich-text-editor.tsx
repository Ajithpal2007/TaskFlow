"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Strikethrough, List, ListOrdered, Code, Quote, Heading1 } from "lucide-react";
import { Button } from "@repo/ui/components/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
}

export function RichTextEditor({ value, onChange, onBlur, isEditing, setIsEditing }: RichTextEditorProps) {
  // 🟢 1. The "Click Outside" detector
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Add a more detailed description...",
      }),
    ],
    content: value,
    editable: isEditing, // Completely locks the editor when not editing
   
    onUpdate: ({ editor }) => {
      // 🟢 1. Get the HTML
      const html = editor.getHTML();
      
      // 🟢 2. Send it back to the parent component!
      onChange(html); 
      
      // ❌ REMOVE THIS LINE: form.setValue("description", html);
    },
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[100px]",
      },
    },
  });

  // Toggle Tiptap's internal editable state when your UI state changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  useEffect(() => {
    if (editor && !isEditing) {
      // Only update if the incoming value is actually different 
      // (prevents messing up the cursor if you are typing)
      const currentContent = editor.getHTML();
      if (value !== currentContent) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor, isEditing]);

  // Toggle Tiptap's internal editable state...
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  // 🟢 2. Custom Click-Outside Logic
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If we click OUTSIDE the entire editor container, save and close!
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (isEditing) {
          onBlur(); // Save to database
          setIsEditing(false); // Close toolbar
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, onBlur, setIsEditing]);

  if (!editor) return null;

  return (
    <div 
      ref={containerRef}
      className={`rounded-md transition-colors ${isEditing ? "border bg-background shadow-sm ring-1 ring-ring" : "border border-transparent hover:bg-muted/50 cursor-text"}`}
      onClick={() => {
        if (!isEditing) {
          setIsEditing(true);
          setTimeout(() => editor.commands.focus(), 0);
        }
      }}
    >
      {/* --- TOOLBAR --- */}
      {isEditing && (
        <div className="flex items-center gap-1 border-b bg-muted/40 p-1 flex-wrap">
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBold().run()} 
            isActive={editor.isActive("bold")} 
            icon={<Bold className="h-4 w-4" />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleItalic().run()} 
            isActive={editor.isActive("italic")} 
            icon={<Italic className="h-4 w-4" />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleStrike().run()} 
            isActive={editor.isActive("strike")} 
            icon={<Strikethrough className="h-4 w-4" />} 
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
            isActive={editor.isActive("heading", { level: 1 })} 
            icon={<Heading1 className="h-4 w-4" />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            isActive={editor.isActive("bulletList")} 
            icon={<List className="h-4 w-4" />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            isActive={editor.isActive("orderedList")} 
            icon={<ListOrdered className="h-4 w-4" />} 
          />
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleCodeBlock().run()} 
            isActive={editor.isActive("codeBlock")} 
            icon={<Code className="h-4 w-4" />} 
          />
          <ToolbarButton 
            onClick={() => editor.chain().focus().toggleBlockquote().run()} 
            isActive={editor.isActive("blockquote")} 
            icon={<Quote className="h-4 w-4" />} 
          />
        </div>
      )}

      {/* --- TEXT AREA --- */}
      {/* 🟢 3. The 'prose' class is now wrapped directly around the content! */}
      <div className="p-3 ">
        <EditorContent editor={editor} />
      </div>

      {/* --- FOOTER --- */}
      {isEditing && (
        <div className="flex justify-end p-2 bg-muted/20 border-t">
          <span className="text-[10px] text-muted-foreground font-medium">Click outside to save</span>
        </div>
      )}
    </div>
  );
}

// 🟢 4. The Magic Toolbar Button
function ToolbarButton({ onClick, isActive, icon }: { onClick: () => void; isActive: boolean; icon: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={`h-7 w-7 ${isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
      onMouseDown={(e) => {
        // THIS IS THE SECRET SAUCE: It stops the button from stealing your text selection!
        e.preventDefault(); 
        e.stopPropagation(); 
        onClick();
      }}
    >
      {icon}
    </Button>
  );
}