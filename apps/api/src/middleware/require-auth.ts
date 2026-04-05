import type { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "auth"; 
import { fromNodeHeaders } from "better-auth/node"; // 🟢 Bring in the translator!

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  // 1. Translate Fastify headers into Web Headers so Better Auth can read the cookie
  const data = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  // 2. Reject if the session is invalid or missing
  if (!data || !data.user) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  // 3. Attach the user and session payload to the request
  (req as any).user = data.user;
  (req as any).session = data.session;
}