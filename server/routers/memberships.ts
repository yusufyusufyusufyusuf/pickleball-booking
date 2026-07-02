import Stripe from "stripe";
import { z } from "zod";
import { getActiveSubscription, upsertSubscription, cancelSubscription } from "../db";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

// Stripe product/price IDs for memberships
const MEMBERSHIP_TIERS = {
  silver: {
    name: "Silver Membership",
    priceId: process.env.STRIPE_SILVER_PRICE_ID || "price_silver_placeholder",
    amountCents: 5000, // $50.00
  },
  gold: {
    name: "Gold Membership",
    priceId: process.env.STRIPE_GOLD_PRICE_ID || "price_gold_placeholder",
    amountCents: 10000, // $100.00
  },
} as const;

export const membershipsRouter = router({
  /**
   * Creates a Stripe Checkout session for a membership subscription.
   * Redirects to Stripe Checkout for payment.
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["silver", "gold"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const tierConfig = MEMBERSHIP_TIERS[input.tier];
      if (!tierConfig) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid membership tier",
        });
      }

      const origin = ctx.req.headers.origin || "https://book.yusufremtulla.com";

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "subscription",
          customer_email: ctx.user.email || undefined,
          client_reference_id: ctx.user.id.toString(),
          metadata: {
            user_id: ctx.user.id.toString(),
            customer_email: ctx.user.email || "",
            customer_name: ctx.user.name || "",
            tier: input.tier,
          },
          line_items: [
            {
              price: tierConfig.priceId,
              quantity: 1,
            },
          ],
          success_url: `${origin}/account/membership?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${origin}/memberships`,
          allow_promotion_codes: true,
        });

        return { url: session.url };
      } catch (error) {
        console.error("[Memberships] Checkout session creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  /**
   * Retrieves the user's active subscription, if any.
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    try {
      const subscription = await getActiveSubscription(ctx.user.id);
      return subscription || null;
    } catch (error) {
      console.error("[Memberships] Failed to fetch active subscription:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch subscription",
      });
    }
  }),

  /**
   * Cancels the user's active subscription.
   * Calls Stripe API to cancel the subscription.
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const subscription = await getActiveSubscription(ctx.user.id);
      if (!subscription) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active subscription found",
        });
      }

      // Cancel the Stripe subscription
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update local record
      await cancelSubscription(subscription.stripeSubscriptionId);

      return { success: true };
    } catch (error) {
      console.error("[Memberships] Cancellation failed:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel subscription",
      });
    }
  }),
});
