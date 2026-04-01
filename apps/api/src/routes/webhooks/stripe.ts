import { FastifyPluginAsync } from "fastify";
import Stripe from "stripe";
import { prisma } from "@repo/database"; // Make sure this path is correct for your repo!

// Initialize Stripe (Make sure STRIPE_SECRET_KEY is in your .env)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as any, // Use your installed version
});

const stripeWebhookRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    "/stripe", // Since we registered it with prefix: "/api/webhooks/stripe", this is just "/"
    {
      config: {
        rawBody: true, // 🟢 CRITICAL: Fastify needs this to verify the signature!
      },
    },
    async (request, reply) => {
      console.log("🔔 [WEBHOOK] Received a request from Stripe!");

      const sig = request.headers["stripe-signature"];
      let event: Stripe.Event;

      try {
        // 1. Verify it's actually Stripe sending this (not a hacker)
        event = stripe.webhooks.constructEvent(
          request.rawBody as string,
          sig as string,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
        console.log(`✅ [WEBHOOK] Signature verified! Event Type: ${event.type}`);
      } catch (err: any) {
        console.error("❌ [WEBHOOK] Signature Verification Failed:", err.message);
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }

      // 2. Handle the specific events we care about
      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log("💰 [WEBHOOK] Processing Checkout Session:", session.id);

          // This is the workspaceId we passed during the checkout step!
          const workspaceId = session.client_reference_id; 
          const customerId = session.customer as string;

          console.log("   -> Workspace ID:", workspaceId);
          console.log("   -> Customer ID:", customerId);

          if (!workspaceId) {
            throw new Error("Missing client_reference_id in Stripe session");
          }

          // 3. Update the database!
          await prisma.workspace.update({
            where: { id: workspaceId },
            data: {
              stripeCustomerId: customerId,
              planId: "PRO",
              // Set the end date to 1 month from now (Stripe handles exact dates via subscription webhooks later, but this gets them instant access!)
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
            },
          });

          console.log(`🎉 [WEBHOOK] SUCCESS! Workspace ${workspaceId} is now PRO!`);
        } else {
          console.log(`🤷 [WEBHOOK] Ignored event type: ${event.type}`);
        }

        // 4. ALWAYS return a 200 to Stripe so it knows we handled it
        return reply.status(200).send({ received: true });

      } catch (error: any) {
        console.error("❌ [WEBHOOK] Database Update Failed:", error.message);
        // Still return 200 so Stripe doesn't retry infinitely if it's our DB's fault
        return reply.status(200).send({ error: "Internal processing error" }); 
      }
    }
  );
};

export default stripeWebhookRoute;