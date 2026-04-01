import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@repo/database";

export const requirePlan = (allowedPlans: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // 1. Grab the workspaceId (usually from the URL, sometimes from the body)
      const params = request.params as { workspaceId?: string };
      const body = request.body as { workspaceId?: string };
      const workspaceId = params.workspaceId || body.workspaceId;

      if (!workspaceId) {
        return reply.code(400).send({ message: "Workspace ID is required for this action." });
      }

      // 2. Fetch the billing status from the database
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { planId: true, currentPeriodEnd: true },
      });

      if (!workspace) {
        return reply.code(404).send({ message: "Workspace not found." });
      }

      // 3. THE CRITICAL CHECK: Have they paid, AND is their month still active?
      const hasCorrectPlan = allowedPlans.includes(workspace.planId || "");
      const isSubscriptionActive = workspace.currentPeriodEnd && new Date() < workspace.currentPeriodEnd;

      // 4. If they are on the free plan, or their Pro plan expired yesterday, block them!
      if (!hasCorrectPlan || !isSubscriptionActive) {
        return reply.code(402).send({ 
          error: "Payment Required",
          message: `This action requires an active ${allowedPlans.join(" or ")} subscription. Please upgrade your workspace.` 
        });
      }

      // 5. Success! They are a paying customer. Let the route run.

    } catch (error) {
      console.error("Billing Middleware Error:", error);
      return reply.code(500).send({ message: "Internal server error verifying subscription." });
    }
  };
};