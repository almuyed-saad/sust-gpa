import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const semestersTable = pgTable("semesters", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const coursesTable = pgTable("courses", {
  id: text("id").primaryKey(),
  semesterId: text("semester_id").notNull().references(() => semestersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  credits: real("credits").notNull().default(3),
  marks: real("marks"),
  gradeLetter: text("grade_letter"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Semester = typeof semestersTable.$inferSelect;
export type Course = typeof coursesTable.$inferSelect;
