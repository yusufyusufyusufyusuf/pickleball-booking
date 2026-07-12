import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { createBooking, getBookingBySessionId, upsertSubscription, cancelSubscription } from "./db";
import { sendBookingConfirmation } from "./email";
import { notifyOwner } from "./_core/notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export function registerStripeWebhook(app: Express) {
  /**
   * IMPORTANT: This route must be registered BEFORE express.json() so that
   * the raw body is available for Stripe signature verification.
   * The raw body middleware is applied only to this specific path.
   */
  app.post(
    "/api/stripe/webhook",
    // Use raw body for Stripe signature verification
    (req: Request, res: Response, next) => {
      let rawBody = "";
      req.setEncoding("utf8");
      req.on("data", (chunk: string) => {
        rawBody += chunk;
      });
      req.on("end", () => {
        (req as any).rawBody = rawBody;
        next();
      });
    },
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          (req as any).rawBody,
          sig,
          webhookSecret
        );
      } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

      // Handle test events from Stripe dashboard
      if (event.id.startsWith("evt_test_")) {
        console.log("[Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only process paid sessions
        if (session.payment_status !== "paid") {
          console.log("[Webhook] Session not paid, skipping:", session.id);
          return res.json({ received: true });
        }

        // Idempotency: skip if already recorded
        const existing = await getBookingBySessionId(session.id);
        if (existing) {
          console.log("[Webhook] Booking already recorded for session:", session.id);
          return res.json({ received: true });
        }

        const meta = session.metadata || {};
        const customerName = meta.customerName || session.customer_details?.name || "Guest";
        const customerEmail =
          meta.customerEmail || session.customer_details?.email || session.customer_email || "";
        const bookingDate = meta.bookingDate;
        const startHour = parseInt(meta.startHour, 10);
        const durationHours = parseInt(meta.durationHours, 10) as 1 | 2;
        const amountPaid = parseInt(meta.amountPaid, 10) || (session.amount_total ?? 0);

        if (!bookingDate || isNaN(startHour) || isNaN(durationHours)) {
          console.error("[Webhook] Missing required metadata in session:", session.id);
          return res.status(400).json({ error: "Missing booking metadata" });
        }

        try {
          const booking = await createBooking({
            customerName,
            customerEmail,
            bookingDate,
            startHour,
            durationHours,
            amountPaid,
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id ?? null,
            status: "confirmed",
          });
          console.log(`[Webhook] Booking created for session: ${session.id}`);

          // Build a short human-readable reference
          const bookingRef = session.id.startsWith("manual_")
            ? `#${booking.id}`
            : session.id.slice(-12).toUpperCase();

          // Send customer confirmation email (non-blocking)
          sendBookingConfirmation({
            customerName,
            customerEmail,
            bookingDate,
            startHour,
            durationHours: durationHours as 1 | 2,
            amountPaid,
            bookingRef,
          }).catch((e) => console.error("[Email] Unexpected error:", e));

          // Notify the owner of the new booking
          notifyOwner({
            title: `New booking: ${customerName}`,
            content: `${customerName} (${customerEmail}) booked the court on ${bookingDate} from ${startHour}:00 for ${durationHours}h. Paid: $${(amountPaid / 100).toFixed(2)}.`,
          }).catch((e) => console.error("[Notification] Unexpected error:", e));

        } catch (err: any) {
          console.error("[Webhook] Failed to create booking:", err.message);
          return res.status(500).json({ error: "Failed to record booking" });
        }
      }

      // Handle subscription events
      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = parseInt(subscription.metadata?.user_id || "", 10);

        if (!userId || isNaN(userId)) {
          console.warn("[Webhook] Subscription event missing user_id metadata");
          return res.json({ received: true });
        }

        try {
          const tier = (subscription.metadata?.tier || "silver") as "silver" | "gold";
          await upsertSubscription({
            userId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            tier,
            status: subscription.status as "active" | "past_due" | "cancelled",
            currentPeriodStart: Math.floor((subscription as any).current_period_start * 1000),
            currentPeriodEnd: Math.floor((subscription as any).current_period_end * 1000),
            cancelledAt: subscription.canceled_at ? Math.floor(subscription.canceled_at * 1000) : null,
          });
          console.log(`[Webhook] Subscription ${subscription.id} recorded for user ${userId}`);

          // Notify owner of new membership
          if (event.type === "customer.subscription.created") {
            notifyOwner({
              title: `New ${tier} membership`,
              content: `User #${userId} subscribed to ${tier} membership.`,
            }).catch((e) => console.error("[Notification] Error:", e));
          }
        } catch (err: any) {
          console.error("[Webhook] Failed to process subscription:", err.message);
          return res.status(500).json({ error: "Failed to record subscription" });
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object as Stripe.Subscription;
        try {
          await cancelSubscription(subscription.id);
          console.log(`[Webhook] Subscription ${subscription.id} marked as cancelled`);
        } catch (err: any) {
          console.error("[Webhook] Failed to cancel subscription:", err.message);
          return res.status(500).json({ error: "Failed to cancel subscription" });
        }
      }

      return res.json({ received: true });
    }
  );
}
