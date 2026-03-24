import { useEffect, useRef, useState } from "react";

export function useSocket(projectId: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    // 🟢 Connect to your Fastify backend
    const socket = new WebSocket(`ws://localhost:4000/api/projects/${projectId}/board/ws`);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      console.log("🚀 Connected to Real-time Board");
      
      // Send a test message
      socket.send(JSON.stringify({ type: "JOIN_BOARD", projectId }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📡 Real-time update:", data);
      
      // TODO: We will trigger a React Query cache refresh here later!
    };

    socket.onclose = () => {
      setIsConnected(false);
      console.log("🔌 Disconnected from Board");
    };

    // Cleanup when user leaves the page
    return () => {
      socket.close();
    };
  }, [projectId]);

  const sendMessage = (data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
    }
  };

  return { isConnected, sendMessage };
}