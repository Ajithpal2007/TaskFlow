import { WebSocket } from "ws";
import Redis from "ioredis";

// 1. Setup Redis Connections
// Redis requires TWO connections for Pub/Sub: One to talk, one exclusively to listen.
// 🟢 Look for REDIS_URL instead!
const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || "";
if (!redisUrl) console.warn("⚠️ Redis URL is missing from .env!");

const pubClient = new Redis(redisUrl); 
const subClient = new Redis(redisUrl); 

class ChatHub {
  // We still keep a local map for the users physically connected to THIS specific server
  private localSubscriptions = new Map<string, Set<WebSocket>>();

  constructor() {
    // 2. Tell the "Listener" to tune into our global chat frequency
    subClient.subscribe("global:chat", (err) => {
      if (err) console.error("Redis Sub Error:", err);
      else console.log("🎧 Connected to Upstash Redis Pub/Sub");
    });

    // 3. Listen for messages flying across Redis from ANY server
    subClient.on("message", (channel, message) => {
      if (channel === "global:chat") {
        try {
          const { channelId, payload } = JSON.parse(message);
          // When Redis hands us a message, push it to our local browsers!
          this.localBroadcast(channelId, payload);
        } catch (error) {
          console.error("Failed to parse Redis message:", error);
        }
      }
    });
  }

  // --- LOCAL MEMORY MANAGEMENT ---
  subscribe(channelId: string, socket: WebSocket) {
    if (!this.localSubscriptions.has(channelId)) {
      this.localSubscriptions.set(channelId, new Set());
    }
    this.localSubscriptions.get(channelId)!.add(socket);

    socket.on("close", () => this.unsubscribe(channelId, socket));
  }

  unsubscribe(channelId: string, socket: WebSocket) {
    const subscribers = this.localSubscriptions.get(channelId);
    if (subscribers) {
      subscribers.delete(socket);
      if (subscribers.size === 0) {
        this.localSubscriptions.delete(channelId); // Save RAM!
      }
    }
  }

  // --- 🟢 THE MAGIC: DISTRIBUTED BROADCAST ---
  // Any REST API route calls this. Instead of updating screens directly, 
  // it blasts the message up to Upstash!
  broadcast(channelId: string, payload: any) {
    const redisMessage = JSON.stringify({ channelId, payload });
    pubClient.publish("global:chat", redisMessage);
  }

  // --- 🟢 LOCAL DELIVERY ---
  // Triggered automatically by `subClient.on("message")`
  private localBroadcast(channelId: string, payload: any) {
    const subscribers = this.localSubscriptions.get(channelId);
    if (subscribers) {
      const messageString = JSON.stringify(payload);
      for (const socket of subscribers) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageString);
        }
      }
    }
  }
}

// Export the singleton
export const chatHub = new ChatHub();