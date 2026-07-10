import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { bookings, InsertBooking, InsertUser, users, subscriptions, InsertSubscription, Subscription } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Booking helpers ──────────────────────────────────────────────────────────

/**
 * Returns all confirmed bookings for a given date so the frontend can
 * compute which slots are already taken.
 */
export async function getBookingsForDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookings)
    .where(and(eq(bookings.bookingDate, date), eq(bookings.status, "confirmed")));
}

/**
 * Returns a single booking by its Stripe session ID.
 * Used on the confirmation page after a successful checkout.
 */
export async function getBookingBySessionId(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(bookings)
    .where(eq(bookings.stripeSessionId, sessionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Inserts a new booking record. Called exclusively from the Stripe webhook
 * handler after payment confirmation.
 */
export async function createBooking(data: InsertBooking): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bookings).values(data);
  return { id: (result as any)[0]?.insertId ?? 0 };
}

/**
 * Returns all bookings (all statuses) for admin dashboard.
 */
export async function getAllBookings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bookings).orderBy(bookings.bookingDate, bookings.startHour);
}

/**
 * Returns bookings within a date range for admin calendar view.
 */
export async function getBookingsInRange(startDate: string, endDate: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(bookings)
    .where(
      and(
        gte(bookings.bookingDate, startDate),
        lte(bookings.bookingDate, endDate),
        eq(bookings.status, "confirmed")
      )
    )
    .orderBy(bookings.bookingDate, bookings.startHour);
}

/**
 * Cancels a booking by ID.
 */
export async function cancelBooking(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(bookings).set({ status: "cancelled" }).where(eq(bookings.id, id));
}

/**
 * Manually creates a booking (admin use — no Stripe session required).
 * Uses a synthetic session ID prefixed with "manual_".
 */
export async function adminCreateBooking(data: Omit<InsertBooking, "stripeSessionId">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const syntheticId = `manual_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.insert(bookings).values({ ...data, stripeSessionId: syntheticId });
}

/**
 * Checks whether a given time slot conflicts with existing confirmed bookings.
 */
export async function isSlotAvailable(
  date: string,
  startHour: number,
  durationHours: number
): Promise<boolean> {
  const existing = await getBookingsForDate(date);
  for (const b of existing) {
    const bEnd = b.startHour + b.durationHours;
    const newEnd = startHour + durationHours;
    if (startHour < bEnd && b.startHour < newEnd) return false;
  }
  return true;
}

/**
 * Returns aggregate stats for the admin dashboard.
 */
export async function getBookingStats() {
  const db = await getDb();
  if (!db) return { total: 0, revenue: 0, todayCount: 0, upcomingCount: 0 };

  const now = new Date();
  const today = now.getFullYear() + '-' + 
                String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                String(now.getDate()).padStart(2, '0');
  
  const all = await db.select().from(bookings).where(eq(bookings.status, "confirmed"));
  const todayBookings = all.filter((b) => b.bookingDate === today);
  const upcoming = all.filter((b) => b.bookingDate > today);
  const revenue = all.reduce((sum, b) => sum + (b.amountPaid || 0), 0);

  return {
    total: all.length,
    revenue,
    todayCount: todayBookings.length,
    upcomingCount: upcoming.length,
  };
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

/**
 * Returns the active subscription for a user, if any.
 */
export async function getActiveSubscription(userId: number): Promise<Subscription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Creates or updates a subscription record after a successful Stripe subscription event.
 */
export async function upsertSubscription(data: InsertSubscription): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(subscriptions).values(data).onDuplicateKeyUpdate({
    set: {
      tier: data.tier,
      status: data.status,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelledAt: data.cancelledAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * Cancels a subscription by marking it as cancelled.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: Date.now() })
    .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
}

/**
 * Returns a user by their email address. Used for email/password login.
 */
export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Creates a new local user with a hashed password.
 */
export async function createLocalUser(data: {
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
}): Promise<{ id: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Use email as openId for local accounts (prefixed to avoid collision with OAuth openIds)
  const openId = `local_${data.email}`;
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    phone: data.phone ?? null,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
  return { id: (result as any)[0]?.insertId ?? 0 };
}

/**
 * Updates the lastSignedIn timestamp for a user.
 */
export async function touchUserSignIn(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, userId));
}
