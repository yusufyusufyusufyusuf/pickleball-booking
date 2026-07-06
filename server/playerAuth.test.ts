import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): { ctx: TrpcContext; cookies: Record<string, string> } {
  const cookies: Record<string, string> = {};

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: { origin: "https://book.yusufremtulla.com" },
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string) => {
        cookies[name] = value;
      },
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };

  return { ctx, cookies };
}

describe("playerAuth", () => {
  describe("register", () => {
    it("rejects mismatched passwords", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.register({
          name: "Test User",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "different456",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toMatch(/Passwords do not match/);
      }
    });

    it("rejects password shorter than 8 characters", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.register({
          name: "Test User",
          email: "test@example.com",
          password: "short",
          confirmPassword: "short",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toMatch(/at least 8 characters/);
      }
    });

    it("rejects invalid email format", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.register({
          name: "Test User",
          email: "not-an-email",
          password: "password123",
          confirmPassword: "password123",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toMatch(/valid email/);
      }
    });

    it("rejects name shorter than 2 characters", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.register({
          name: "A",
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toMatch(/at least 2 characters/);
      }
    });
  });

  describe("login", () => {
    it("rejects empty password", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.login({
          email: "test@example.com",
          password: "",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toMatch(/Password is required/);
      }
    });

    it("rejects invalid email format", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.login({
          email: "not-an-email",
          password: "password123",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toMatch(/valid email/);
      }
    });

    it("returns UNAUTHORIZED for unknown email", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.playerAuth.login({
          email: "nonexistent@example.com",
          password: "password123",
        });
        expect.fail("Should have thrown");
      } catch (err: any) {
        expect(err.message).toContain("Invalid email or password");
      }
    });
  });
});
