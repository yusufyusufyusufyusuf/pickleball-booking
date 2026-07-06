import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { COOKIE_NAME } from "../../shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const playerAuthRouter = router({
  /**
   * Register a new player account with name, email, phone, and password.
   * Creates the user in the DB and issues a session cookie immediately.
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        phone: z.string().optional(),
        password: z
          .string()
          .min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      }).refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if email is already taken
      const existing = await db.getUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(input.password, 12);

      // Create the user
      await db.createLocalUser({
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
      });

      // Fetch the newly created user
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account." });
      }

      // Issue session cookie using the local openId
      const token = await sdk.createSessionToken(user.openId, {
        name: user.name ?? input.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, name: user.name };
    }),

  /**
   * Log in with email and password. Issues a session cookie on success.
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = await db.getUserByEmail(input.email);

      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password.",
        });
      }

      // Update last signed in
      await db.touchUserSignIn(user.id);

      // Issue session cookie
      const token = await sdk.createSessionToken(user.openId, {
        name: user.name ?? "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, name: user.name };
    }),
});
