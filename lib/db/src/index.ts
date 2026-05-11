import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 5,
});

export const db = drizzle(pool, { schema });

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 4,
  delayMs = 1500,
): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? (err.message + (err.cause instanceof Error ? err.cause.message : "")) : String(err);
      const isNeonSleep =
        msg.includes("endpoint has been disabled") ||
        msg.includes("Control plane request failed") ||
        msg.includes("connection terminated") ||
        msg.includes("ECONNRESET") ||
        msg.includes("ETIMEDOUT");

      if (isNeonSleep && attempt < retries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error("withRetry: exhausted retries");
}

export * from "./schema";
