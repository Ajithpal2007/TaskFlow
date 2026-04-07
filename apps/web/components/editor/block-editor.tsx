"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useDocument } from "@/hooks/api/use-document";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useParams } from "next/navigation";
import * as Y from "yjs";

import { HocuspocusProvider } from "@hocuspocus/provider";

import { AiChatWidget } from "./ai-chat-widget";

import "@blocknote/core/fonts/inter.css";
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, filterSuggestionItems, BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView, lightDefaultTheme, darkDefaultTheme, } from "@blocknote/mantine";

import "@blocknote/mantine/style.css";

import { createReactInlineContentSpec } from "@blocknote/react";

import { TaskBlock } from "./task-block";
import { CheckSquare, Loader2, User as UserIcon, FolderDot, Sparkles } from "lucide-react";

import { authClient } from "@/app/lib/auth/client";

import { ExportMenu } from "./export-menu";

import { toast } from "sonner";

interface BlockEditorProps {
  documentId: string;
  initialContent?: any;
  workspaceId: string;
  projectId?: string;
  isLocked?: boolean;
}

// 🟢 1. YOUR CUSTOM MENU UI (Restored!)
// 🟢 1. YOUR POLISHED CUSTOM MENU UI
const CustomTaskMenu = (props: any) => {
  return (
    <div className="z-50 min-w-[280px] overflow-hidden rounded-lg border bg-popover p-1 shadow-xl animate-in fade-in zoom-in-95">
      <div className="px-2 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
        Mention User, Project, or Task
      </div>

      {props.items.length === 0 ? (
        <div className="p-3 text-sm text-muted-foreground text-center animate-pulse">
          Searching...
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {props.items.map((item: any, index: number) => (
            <div
              key={index}
              onClick={() => props.onItemClick?.(item)}
              className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors ${props.selectedIndex === index ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                }`}
            >
              {/* 🟢 DYNAMIC ICON OR AVATAR */}
              <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-background shadow-sm">
                {item.avatar ? (
                  <img src={item.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-muted-foreground">{item.icon}</span>
                )}
              </div>

              {/* TEXT CONTENT */}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-semibold truncate">{item.title}</span>
                <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wide">
                  {item.subtext}
                </span>
              </div>

              {/* OPTIONAL: TYPE BADGE */}
              <div className="px-1.5 py-0.5 rounded border bg-muted/30 text-[9px] font-bold text-muted-foreground uppercase">
                {item.type || 'Item'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MentionPill = createReactInlineContentSpec(
  {
    type: "mention",
    propSchema: {
      title: { default: "Unknown" },
      mentionType: { default: "user" }, // "user" or "project"
      referenceId: { default: "" },
      workspaceId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => {
      // 1. Grab the data from the props
      const { title, mentionType, referenceId, workspaceId } = props.inlineContent.props;
      const isUser = mentionType === "user";

      // 2. Determine styles and icons
      const Icon = isUser ? UserIcon : FolderDot;
      const colorClass = isUser
        ? "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:text-blue-400"
        : "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:text-purple-400";

      // 3. Handle routing when clicked
      const handleClick = () => {
        const url = isUser
          ? `/dashboard/${workspaceId}/users/${referenceId}`
          : `/dashboard/${workspaceId}/projects/${referenceId}`;
        window.open(url, "_blank");
      };

      // 4. Render the beautiful React Pill
      return (
        <span
          onClick={handleClick}
          contentEditable={false} // Prevents the user from accidentally deleting half the pill
          className={`inline-flex items-center gap-1 rounded px-1.5 border align-middle text-[13px] font-semibold cursor-pointer transition-colors ${colorClass}`}
        >
          <Icon className="h-3 w-3" />
          @{title}
        </span>
      );
    },
  }
);

// 🟢 2. THE INNER EDITOR (Logic, Saving, UI)
function InnerEditor({ documentId, workspaceId, projectId, yDoc, provider, isLocked, }: any) {
  const { resolvedTheme } = useTheme();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";


  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [isAiWidgetOpen, setIsAiWidgetOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault(); // Stop Chrome's default downloads shortcut!
        setIsAiWidgetOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🟢 PART 2: The AI Streaming Engine
  const handleAIGeneration = async (editor: typeof BlockNoteEditor.prototype) => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);

    try {
      // Step A: Grab the cursor and the block above it for context
      const cursorPosition = editor.getTextCursorPosition();
      const currentBlock = cursorPosition.block;
      const prevBlock = cursorPosition.prevBlock;

      // BlockNote stores text as an array of inline content. We extract the raw text.
      let contextText = "Write an introductory paragraph.";
      if (prevBlock && Array.isArray(prevBlock.content)) {
        contextText = prevBlock.content.map((c: any) => c.text || "").join("");
      } else if (prevBlock && typeof prevBlock.content === "string") {
        contextText = prevBlock.content;
      }

      // Step B: Set the "Thinking" state directly on the canvas
      editor.updateBlock(currentBlock, {
        type: "paragraph",
        content: "✨ AI is thinking...",
      });

      // Step C: Connect to your Fastify SSE route
      const response = await fetch(`${apiUrl}/api/ai/${workspaceId}/editor-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          command: "continue_writing",
          contextText: contextText,
        }),
      });

      if (!response.ok || !response.body) throw new Error("AI failed to connect");

      // Step D: Open the stream and catch the words!
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkString = decoder.decode(value);
        const lines = chunkString.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();

            // Fastify says we are done!
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;

                // 🟢 This is the magic line that updates BlockNote in real-time
                editor.updateBlock(currentBlock, {
                  type: "paragraph",
                  content: accumulatedText,
                });
              }
            } catch (e) {
              console.error("Failed to parse stream chunk", e);
            }
          }
        }
      }

      // Step E: Once finished, add a new blank block below so the user can keep typing
      editor.insertBlocks([{ type: "paragraph", content: "" }], currentBlock, "after");
      editor.setTextCursorPosition(editor.getTextCursorPosition().nextBlock!, "start");

    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI content");
      // If it fails, clear the "Thinking..." text
      editor.updateBlock(editor.getTextCursorPosition().block, {
        type: "paragraph",
        content: "",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 🟢 PART 4: The Widget Streaming Engine
  const handleWidgetAction = async (command: string) => {
    if (isGeneratingAI) return;
    setIsGeneratingAI(true);

    try {
      // 1. Grab the user's highlighted text. If nothing is highlighted, grab the current block.
      let contextText = editor.getSelectedText();
      const currentBlock = editor.getTextCursorPosition().block as any;

      if (!contextText && currentBlock.content && Array.isArray(currentBlock.content)) {
        // If nothing is highlighted, grab the text from the current block
        contextText = currentBlock.content.map((c: any) => c.text || "").join("");
      }


      if (!contextText.trim()) {
        toast.error("Please select or type some text first!");
        setIsGeneratingAI(false);
        return;
      }

      // 2. Insert a new block below the current one to hold the AI's response
      editor.insertBlocks([{ type: "paragraph", content: "✨ AI is working..." }], currentBlock, "after");
      const targetBlock = editor.getTextCursorPosition().nextBlock!;

      // 3. Connect to your Fastify SSE route
      const response = await fetch(`${apiUrl}/api/ai/${workspaceId}/editor-assist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          command: command, // This will be "improve", "fix_grammar", or a custom prompt!
          contextText: contextText,
        }),
      });

      if (!response.ok || !response.body) throw new Error("AI failed to connect");

      // 4. Open the stream and catch the words
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkString = decoder.decode(value);
        const lines = chunkString.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;

                // 🟢 Update the new block in real-time
                editor.updateBlock(targetBlock, {
                  type: "paragraph",
                  content: accumulatedText,
                });
              }
            } catch (e) {
              console.error("Failed to parse stream chunk", e);
            }
          }
        }
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to process AI request");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // 🟢 PART 3: Define the custom AI menu item
  const insertMagicAI = (editor: BlockNoteEditor) => ({
    title: "Write with AI",
    onItemClick: () => handleAIGeneration(editor),
    aliases: ["ai", "magic", "generate"],
    group: "AI Tools",
    icon: <Sparkles size={18} className="text-indigo-500" />,
    subtext: "Auto-completes based on context.",
  });

  // Combine our custom AI tool with all the default BlockNote tools (Headings, Bullet points, etc.)
  const getCustomSlashMenuItems = (editor: BlockNoteEditor) => [
    insertMagicAI(editor),
    ...getDefaultReactSlashMenuItems(editor),
  ];

  const { data: session } = authClient.useSession();

  const cursorColor = useMemo(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0"), []);

  const schema = useMemo(() => {
    return BlockNoteSchema.create({
      blockSpecs: { ...defaultBlockSpecs, task: TaskBlock() },

    });
  }, []);

  const { data: realTasks = [] } = useQuery({
    queryKey: ["tasks", workspaceId, projectId],
    queryFn: async () => {
      const endpoint = projectId ? `/tasks/project/${projectId}` : `/tasks/workspace/${workspaceId}`;
      const response = await apiClient.get(endpoint);
      return response.data.data;
    },
    enabled: !!workspaceId,
  });

  const editor = useCreateBlockNote({
    schema,
    collaboration: {
      provider,
      fragment: yDoc.getXmlFragment("document-store"),
      user: { name: session?.user?.name || "Guest", color: cursorColor },
    },
  });



  const getMentionMenuItems = async (query: string) => {
    // 1. Fetch from the new Omni-Search route
    const response = await apiClient.get(`/search/mentions?workspaceId=${workspaceId}&q=${query}`);

    const items = response.data.data;

    return items.map((item: any) => ({
      title: item.title,
      subtext: item.type === "task" ? `Status: ${item.status}` : item.type.toUpperCase(),

      // 🟢 Assign Dynamic Icons
      icon: item.type === "user" ? <UserIcon className="h-4 w-4 text-blue-500" /> :
        item.type === "project" ? <FolderDot className="h-4 w-4 text-purple-500" /> :
          <CheckSquare className="h-4 w-4 text-emerald-500" />,


      onItemClick: () => {
        if (item.type === "task") {
          const currentBlock = editor.getTextCursorPosition().block;
          editor.updateBlock(currentBlock, {
            type: "task",
            props: {
              taskId: item.id || "",
              taskTitle: item.title || "Unknown",
              taskStatus: item.status || "TODO"
            },
          });
        } else {
          // 🟢 BULLETPROOF FIX: Use standard links. 
          // Yjs will never delete them, and our CSS turns them into Badges!
          const baseUrl = window.location.origin;
          const linkUrl = item.type === "user"
            ? `${baseUrl}/dashboard/${workspaceId}/users/${item.id}`
            : `${baseUrl}/dashboard/${workspaceId}/projects/${item.id}`;

          editor.insertInlineContent([
            {
              type: "link",
              href: linkUrl,
              content: `@${item.title}`,
            },
            " " // Add a space so the user can keep typing
          ]);
        }
      },
    }));
  };

  return (
   <div className="-mx-[54px] mt-4 flex-1 overflow-y-auto pb-32 relative group/editor h-[calc(100vh-200px)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full">

      <div className="absolute -top-12 right-[54px] z-10 opacity-0 group-hover/editor:opacity-100 transition-opacity">
        <ExportMenu
          editor={editor}
          documentTitle="TaskFlow_Export"
        />
      </div>

      <AiChatWidget
        isOpen={isAiWidgetOpen}
        onClose={() => setIsAiWidgetOpen(false)}
        onSubmitPrompt={(prompt) => {
          handleWidgetAction(prompt); // Sends their custom text input
          setIsAiWidgetOpen(false);
        }}
        onQuickAction={(action) => {
          handleWidgetAction(action); // Sends "improve", "summarize", etc.
          setIsAiWidgetOpen(false);
        }}
      />

     <div className="min-h-max w-full">
        <BlockNoteView 
          editor={editor} 
          editable={!isLocked} 
          theme={resolvedTheme === "dark" ? darkDefaultTheme : lightDefaultTheme} 
        >
          <SuggestionMenuController
            triggerCharacter={"@"}
            getItems={async (query) => getMentionMenuItems(query)}
            suggestionMenuComponent={CustomTaskMenu}
            onItemClick={(item) => item.onItemClick()}
          />
        </BlockNoteView>
      </div>
    </div>
  );
}

// 🟢 3. THE WRAPPER (WebSocket Connection)
// 🟢 3. THE WRAPPER (Hocuspocus Connection)
export default function BlockEditor(props: BlockEditorProps) {
  const [yDoc, setYDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<HocuspocusProvider>();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    const doc = new Y.Doc();

    // Initialize Hocuspocus Provider
    const hocuspocusProvider = new HocuspocusProvider({
      url: `${apiUrl}/api/collaboration`, // Matches your new backend route!
      name: props.documentId, // This is passed as `documentName` to your Fastify Database extension
      document: doc,
      onConnect: () => {
        console.log("🟢 Connected to Hocuspocus Server!");
      },
      onSynced: () => {
        console.log("✨ Document state fully synced with Postgres!");
      }
    });

    setYDoc(doc);
    setProvider(hocuspocusProvider);

    return () => {
      hocuspocusProvider.destroy();
      doc.destroy();
    };
  }, [props.documentId]);

  if (!yDoc || !provider) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting to live session...
      </div>
    );
  }

  return <InnerEditor {...props} yDoc={yDoc} provider={provider} />;
}