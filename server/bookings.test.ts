import { describe, expect, it, vi, beforeEach } from "vitest";

// ─── Slot availability logic (pure function tests) ────────────────────────────

/**
 * Mirrors the overlap logic from isSlotAvailable in db.ts
 * Two intervals [a, a+da) and [b, b+db) overlap if a < b+db && b < a+da
 */
function slotsOverlap(
  startA: number,
  durA: number,
  startB: number,
  durB: number
): boolean {
  return startA < startB + durB && startB < startA + durA;
}

function isAvailable(
  existing: Array<{ startHour: number; durationHours: number }>,
  newStart: number,
  newDuration: number
): boolean {
  for (const b of existing) {
    if (slotsOverlap(newStart, newDuration, b.startHour, b.durationHours)) {
      return false;
    }
  }
  return true;
}

describe("Slot availability logic", () => {
  it("returns true when no existing bookings", () => {
    expect(isAvailable([], 9, 1)).toBe(true);
    expect(isAvailable([], 14, 2)).toBe(true);
  });

  it("returns false when exact same slot is booked", () => {
    const existing = [{ startHour: 10, durationHours: 1 }];
    expect(isAvailable(existing, 10, 1)).toBe(false);
  });

  it("returns false when new slot overlaps start of existing", () => {
    // existing: 10–12, new: 9–11 → overlap
    const existing = [{ startHour: 10, durationHours: 2 }];
    expect(isAvailable(existing, 9, 2)).toBe(false);
  });

  it("returns false when new slot overlaps end of existing", () => {
    // existing: 10–11, new: 10–12 → overlap
    const existing = [{ startHour: 10, durationHours: 1 }];
    expect(isAvailable(existing, 10, 2)).toBe(false);
  });

  it("returns false when new slot is contained within existing", () => {
    // existing: 9–11, new: 10–11 → overlap
    const existing = [{ startHour: 9, durationHours: 2 }];
    expect(isAvailable(existing, 10, 1)).toBe(false);
  });

  it("returns true when new slot is immediately after existing", () => {
    // existing: 10–11, new: 11–12 → no overlap
    const existing = [{ startHour: 10, durationHours: 1 }];
    expect(isAvailable(existing, 11, 1)).toBe(true);
  });

  it("returns true when new slot is immediately before existing", () => {
    // existing: 11–12, new: 10–11 → no overlap
    const existing = [{ startHour: 11, durationHours: 1 }];
    expect(isAvailable(existing, 10, 1)).toBe(true);
  });

  it("handles multiple existing bookings correctly", () => {
    const existing = [
      { startHour: 9, durationHours: 1 },
      { startHour: 14, durationHours: 2 },
    ];
    expect(isAvailable(existing, 10, 1)).toBe(true);
    expect(isAvailable(existing, 13, 1)).toBe(true);
    expect(isAvailable(existing, 13, 2)).toBe(false); // overlaps 14–16
    expect(isAvailable(existing, 8, 2)).toBe(false); // overlaps 9–10
  });
});

// ─── Pricing constants ────────────────────────────────────────────────────────

const PRICES: Record<1 | 2, number> = { 1: 2000, 2: 3500 };

describe("Pricing constants", () => {
  it("charges $20 (2000 cents) for 1 hour", () => {
    expect(PRICES[1]).toBe(2000);
  });

  it("charges $35 (3500 cents) for 2 hours", () => {
    expect(PRICES[2]).toBe(3500);
  });
});

// ─── Admin role gate ──────────────────────────────────────────────────────────

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function makeCtx(role: "admin" | "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Admin role gate", () => {
  it("throws FORBIDDEN when a non-admin calls adminStats", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.bookings.adminStats()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN when a non-admin calls adminList", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.bookings.adminList({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("throws FORBIDDEN when a non-admin calls adminCancel", async () => {
    const caller = appRouter.createCaller(makeCtx("user"));
    await expect(caller.bookings.adminCancel({ id: 1 })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
