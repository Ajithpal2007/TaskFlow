import { FastifyPluginAsync } from "fastify";
import { chatHub } from "../../lib/chat-hub.js";
import type { WebSocket } from "ws"; 
import { requireAuth } from "../../middleware/require-auth.js";
import { prisma } from "@repo/database";

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  
  // 🟢 THE FIX: In v11, the first argument is directly the 'socket'
  fastify.get("/ws", { websocket: true }, (socket: WebSocket, request) => {
    
    // 🟢 THE FIX: Explicitly type 'message' as a Buffer
    socket.on("message", (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
 
        if (data.action === "subscribe" && data.channelId) {
          chatHub.subscribe(data.channelId, socket);
          console.log(`Socket joined channel room: ${data.channelId}`);
        }

        if (data.action === "unsubscribe" && data.channelId) {
          chatHub.unsubscribe(data.channelId, socket);
        }

        if (data.action === "typing" && data.channelId) {
          chatHub.broadcast(data.channelId, {
            type: "USER_TYPING",
            userName: data.userName,
            channelId: data.channelId
          });
        }

      } catch (error) {
        console.error("Invalid WS message format", error);
      }
    });
  });

 // 🟢 GET CHAT HISTORY: Fetch the last 50 messages when opening a channel
 // 🟢 GET CHAT HISTORY
  fastify.get(
    "/channels/:channelId/messages",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id; // 🟢 Grab the user ID
      const { channelId } = request.params as { channelId: string };

      try {
        // 🔒 SECURITY CHECK: Does this user have permission to view this room?
        const hasAccess = await prisma.channel.findFirst({
          where: {
            id: channelId,
            OR: [
              { members: { some: { userId } } },    // They are explicitly in the channel
              { type: "GROUP", isPrivate: false }   // OR it's a public workspace channel
            ]
          }
        });

        if (!hasAccess) {
          return reply.code(403).send({ message: "Access denied. You are not in this channel." });
        }

        // ✅ Passed the check! Now fetch the messages.
        const messages = await prisma.message.findMany({
          where: { 
            channelId, 
            parentId: null,
            deletedAt: null 
          },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            attachments: true,
            reactions: true,
          },
          orderBy: { createdAt: "asc" }, 
          take: 50, 
        });

        return reply.code(200).send({ data: messages });
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        return reply.code(500).send({ message: "Failed to fetch messages" });
      }
    }
  );

  // 🟢 GET ALL CHANNELS FOR A USER
  fastify.get(
    "/channels",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { workspaceId } = request.query as { workspaceId: string };

      if (!workspaceId) return reply.code(400).send({ message: "Workspace ID required" });

      try {
        const channels = await prisma.channel.findMany({
          where: {
            workspaceId,
            // 🟢 THE FIX: Fetch channels I am explicitly in, OR any public workspace groups!
            OR: [
              { members: { some: { userId } } }, 
              { type: "GROUP", isPrivate: false } 
            ]
          },
          include: {
            // MAGIC TRICK: If it's a DM, fetch the OTHER user's profile so we can show their avatar
            members: {
              where: { userId: { not: userId } },
              include: { user: { select: { id: true, name: true, image: true } } }
            }
          },
          orderBy: { updatedAt: "desc" } // Show most recently active chats first
        });

        return reply.code(200).send({ data: channels });
      } catch (error) {
        console.error("Failed to fetch channels:", error);
        return reply.code(500).send({ message: "Failed to fetch channels" });
      }
    }
  );

  // 🟢 CREATE A NEW CHANNEL OR DM
  fastify.post(
    "/channels",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const currentUserId = (request as any).user.id;
      const { workspaceId, type, name, targetUserId } = request.body as {
        workspaceId: string;
        type: "GROUP" | "DIRECT";
        name?: string;
        targetUserId?: string; // Only used for DMs
      };

      if (!workspaceId) return reply.code(400).send({ message: "Workspace ID required" });

      try {
        // --- 🔴 SCENARIO 1: DIRECT MESSAGE ---
        if (type === "DIRECT") {
          if (!targetUserId) return reply.code(400).send({ message: "Target User ID required for DMs" });
          
          // Check if a DM already exists between these two users in this workspace
          const existingDM = await prisma.channel.findFirst({
            where: {
              workspaceId,
              type: "DIRECT",
              AND: [
                { members: { some: { userId: currentUserId } } },
                { members: { some: { userId: targetUserId } } }
              ]
            }
          });

          // If it exists, just return it so the frontend can redirect!
          if (existingDM) return reply.code(200).send({ data: existingDM });

          // If not, create a new DM
          const newDM = await prisma.channel.create({
            data: {
              workspaceId,
              type: "DIRECT",
              members: {
                create: [
                  { userId: currentUserId, role: "OWNER" },
                  { userId: targetUserId, role: "MEMBER" }
                ]
              }
            }
          });
          return reply.code(201).send({ data: newDM });
        }

        // --- 🔵 SCENARIO 2: GROUP CHANNEL ---
        if (type === "GROUP") {
          if (!name) return reply.code(400).send({ message: "Channel name required" });

          // Format the name (lowercase, replace spaces with dashes like Slack)
          const formattedName = name.toLowerCase().replace(/\s+/g, '-');

          const newGroup = await prisma.channel.create({
            data: {
              workspaceId,
              name: formattedName,
              type: "GROUP",
              // Initially, just add the creator. (You can add an "Invite" feature later!)
              members: {
                create: [{ userId: currentUserId, role: "OWNER" }]
              }
            }
          });
          return reply.code(201).send({ data: newGroup });
        }

      } catch (error) {
        console.error("Failed to create channel:", error);
        return reply.code(500).send({ message: "Failed to create channel" });
      }
    }
  );

  // 🟢 SEND A MESSAGE: Save to DB, then broadcast via WebSockets!
  // 🟢 SEND A MESSAGE
  fastify.post(
    "/messages",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      
      // 1. EXTRACT FIRST: Grab the data from the request body BEFORE using it!
      const { channelId, content, parentId,fileUrls } = request.body as { 
        channelId: string; 
        content: string; 
        parentId?: string;
        fileUrls?: string[];

      };

      // 2. VALIDATE: Ensure the required fields exist
     if (!channelId || (!content && (!fileUrls || fileUrls.length === 0))) {
        return reply.code(400).send({ message: "Channel ID and either content or files are required" });
      }

      try {
        // 3. SECURITY CHECK: Does this user have permission to post in this room?
        const hasAccess = await prisma.channel.findFirst({
          where: {
            id: channelId,
            OR: [
              { members: { some: { userId } } },    // They are explicitly in the channel
              { type: "GROUP", isPrivate: false }   // OR it's a public workspace channel
            ]
          }
        });

        if (!hasAccess) {
          return reply.code(403).send({ message: "Access denied. You are not in this channel." });
        }

        // 4. SAVE TO DB: Passed the check! Now create the message.
        const newMessage = await prisma.message.create({
          data: {
            content,
            channelId,
            senderId: userId,
            parentId: parentId || null,
            fileUrls: fileUrls || [],
          },
          include: {
            sender: { select: { id: true, name: true, image: true } },
            attachments: true,
            reactions: true,
          },
        });

        // 5. BROADCAST: Send to everyone in the room!
        chatHub.broadcast(channelId, {
          type: "NEW_MESSAGE",
          data: newMessage,
        });

        // 🟢 THE TRIGGER: Scan for @mentions
        // Matches our exact syntax: @[Name](user:id)
        const mentionRegex = /@\[([^\]]+)\]\(user:([^)]+)\)/g;
        let match;
        const mentionedUserIds = new Set<string>(); // Use a Set to avoid duplicate notifications

        while ((match = mentionRegex.exec(content)) !== null) {
          const mentionedId = match[2];
          // Don't notify the user if they tagged themselves!
          if (mentionedId !== userId) {
             mentionedUserIds.add(mentionedId);
          }
        }

        // If we found any mentions, create notifications for them!
        if (mentionedUserIds.size > 0) {
           
           // Fetch the channel name to make the notification helpful
           const channel = await prisma.channel.findUnique({ where: { id: channelId }});
           const channelName = channel?.type === "DIRECT" ? "a direct message" : `#${channel?.name}`;

           const notificationPromises = Array.from(mentionedUserIds).map((mentionedId) => {
              return prisma.notification.create({
                data: {
                  userId: mentionedId,
                  type: "MENTIONED",
                  content: `${newMessage.sender.name} mentioned you in ${channelName}`,
                  // Note: Since this is a chat message, we don't attach a taskId
                }
              });
           });

           // Run them all in parallel!
           await Promise.all(notificationPromises);
        }

       

        return reply.code(201).send({ data: newMessage });
      } catch (error) {
        console.error("Failed to send message:", error);
        return reply.code(500).send({ message: "Failed to send message" });
      }
    }
  );

  // 🟢 GET A SPECIFIC THREAD
  fastify.get(
    "/messages/:messageId/thread",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const { messageId } = request.params as { messageId: string };

      try {
        // 1. Get the original message
        const parent = await prisma.message.findUnique({
          where: { id: messageId },
          include: { sender: true },
        });

        // 2. Get all the replies
        const replies = await prisma.message.findMany({
          where: { parentId: messageId },
          include: { sender: true },
          orderBy: { createdAt: "asc" }, // Oldest replies first
        });

        return reply.send({ data: { parent, replies } });
      } catch (error) {
        return reply.status(500).send({ error: "Failed to fetch thread" });
      }
    }
  );

  // POST /api/chat/messages/:messageId/reactions
  fastify.post(
    "/messages/:messageId/reactions",
    { preHandler: [requireAuth] },
    async (request, reply) => {
      const userId = (request as any).user.id;
      const { messageId } = request.params as { messageId: string };
      const { emoji, channelId } = request.body as { emoji: string; channelId: string };

      try {
        // 1. Check if the reaction already exists
        const existingReaction = await prisma.reaction.findUnique({
          where: {
            messageId_userId_emoji: { messageId, userId, emoji },
          },
        });

        let action = "add";
        let reactionRecord;

        if (existingReaction) {
          // 2. If it exists, REMOVE it (Toggle Off)
          await prisma.reaction.delete({
            where: { id: existingReaction.id },
          });
          action = "remove";
        } else {
          // 3. If it doesn't exist, CREATE it (Toggle On)
          reactionRecord = await prisma.reaction.create({
            data: { messageId, userId, emoji },
            include: { user: { select: { id: true, name: true } } },
          });
        }

        // 4. Broadcast the update to everyone in the channel
        chatHub.broadcast(channelId, {
          type: "REACTION_TOGGLED",
          data: {
            messageId,
            emoji,
            userId,
            action,
            reaction: reactionRecord, // Null if removed, full object if added
          },
        });

        return reply.code(200).send({ success: true, action });
      } catch (error) {
        console.error(error);
        return reply.code(500).send({ message: "Failed to toggle reaction" });
      }
    }
  );

};

export default chatRoutes;