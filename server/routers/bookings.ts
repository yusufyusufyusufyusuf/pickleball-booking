import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod";
import {
  adminCreateBooking,
  cancelBooking,
  getAllBookings,
  getBookingBySessionId,
  getBookingsForDate,
  getBookingStats,
  isSlotAvailable,
} from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

// Court operating hours: 8 AM – 9 PM (last slot start at 20 for 1hr, 19 for 2hr)
const COURT_OPEN_HOUR = 8;
const COURT_CLOSE_HOUR = 21; // exclusive end

const PRICES = {
  1: 2000, // $20.00 in cents
  2: 3500, // $35.00 in cents
} as const;

function adminProcedure() {
  return protectedProcedure.use(({ ctx, next }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next({ ctx });
  });
}

export const bookingsRouter = router({
  /**
   * Returns available time slots for a given date.
   * Each slot includes the hour and whether it is available for 1hr and/or 2hr.
   */
  getAvailableSlots: publicProcedure
    .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
    .query(async ({ input }) => {
      const existing = await getBookingsForDate(input.date);

      const slots = [];
      for (let hour = COURT_OPEN_HOUR; hour < COURT_CLOSE_HOUR; hour++) {
        const available1hr = !existing.some((b) => {
          const bEnd = b.startHour + b.durationHours;
          const newEnd = hour + 1;
          return hour < bEnd && b.startHour < newEnd;
        });

        const available2hr =
          hour + 2 <= COURT_CLOSE_HOUR &&
          !existing.some((b) => {
            const bEnd = b.startHour + b.durationHours;
            const newEnd = hour + 2;
            return hour < bEnd && b.startHour < newEnd;
          });

        slots.push({ hour, available1hr, available2hr });
      }
      return slots;
    }),

  /**
   * Creates a Stripe Checkout session for a booking.
   * The booking is NOT recorded in the DB here — only after webhook confirmation.
   */
  createCheckoutSession: publicProcedure
    .input(
      z.object({
        customerName: z.string().min(1).max(255),
        customerEmail: z.string().email(),
        bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startHour: z.number().int().min(COURT_OPEN_HOUR).max(COURT_CLOSE_HOUR - 1),
        durationHours: z.union([z.literal(1), z.literal(2)]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate slot is still available
      const available = await isSlotAvailable(
        input.bookingDate,
        input.startHour,
        input.durationHours
      );
      if (!available) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This time slot is no longer available. Please choose another.",
        });
      }

      const amountCents = PRICES[input.durationHours];
      const startLabel = formatHour(input.startHour);
      const endLabel = formatHour(input.startHour + input.durationHours);
      const dateLabel = new Date(input.bookingDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const origin = (ctx.req.headers.origin as string) || "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Pickleball Court — ${dateLabel}`,
                description: `${startLabel} – ${endLabel} (${input.durationHours} hour${input.durationHours > 1 ? "s" : ""})`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: input.customerEmail,
        success_url: `${origin}/booking/confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/book`,
        metadata: {
          customerName: input.customerName,
          customerEmail: input.customerEmail,
          bookingDate: input.bookingDate,
          startHour: String(input.startHour),
          durationHours: String(input.durationHours),
          amountPaid: String(amountCents),
        },
      });

      return { url: session.url!, sessionId: session.id };
    }),

  /**
   * Retrieves a booking by Stripe session ID for the confirmation page.
   */
  getBySessionId: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      const booking = await getBookingBySessionId(input.sessionId);
      if (!booking) return null;
      return booking;
    }),

  // ─── Admin procedures ──────────────────────────────────────────────────────

  adminList: adminProcedure()
    .input(
      z
        .object({
          search: z.string().optional(),
          dateFilter: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      let all = await getAllBookings();
      if (input?.dateFilter) {
        all = all.filter((b) => b.bookingDate === input.dateFilter);
      }
      if (input?.search) {
        const q = input.search.toLowerCase();
        all = all.filter(
          (b) =>
            b.customerName.toLowerCase().includes(q) ||
            b.customerEmail.toLowerCase().includes(q)
        );
      }
      return all;
    }),

  adminStats: adminProcedure().query(async () => {
    return getBookingStats();
  }),

  adminCancel: adminProcedure()
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await cancelBooking(input.id);
      return { success: true };
    }),

  adminAdd: adminProcedure()
    .input(
      z.object({
        customerName: z.string().min(1).max(255),
        customerEmail: z.string().email(),
        bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        startHour: z.number().int().min(COURT_OPEN_HOUR).max(COURT_CLOSE_HOUR - 1),
        durationHours: z.union([z.literal(1), z.literal(2)]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const available = await isSlotAvailable(
        input.bookingDate,
        input.startHour,
        input.durationHours
      );
      if (!available) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This time slot conflicts with an existing booking.",
        });
      }
      const amountPaid = PRICES[input.durationHours];
      await adminCreateBooking({
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        bookingDate: input.bookingDate,
        startHour: input.startHour,
        durationHours: input.durationHours,
        amountPaid,
        notes: input.notes,
        status: "confirmed",
      });
      return { success: true };
    }),
});

function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:00 ${period}`;
}
