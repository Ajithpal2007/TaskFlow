import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-background">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Activity className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Mentions & Reactions</h3>
      <p className="text-sm max-w-sm text-center">
        A feed of everywhere you have been @mentioned across the workspace. (Coming soon!)
      </p>
    </div>
  );
}