import { useEffect, useState, useRef, useCallback } from "react";
import { apiClient } from "@/app/lib/api-client"; // Adjust this import to match your setup
import { toast } from "sonner";
import { useUIStore } from "@/app/lib/stores/use-ui-store";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  fileUrls: string[];
  reactions?: { emoji: string; userId: string }[];
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
  const activeThreadId = useUIStore((state) => state.activeThreadId);

  // 🟢 1. FETCH INITIAL HISTORY & CONNECT WEBSOCKET
  useEffect(() => {
    if (!channelId) return;

    const fetchHistory = async () => {
      try {
        const { data } = await apiClient.get(
          `/chat/channels/${channelId}/messages`,
        );
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
        if (payload.data.parentId) return;

        setMessages((prev) => {
          if (prev.some((msg) => msg.id === payload.data.id)) {
            return prev;
          }

          const pendingOptimistic = prev.find(
            (msg) =>
              msg.isOptimistic &&
              msg.senderId === currentUser?.id &&
              msg.content === payload.data.content,
          );

          if (pendingOptimistic) {
            // Swap the fake temp message with the real WebSocket message seamlessly!
            return prev.map((msg) =>
              msg.id === pendingOptimistic.id ? payload.data : msg,
            );
          }

          return [...prev, payload.data];
        });

        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(payload.data.sender.name);
          return newSet;
        });
      }

      if (
        payload.type === "USER_TYPING" &&
        payload.userName !== currentUser?.name
      ) {
        setTypingUsers((prev) => new Set(prev).add(payload.userName));

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUsers(new Set());
        }, 3000);
      }

      if (payload.type === "REACTION_TOGGLED") {
        const { messageId, emoji, userId, action, reaction } = payload.data;

        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id !== messageId) return msg;

            const currentReactions = msg.reactions || [];
            // Check if our Optimistic UI already handled this exact reaction
            const alreadyExists = currentReactions.some((r) => r.emoji === emoji && r.userId === userId);

            if (action === "add") {
              // 🟢 Prevent double-adding if Optimistic UI got there first!
              if (alreadyExists) return msg; 
              return { ...msg, reactions: [...currentReactions, reaction] };
            } else {
              // 🟢 Prevent trying to filter something that is already gone
              if (!alreadyExists) return msg;
              return {
                ...msg,
                reactions: currentReactions.filter((r) => !(r.emoji === emoji && r.userId === userId)),
              };
            }
          })
        );
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
  const sendMessage = async (content: string, fileUrls?: string[]) => {
    if (
      !channelId ||
      (!content.trim() && (!fileUrls || fileUrls.length === 0)) ||
      !currentUser
    )
      return;

    const tempId = `temp-${Date.now()}`;

    // A. CREATE THE FAKE MESSAGE

    const optimisticMessage: Message = {
      id: tempId,
      content: content,
      fileUrls: fileUrls || [],
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
        parentId: activeThreadId,
        content,
        fileUrls,
      });

      const realMessage = res.data.data;

      // D. SWAP THE FAKE MESSAGE FOR THE REAL ONE
      setMessages((prev) => {
        // 🟢 If the WebSocket already swapped it, the tempId is gone. Do nothing!
        if (!prev.some((msg) => msg.id === tempId)) return prev;

        // Otherwise, swap it now.
        return prev.map((msg) => (msg.id === tempId ? realMessage : msg));
      });
    } catch (error) {
      // E. IF THE SERVER FAILS, DELETE THE FAKE MESSAGE AND WARN THE USER
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      toast.error("Failed to send message");
    }
  };

  // 🟢 3. BROADCAST TYPING (WEBSOCKET)
  const notifyTyping = useCallback(() => {
    if (
      socketRef.current?.readyState === WebSocket.OPEN &&
      channelId &&
      currentUser
    ) {
      socketRef.current.send(
        JSON.stringify({
          action: "typing",
          channelId,
          userName: currentUser.name,
        }),
      );
    }
  }, [channelId, currentUser]);

  // 🟢 OPTIMISTIC REACTION TOGGLE
  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!channelId || !currentUser) return;

    // 1. Instantly update the UI before touching the server
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const currentReactions = msg.reactions || [];
        const hasReacted = currentReactions.some((r) => r.emoji === emoji && r.userId === currentUser.id);

        if (hasReacted) {
          // Optimistically REMOVE the reaction
          return {
            ...msg,
            reactions: currentReactions.filter((r) => !(r.emoji === emoji && r.userId === currentUser.id)),
          };
        } else {
          // Optimistically ADD the reaction
          return {
            ...msg,
            reactions: [...currentReactions, { emoji, userId: currentUser.id }],
          };
        }
      })
    );

    // 2. Send the actual request quietly in the background
    try {
      await apiClient.post(`/chat/messages/${messageId}/reactions`, {
        emoji,
        channelId,
      });
    } catch (error) {
      toast.error("Failed to update reaction");
      // If you want to be perfectly safe, you could roll back the state here,
      // but usually a toast error is enough context for the user to click it again!
    }
  };

  return {
    messages,
    isConnected,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    notifyTyping,
    toggleReaction,
  };
}
