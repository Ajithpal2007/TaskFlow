import { prisma } from "@repo/database";
import { Plus, Layout } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // 🟢 Added Next.js Image import
import { CreateBoardButton } from "./_components/create-board-button"; 

export default async function CanvasDashboardPage({ params }: { params: { workspaceId: string } }) {
  // 1. Fetch all whiteboards for this workspace from your database
  const whiteboards = await prisma.whiteboard.findMany({
    where: { workspaceId: params.workspaceId },
    orderBy: { updatedAt: "desc" },
    include: { creator: true } 
  });

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layout className="text-primary" />
          Whiteboards & Canvases
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Brainstorm, map flows, and collaborate in real-time.
        </p>
      </div>

      {/* The Figma-Style Grid */}
      <div className="p-8">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Recently Viewed
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {/* 1. The "Create New" Card */}
          <CreateBoardButton workspaceId={params.workspaceId} />

          {/* 2. Map over existing boards */}
          {whiteboards.map((board) => (
            <Link 
              key={board.id} 
              href={`/dashboard/${params.workspaceId}/canvas/${board.id}`}
              className="group flex flex-col border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all hover:border-primary/50"
            >
              {/* 🟢 THE FIX: Conditional Thumbnail Rendering */}
              <div className="relative h-40 bg-muted/30 border-b flex items-center justify-center group-hover:bg-muted/50 transition-colors overflow-hidden">
                {board.imageUrl ? (
                  <Image
                    src={board.imageUrl}
                    alt={`${board.title} thumbnail`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <Layout className="h-8 w-8 text-muted-foreground/30" />
                )}
              </div>
              
              {/* Card Details */}
              <div className="p-4 flex flex-col gap-1 z-10 bg-card">
                <span className="font-semibold text-sm truncate">{board.title}</span>
                <span className="text-xs text-muted-foreground">
                  Edited {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}

        </div>
      </div>
    </div>
  );
}