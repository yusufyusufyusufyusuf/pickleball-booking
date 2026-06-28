import { Express, Request, Response } from "express";
import Stripe from "stripe";
import { createBooking, getBookingBySessionId } from "./db";

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
          await createBooking({
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
        } catch (err: any) {
          console.error("[Webhook] Failed to create booking:", err.message);
          return res.status(500).json({ error: "Failed to record booking" });
        }
      }

      return res.json({ received: true });
    }
  );
}
