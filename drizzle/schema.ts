import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Bookings table — one row per confirmed court reservation.
 * A booking is only inserted after a successful Stripe payment webhook.
 */
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  /** Customer display name */
  customerName: varchar("customerName", { length: 255 }).notNull(),
  /** Customer email address */
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  /** ISO date string YYYY-MM-DD for the booking date */
  bookingDate: varchar("bookingDate", { length: 10 }).notNull(),
  /** Start hour in 24h format (e.g. 9 = 9:00 AM, 14 = 2:00 PM) */
  startHour: int("startHour").notNull(),
  /** Duration in hours: 1 or 2 */
  durationHours: int("durationHours").notNull(),
  /** Amount paid in cents (2000 = $20, 4000 = $40) */
  amountPaid: int("amountPaid").notNull(),
  /** Stripe Checkout Session ID — used for confirmation page lookup */
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  /** Stripe Payment Intent ID for reference */
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  /** Booking status */
  status: mysqlEnum("status", ["confirmed", "cancelled"]).default("confirmed").notNull(),
  /** Optional admin notes */
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;