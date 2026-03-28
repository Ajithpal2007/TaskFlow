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
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote, SuggestionMenuController } from "@blocknote/react";
import { BlockNoteView, lightDefaultTheme, darkDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

import { TaskBlock } from "./task-block";
import { CheckSquare, Loader2 } from "lucide-react";

import { authClient } from "@/app/lib/auth/client";

interface BlockEditorProps {
  documentId: string;
  initialContent?: any;
  workspaceId: string;
  projectId?: string;
  isLocked?: boolean;
}

// 🟢 1. YOUR CUSTOM MENU UI (Restored!)
const CustomTaskMenu = (props: any) => {
  return (
    <div className="z-50 min-w-[250px] overflow-hidden rounded-md border bg-background p-1 shadow-md">
      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
        Link a Task
      </div>
      {props.items.length === 0 ? (
        <div className="p-2 text-sm text-muted-foreground">No tasks found.</div>
      ) : (
        props.items.map((item: any, index: number) => (
          <div
            key={index}
            onClick={() => props.onItemClick?.(item)}
            className={`flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted ${
              props.selectedIndex === index ? "bg-muted" : ""
            }`}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md border bg-background">
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{item.title}</span>
              <span className="text-[10px] uppercase text-muted-foreground">{item.subtext}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// 🟢 2. THE INNER EDITOR (Logic, Saving, UI)
function InnerEditor({ documentId, workspaceId, projectId, yDoc, provider, isLocked }: any) {
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

  const getMentionMenuItems = (query: string) => {
    const filteredTasks = realTasks.filter((task: any) => task.title.toLowerCase().includes(query.toLowerCase()));
    return filteredTasks.map((task: any) => ({
      title: task.title,
      subtext: `Status: ${task.status}`,
      icon: <CheckSquare className="h-4 w-4" />,
      onItemClick: () => {
        const currentBlock = editor.getTextCursorPosition().block;
        editor.updateBlock(currentBlock, {
          type: "task",
          props: { taskId: task.id, taskTitle: task.title, taskStatus: task.status },
        });
      },
    }));
  };

  return (
    <div className="-mx-[54px] mt-4 min-h-[calc(100vh-300px)]">
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