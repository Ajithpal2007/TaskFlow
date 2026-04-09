import { prisma } from "@repo/database";
import { notFound } from "next/navigation";
import { BoardTitle } from "./_components/board-title";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// 🔴 THE FIX: Tell Next.js to only render this component in the browser!
const Whiteboard = dynamic(
  () => import("./_components/whiteboard").then((m) => m.Whiteboard),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
);

export default async function CanvasRoomPage({
  params,
}: {
  params: { workspaceId: string; boardId: string };
}) {
  const board = await prisma.whiteboard.findUnique({
    where: { 
      id: params.boardId,
      workspaceId: params.workspaceId 
    },
  });

  if (!board) return notFound();

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <div className="h-14 px-4 border-b flex items-center shrink-0 bg-background z-10">
        <BoardTitle 
          initialTitle={board.title} 
          boardId={board.id} 
          workspaceId={params.workspaceId} 
        />
      </div>
      
      <div className="flex-1 min-h-0 relative">
        <Whiteboard roomId={board.roomId} workspaceId={params.workspaceId} boardId={params.boardId} />
      </div>
    </div>
  );
}