import { useEffect, useState, useRef, useCallback } from "react";
import { apiClient } from "@/app/lib/api-client"; // Adjust this import to match your setup
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    image: string | null;
  };
  isOptimistic?: boolean; // 🟢 Added this flag so the UI can style it differently!
}

export function useChatSocket(channelId: string | undefined, currentUser: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  const socketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🟢 1. FETCH INITIAL HISTORY & CONNECT WEBSOCKET
  useEffect(() => {
    if (!channelId) return;

    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.get(`/chat/channels/${channelId}/messages`);
        setMessages(data.data);
      } catch (error) {
        toast.error("Failed to load chat history");
      }
    };

    fetchHistory();

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:4000";
    const ws = new WebSocket(`${wsUrl}/api/chat/ws`);
    socketRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ action: "subscribe", channelId }));
    };

    ws.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === "NEW_MESSAGE") {
        setMessages((prev) => {
          // 🟢 THE FIX: Prevent duplicates! If the message is already in our state 
          // (because our Optimistic Update swapped it), ignore this broadcast!
          if (prev.some((msg) => msg.id === payload.data.id)) {
            return prev;
          }
          return [...prev, payload.data];
        });
        
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(payload.data.sender.name);
          return newSet;
        });
      }

      if (payload.type === "USER_TYPING" && payload.userName !== currentUser?.name) {
        setTypingUsers((prev) => new Set(prev).add(payload.userName));
        
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(new Set());
        }, 3000);
      }
    };

    ws.onclose = () => setIsConnected(false);

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: "unsubscribe", channelId }));
      }
      ws.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [channelId, currentUser?.name]);

  // 🟢 2. SEND MESSAGE (OPTIMISTIC UI UPGRADE)
  const sendMessage = async (content: string) => {
    if (!channelId || !content.trim() || !currentUser) return;

    // A. CREATE THE FAKE MESSAGE
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      content,
      senderId: currentUser.id,
      createdAt: new Date().toISOString(),
      sender: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image || "/default-avatar.png",
      },
      isOptimistic: true, // Tag it so the UI knows it's fake
    };

    // B. INJECT IT INSTANTLY
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // C. SEND IT QUIETLY IN THE BACKGROUND
      const res = await apiClient.post("/chat/messages", {
        channelId,
        content,
      });

      const realMessage = res.data.data;

      // D. SWAP THE FAKE MESSAGE FOR THE REAL ONE
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? realMessage : msg))
      );
    } catch (error) {
      // E. IF THE SERVER FAILS, DELETE THE FAKE MESSAGE AND WARN THE USER
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      toast.error("Failed to send message");
    }
  };

  // 🟢 3. BROADCAST TYPING (WEBSOCKET)
  const notifyTyping = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN && channelId && currentUser) {
      socketRef.current.send(
        JSON.stringify({ action: "typing", channelId, userName: currentUser.name })
      );
    }
  }, [channelId, currentUser]);

  return {
    messages,
    isConnected,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    notifyTyping,
  };
}