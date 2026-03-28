import { MessageSquare } from "lucide-react";

export default function RepliesPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-background">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Threads</h3>
      <p className="text-sm max-w-sm text-center">
        Catch up on the specific message threads you are participating in. (Coming soon!)
      </p>
    </div>
  );
}