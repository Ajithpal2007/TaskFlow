"use client";

import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { CheckCircle2, Square, CircleDashed, ListTodo } from "lucide-react";
import { apiClient } from "@/app/lib/api-client";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "next/navigation";



// 🟢 1. Create a Live React Component for the card
const LiveTaskCard = ({ block, editor }: any) => {
  // Grab the static JSON as a fallback while loading
  const { taskId, taskTitle, taskStatus: staticStatus } = block.props;

  const params = useParams();
  // 🟢 2. Fetch the LIVE truth from your database
  const { data: liveTask } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}`);
      return res.data?.data;
    },
    // This tells React Query to check the database every 3 seconds! 
    // It makes the document feel magically real-time without refreshing.
    refetchInterval: 3000,
  });

  // Use the live database status if we have it, otherwise use the old JSON snapshot
  const currentStatus = liveTask?.status || staticStatus;
  const currentTitle = liveTask?.title || taskTitle;

  const isDone = currentStatus === "DONE";

  // Figure out the right icon based on the LIVE status
  let Icon = Square;
  let iconColor = "text-muted-foreground";

  if (currentStatus === "DONE") {
    Icon = CheckCircle2;
    iconColor = "text-green-500";
  } else if (currentStatus === "IN_PROGRESS") {
    Icon = CircleDashed;
    iconColor = "text-blue-500";
  } else if (currentStatus === "BACKLOG") {
    Icon = ListTodo;
    iconColor = "text-orange-500";
  }

  // 🟢 THE NEW UX: Open the project page with a query parameter!
  const handleOpenTask = (e: React.MouseEvent) => {
    e.stopPropagation();

    // 🟢 Let's peek at exactly what Fastify is sending us!
    console.log("Live Task Data from DB:", liveTask);

    const wsId = liveTask?.workspaceId || params?.workspaceId;
    const pId = liveTask?.projectId || params?.projectId;
    // As long as we have a Workspace ID, we can route them!
      if (wsId) {
        if (pId) {
        // Open the Project Board
        window.open(`/dashboard/${wsId}/projects/${pId}?taskId=${taskId}`, "_blank");
        } else {
        // Open the Workspace Inbox (or wherever workspace-level tasks live)
        window.open(`/dashboard/${wsId}/inbox?taskId=${taskId}`, "_blank");
       }
       } else {
      console.error("Could not find Workspace ID in database OR URL!");
    
  };
  
};
return (
  <div
    // Add the onClick here to make the whole card clickable!
    onClick={handleOpenTask}
    className="my-2 flex items-center gap-3 rounded-lg border bg-muted/30 p-3 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer select-none group"
    contentEditable={false}
  >
    <div className="rounded-md p-1 -ml-1 transition-colors">
      <Icon className={`h-5 w-5 ${iconColor}`} />
    </div>

    <div className="flex flex-col flex-1">
      <span className={`text-sm font-medium leading-none group-hover:underline ${isDone ? "line-through text-muted-foreground" : ""}`}>
        {currentTitle}
      </span>
      <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
        Task • {currentStatus.replace("_", " ")}
      </span>
    </div>

    {/* Optional: Add a subtle little "open" icon that appears on hover */}
    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-muted-foreground">
      Open ↗
    </div>
  </div>
);
};

// 🟢 3. The BlockNote Specification wrapper
export const TaskBlock = createReactBlockSpec(
  {
    type: "task",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      taskId: { default: "" },
      taskTitle: { default: "Unknown Task" },
      taskStatus: { default: "TODO" },
    },
    content: "none",
  },
  {
    // Render our new Live React Component!
    render: (props) => <LiveTaskCard block={props.block} editor={props.editor} />
  }
);