"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useBoardSocket(projectId: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (!projectId) return;

    const ws = new WebSocket(
      `${apiUrl}/api/projects/${projectId}/board/ws`,
    );
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🟢 1. Handle Card Movements
        if (data.type === "TASK_MOVED") {
          const { taskId, newStatus } = data.payload;
          console.log(
            `🚀 Instant Update: Moving Task ${taskId} to ${newStatus}`,
          );

          queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
            if (!oldTasks) return oldTasks;
            return oldTasks.map((task: any) =>
              task.id === taskId ? { ...task, status: newStatus } : task,
            );
          });
        }

        // 🟢 2. Handle Brand New Tasks
        else if (data.type === "TASK_CREATED") {
          console.log(`✨ Instant Update: New Task Created!`);

          queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
            // If the board is empty, start a new array
            if (!oldTasks) return [data.payload];

            // Safety check: Don't add it if it's already there (prevents duplicates for the sender)
            if (oldTasks.some((t: any) => t.id === data.payload.id))
              return oldTasks;

            // Push the new task into the existing array!
            return [...oldTasks, data.payload];
          });
        }

        // 🟢 1. Handle Instant "Ghost" Tasks
        else if (data.type === "TASK_OPTIMISTIC") {
          console.log(`👻 Instant Ghost Task arrived!`);
          queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
            if (!oldTasks) return [data.payload];
            return [...oldTasks, data.payload];
          });
        }

        // 🟢 2. Handle The Database Confirmation
        else if (data.type === "TASK_CONFIRMED") {
          console.log(`✨ Ghost Task converted to Real Task!`);
          const { tempId, realTask } = data.payload;

          queryClient.setQueryData(["tasks", projectId], (oldTasks: any) => {
            if (!oldTasks) return [realTask];

            // Find the ghost card using the tempId, and swap it with the real task!
            return oldTasks.map((task: any) =>
              task.id === tempId ? realTask : task,
            );
          });
        }
      } catch (err) {
        // Ignore messages that aren't valid JSON
        console.error("Error parsing WebSocket message:", err);
      }
    };

    return () => ws.close();
  }, [projectId, queryClient]);

  // 🟢 4. Upgrade the sender to accept a payload object
  const broadcastUpdate = (payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      // Convert the object to a string before sending
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return { broadcastUpdate };
}
