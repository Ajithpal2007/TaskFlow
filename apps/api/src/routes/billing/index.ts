import { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../middleware/require-auth";
import { requireWorkspaceRole } from "../../middleware/require-role";
import { prisma } from "@repo/database";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2026-03-25.dahlia",
});

const billingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/workspaces/:workspaceId/checkout",
    { 
      // Only Workspace Owners or Admins should be allowed to touch the credit card!
      preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN"])] 
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };
      const userId = (request as any).user.id;

      try {
        // 1. Fetch the workspace to see if they already have a Stripe Customer ID
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
        });

        if (!workspace) {
          return reply.code(404).send({ message: "Workspace not found" });
        }

        let customerId = workspace.stripeCustomerId;

        // 2. If they don't have a Stripe ID yet, create one in Stripe!
        if (!customerId) {
          const customer = await stripe.customers.create({
            name: workspace.name,
            metadata: {
              workspaceId: workspace.id, // Tie the Stripe customer to your database ID
            },
          });
          
          customerId = customer.id;

          // Save this new ID to your database
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: { stripeCustomerId: customerId },
          });
        }

        // 3. Create the Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          mode: "subscription", // Because this is a monthly recurring charge
          payment_method_types: ["card"], // In Test Mode, this accepts the fake 4242 card!
          line_items: [
            {
              price: process.env.STRIPE_PRO_PRICE_ID, // The ID of your $8/mo plan
              quantity: 1, // Note: For Per-Seat pricing, we will dynamically calculate this later
            },
          ],
          // Where Stripe sends them after they pay (or if they click back)
          success_url: `${process.env.FRONTEND_URL}/dashboard/${workspaceId}/billing?success=true`,
          cancel_url: `${process.env.FRONTEND_URL}/dashboard/${workspaceId}/billing?canceled=true`,
          
          // 🟢 CRITICAL: Pass the workspaceId so your webhook knows who paid!
          client_reference_id: workspaceId, 
        });

        // 4. Return the secure Stripe URL to the frontend
        return reply.code(200).send({ url: session.url });

      } catch (error) {
        console.error("Stripe Checkout Error:", error);
        return reply.code(500).send({ message: "Failed to create checkout session" });
      }
    }
  );

  // 🟢 NEW: THE CUSTOMER PORTAL ROUTE
  fastify.get(
    "/workspaces/:workspaceId/portal",
    { 
      // Only the boss gets to look at the invoices and change the credit card!
      preHandler: [requireAuth, requireWorkspaceRole(["OWNER", "ADMIN"])] 
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      try {
        // 1. Fetch the workspace to get their specific Stripe Customer ID
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: { stripeCustomerId: true },
        });

        if (!workspace) {
          return reply.code(404).send({ message: "Workspace not found" });
        }

        // 2. If they have never paid, they don't have a portal!
        if (!workspace.stripeCustomerId) {
          return reply.code(400).send({ 
            message: "This workspace has no billing history. Please upgrade to Pro first." 
          });
        }

        // 3. Generate the secure magic link to Stripe's hosted portal
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: workspace.stripeCustomerId,
          
          // Where the user goes when they click the "Return to TaskFlow" button in the portal
          return_url: `${process.env.FRONTEND_URL}/dashboard/${workspaceId}/settings/billing`,
        });

        // 4. Send the URL to the frontend so it can redirect the user
        return reply.code(200).send({ url: portalSession.url });

      } catch (error) {
        console.error("Stripe Portal Error:", error);
        return reply.code(500).send({ message: "Failed to generate billing portal link" });
      }
    }
  );
};

export default billingRoutes;