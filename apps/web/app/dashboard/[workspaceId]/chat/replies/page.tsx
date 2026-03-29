"use client";

import { MessageSquareReply, ArrowRight, CornerDownRight } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ChatInput } from "@/components/chat/chat-input";

export default function RepliesPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  // 🟢 This is the mock data structure we will eventually fetch from the backend!
  const mockThreads = [
    {
      id: "thread-1",
      channelName: "web-dev",
      channelId: "cmnabxa210000fk5arlcgyre4",
      parentMessage: {
        senderName: "Ajith Pal",
        senderImage: "/default-avatar.png",
        content: "Hey team, what is the status of the new navigation bar?",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      replies: [
        {
          id: "reply-1",
          senderName: "Nisha",
          senderImage: "/default-avatar.png",
          content: "I just pushed the final CSS fixes. It should be ready for review!",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        }
      ]
    }
  ];

  if (mockThreads.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-background">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquareReply className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Threads</h3>
        <p className="text-sm max-w-sm text-center">
          Catch up on the specific message threads you are participating in.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* 🟢 Header */}
      <div className="px-6 py-4 border-b flex justify-between items-center bg-background z-10 shrink-0">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MessageSquareReply className="h-5 w-5 text-muted-foreground" />
          Threads
        </h3>
      </div>

      {/* 🟢 Threads Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-muted/10">
        {mockThreads.map((thread) => (
          <div key={thread.id} className="bg-background border rounded-xl shadow-sm overflow-hidden">

            {/* Channel Link Header */}
            <div className="bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground border-b flex items-center justify-between">
              <span>#{thread.channelName}</span>
              <Link href={`/dashboard/${workspaceId}/chat/${thread.channelId}`}>
                <Button variant="link" className="h-auto p-0 text-xs flex items-center gap-1 text-primary">
                  Jump to channel <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="p-5">
              {/* Parent Message */}
              <div className="flex gap-4">
                <Image src={thread.parentMessage.senderImage} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover border" />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-sm">{thread.parentMessage.senderName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(thread.parentMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/90">{thread.parentMessage.content}</div>
                </div>
              </div>

              {/* Replies */}
              <div className="mt-4 space-y-4 relative">
                {/* Visual Thread Line */}
                <div className="absolute left-4 top-0 bottom-4 w-0.5 bg-border rounded-full" />

                {thread.replies.map((reply) => (
                  <div key={reply.id} className="flex gap-4 relative">
                    <div className="h-10 w-10 flex justify-end items-start pr-1 shrink-0 z-10">
                      <CornerDownRight className="h-5 w-5 text-muted-foreground mt-2" />
                    </div>
                    <Image src={reply.senderImage} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover border mt-1" />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-bold text-sm">{reply.senderName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="text-sm text-foreground/90">{reply.content}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply Input Trigger */}
              <div className="ml-[3.25rem] mt-4">
                <ChatInput
                  workspaceId={workspaceId}
                  onSendMessage={async (content, fileUrls) => {
                    console.log(`Replying to thread ${thread.id}:`, content);
                    // We will wire this to the DB later!
                     
                  }}
                  onTyping={() => { }}
                />
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}