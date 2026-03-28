import { MessageSquarePlus } from "lucide-react";

export default function ChatLandingPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground p-8">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquarePlus className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Welcome to Team Chat</h3>
      <p className="text-sm max-w-sm">
        Select a channel or direct message from the sidebar to start collaborating, or create a new conversation.
      </p>
    </div>
  );
}