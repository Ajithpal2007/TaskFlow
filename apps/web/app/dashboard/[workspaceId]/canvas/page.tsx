import { prisma } from "@repo/database";
import { Plus, Layout } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; // 🟢 Added Next.js Image import
import { CreateBoardButton } from "./_components/create-board-button";
import { DeleteBoardButton } from "./_components/delete-board-button";


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

        {/* 🔴 THE BULLETPROOF GRID FIX
            This automatically creates as many columns as will fit, 
            guaranteeing cards are never smaller than 280px and never stretch across the screen. 
        */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] auto-rows-fr gap-6">

          {/* 1. The "Create New" Card */}
          {/* Note: Ensure inside CreateBoardButton there are NO "w-full" or hardcoded widths. It should just fill its parent grid cell. */}
          <CreateBoardButton workspaceId={params.workspaceId} />

          {/* 2. Map over existing boards */}
          {whiteboards.map((board) => (
            <div
              key={board.id}
              className="group relative flex flex-col border rounded-xl overflow-hidden bg-card hover:shadow-md transition-all hover:border-primary/50"
            >

              <Link
                href={`/dashboard/${params.workspaceId}/canvas/${board.id}`}
                className="absolute inset-0 z-10"
              >
                <span className="sr-only">View {board.title}</span>
              </Link>

              <div className="absolute top-3 right-3 z-20">
                <DeleteBoardButton roomId={board.roomId} workspaceId={params.workspaceId} />
              </div>

              {/* 🟢 Upgraded to aspect-video (16:9) to keep standard thumbnail proportions */}
              <div className="relative w-full aspect-video bg-muted/30 border-b flex items-center justify-center group-hover:bg-muted/50 transition-colors overflow-hidden">
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
              <div className="p-4 flex flex-col gap-1 bg-card">
                <span className="font-semibold text-sm truncate">{board.title}</span>
                <span className="text-xs text-muted-foreground">
                  Edited {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}