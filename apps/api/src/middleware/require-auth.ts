import type { FastifyRequest, FastifyReply } from "fastify";
import { auth } from "auth"; 

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const data = await auth.api.getSession({
    headers: req.headers as any,
  });

  if (!data) {
    return reply.status(401).send({ message: "Unauthorized" });
  }

  (req as any).user = data.user;
  (req as any).session = data.session;
}