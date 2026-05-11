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
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
  max: 5,
});

export const db = drizzle(pool, { schema });

function isRetryableError(err: unknown): boolean {
  const message = [
    err instanceof Error ? err.message : "",
    err instanceof Error && err.cause instanceof Error ? err.cause.message : "",
    err instanceof Error && typeof (err as { cause?: unknown }).cause === "string"
      ? String((err as { cause?: unknown }).cause)
      : "",
    String(err),
  ]
    .join(" ")
    .toLowerCase();

  return (
    message.includes("endpoint has been disabled") ||
    message.includes("control plane request failed") ||
    message.includes("connection terminated") ||
    message.includes("connection refused") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("failed to fetch") ||
    message.includes("starting") ||
    message.includes("waking")
  );
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 5,
  baseDelayMs = 2000,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastErr = err;
      if (attempt < retries && isRetryableError(err)) {
        const delay = baseDelayMs * attempt;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export * from "./schema";
