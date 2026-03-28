import { Send } from "lucide-react";

export default function DraftsPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-background">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Send className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Drafts & Sent</h3>
      <p className="text-sm max-w-sm text-center">
        This is where your drafted and recently sent messages will appear. (Coming soon!)
      </p>
    </div>
  );
}