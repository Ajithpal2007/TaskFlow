import { prisma } from "@repo/database";
import { notFound } from "next/navigation";
import { Whiteboard } from "./_components/whiteboard"; 
import { BoardTitle } from "./_components/board-title";

export default async function CanvasRoomPage({
  params,
}: {
  params: { workspaceId: string; boardId: string };
}) {
  // 1. Verify the board exists and grab its Liveblocks Room ID
  const board = await prisma.whiteboard.findUnique({
    where: { 
      id: params.boardId,
      workspaceId: params.workspaceId 
    },
  });

  if (!board) return notFound();

  return (
    // 2. We use a full-screen layout to maximize drawing space
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      <div className="h-14 px-4 border-b flex items-center shrink-0 bg-background z-10">
        <BoardTitle 
          initialTitle={board.title} 
          boardId={board.id} 
          workspaceId={params.workspaceId} 
        />
      </div>
      
      {/* 3. Pass the specific roomId to the Client Component */}
      <div className="flex-1 min-h-0 relative">
        <Whiteboard roomId={board.roomId} workspaceId={params.workspaceId} boardId={params.boardId} />
      </div>
    </div>
  );
}