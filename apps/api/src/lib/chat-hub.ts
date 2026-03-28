import  { WebSocket } from "ws";

// A Map that links a Channel ID to a Set of active WebSocket connections
const channelSubscriptions = new Map<string, Set<WebSocket>>();

export const chatHub = {
  // 🟢 1. Add a user's connection to a specific channel room
  subscribe: (channelId: string, socket: WebSocket) => {
    if (!channelSubscriptions.has(channelId)) {
      channelSubscriptions.set(channelId, new Set());
    }
    channelSubscriptions.get(channelId)!.add(socket);
    
    // Automatically clean up when they close the tab or disconnect
    socket.on("close", () => {
      chatHub.unsubscribe(channelId, socket);
    });
  },

  // 🟢 2. Remove a connection
  unsubscribe: (channelId: string, socket: WebSocket) => {
    const subscribers = channelSubscriptions.get(channelId);
    if (subscribers) {
      subscribers.delete(socket);
      // If the room is empty, delete it to save server RAM!
      if (subscribers.size === 0) {
        channelSubscriptions.delete(channelId);
      }
    }
  },

  // 🟢 3. The Magic Broadcast Function!
  // Any REST API route can call this to instantly update everyone's screen
  broadcast: (channelId: string, payload: any) => {
    const subscribers = channelSubscriptions.get(channelId);
    if (subscribers) {
      const messageString = JSON.stringify(payload);
      for (const socket of subscribers) {
        // Only send if the connection is still fully open
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
        }
      }
    }
  }
};