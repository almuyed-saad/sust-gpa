import { neon } from "@neondatabase/serverless";

export async function runMigrations() {
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" varchar PRIMARY KEY,
      "sess" jsonb NOT NULL,
      "expire" timestamp NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire")
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" varchar UNIQUE,
      "first_name" varchar,
      "last_name" varchar,
      "profile_image_url" varchar,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "semesters" (
      "id" text PRIMARY KEY,
      "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "position" integer NOT NULL DEFAULT 0,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "courses" (
      "id" text PRIMARY KEY,
      "semester_id" text NOT NULL REFERENCES "semesters"("id") ON DELETE CASCADE,
      "name" text NOT NULL DEFAULT '',
      "credits" real NOT NULL DEFAULT 3,
      "marks" real,
      "grade_letter" text,
      "position" integer NOT NULL DEFAULT 0,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now()
    )
  `;

  console.log("Database migrations complete.");
}
