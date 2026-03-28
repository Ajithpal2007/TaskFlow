"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useDocument } from "@/hooks/api/use-document";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/app/lib/api-client";
import { useParams } from "next/navigation";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";



import "@blocknote/core/fonts/inter.css";
import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from "@blocknote/core";
import { useCreateBlockNote, SuggestionMenuController } from "@blocknote/react";
import { BlockNoteView, lightDefaultTheme, darkDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

import { createReactInlineContentSpec } from "@blocknote/react";

import { TaskBlock } from "./task-block";
import { CheckSquare, Loader2, User as UserIcon, FolderDot, } from "lucide-react";

import { authClient } from "@/app/lib/auth/client";

import { ExportMenu } from "./export-menu";

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
  const { updateDocument } = useDocument(documentId);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateDocument({ content: editor.document });
    }, 1000);
  };

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
    <div className="-mx-[54px] mt-4 min-h-[calc(100vh-300px)] relative group/editor">

      <div className="absolute -top-12 right-[54px] z-10 opacity-0 group-hover/editor:opacity-100 transition-opacity">
        <ExportMenu
          editor={editor}
          documentTitle="TaskFlow_Export"
        />
      </div>

      <BlockNoteView editor={editor} editable={!isLocked} theme={resolvedTheme === "dark" ? darkDefaultTheme : lightDefaultTheme} onChange={handleSave}>
        <SuggestionMenuController
          triggerCharacter={"@"}
          getItems={async (query) => getMentionMenuItems(query)}
          suggestionMenuComponent={CustomTaskMenu}
          onItemClick={(item) => item.onItemClick()}
        />
      </BlockNoteView>
    </div>
  );
}

// 🟢 3. THE WRAPPER (WebSocket Connection)
export default function BlockEditor(props: BlockEditorProps) {
  const [yDoc, setYDoc] = useState<Y.Doc>();
  const [provider, setProvider] = useState<WebsocketProvider>();

  useEffect(() => {
    const doc = new Y.Doc();

    // 🟢 THE FIX: Let y-websocket build the URL naturally!
    // 1. Give it the base URL (NO document ID here)
    // 2. Give it the room name (The document ID)
    const wsProvider = new WebsocketProvider(
      "ws://localhost:4000/api/collaboration",
      props.documentId,
      doc
    );

    setYDoc(doc);
    setProvider(wsProvider);

    return () => {
      doc.destroy();
      wsProvider.destroy();
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