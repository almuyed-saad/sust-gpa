import { Router, type IRouter, type Request, type Response } from "express";
import { db, semestersTable, coursesTable } from "@workspace/db";
import { eq, and, asc } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  CreateSemesterBody,
  UpdateSemesterBody,
  CreateCourseBody,
  UpdateCourseBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: Request, res: Response): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function getSemesterWithCourses(semesterId: string, userId: string) {
  const [semester] = await db
    .select()
    .from(semestersTable)
    .where(and(eq(semestersTable.id, semesterId), eq(semestersTable.userId, userId)));

  if (!semester) return null;

  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.semesterId, semesterId))
    .orderBy(asc(coursesTable.position));

  return { ...semester, courses };
}

router.get("/semesters", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const userId = req.user!.id;
  const semesters = await db
    .select()
    .from(semestersTable)
    .where(eq(semestersTable.userId, userId))
    .orderBy(asc(semestersTable.position));

  const semestersWithCourses = await Promise.all(
    semesters.map(async (s) => {
      const courses = await db
        .select()
        .from(coursesTable)
        .where(eq(coursesTable.semesterId, s.id))
        .orderBy(asc(coursesTable.position));
      return { ...s, courses };
    })
  );

  res.json({ semesters: semestersWithCourses });
});

router.post("/semesters", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateSemesterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const userId = req.user!.id;
  const existing = await db
    .select({ id: semestersTable.id })
    .from(semestersTable)
    .where(eq(semestersTable.userId, userId));

  const [semester] = await db
    .insert(semestersTable)
    .values({
      id: randomUUID(),
      userId,
      name: parsed.data.name,
      position: existing.length,
    })
    .returning();

  const [course1] = await db
    .insert(coursesTable)
    .values({ id: randomUUID(), semesterId: semester.id, name: "", credits: 3, position: 0 })
    .returning();

  res.status(201).json({ semester: { ...semester, courses: [course1] } });
});

router.put("/semesters/:semesterId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const parsed = UpdateSemesterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const userId = req.user!.id;
  const { semesterId } = req.params;

  const [updated] = await db
    .update(semestersTable)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(and(eq(semestersTable.id, semesterId), eq(semestersTable.userId, userId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Semester not found" });
    return;
  }

  const full = await getSemesterWithCourses(semesterId, userId);
  res.json({ semester: full });
});

router.delete("/semesters/:semesterId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const userId = req.user!.id;
  const { semesterId } = req.params;

  await db
    .delete(semestersTable)
    .where(and(eq(semestersTable.id, semesterId), eq(semestersTable.userId, userId)));

  res.json({ success: true });
});

router.post("/semesters/:semesterId/courses", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const userId = req.user!.id;
  const { semesterId } = req.params;

  const [semester] = await db
    .select({ id: semestersTable.id })
    .from(semestersTable)
    .where(and(eq(semestersTable.id, semesterId), eq(semestersTable.userId, userId)));

  if (!semester) {
    res.status(404).json({ error: "Semester not found" });
    return;
  }

  const existing = await db
    .select({ id: coursesTable.id })
    .from(coursesTable)
    .where(eq(coursesTable.semesterId, semesterId));

  const [course] = await db
    .insert(coursesTable)
    .values({
      id: randomUUID(),
      semesterId,
      name: parsed.data.name,
      credits: parsed.data.credits,
      marks: parsed.data.marks ?? null,
      position: existing.length,
    })
    .returning();

  res.status(201).json({ course });
});

router.put("/semesters/:semesterId/courses/:courseId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const parsed = UpdateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const userId = req.user!.id;
  const { semesterId, courseId } = req.params;

  const [semester] = await db
    .select({ id: semestersTable.id })
    .from(semestersTable)
    .where(and(eq(semestersTable.id, semesterId), eq(semestersTable.userId, userId)));

  if (!semester) {
    res.status(404).json({ error: "Semester not found" });
    return;
  }

  const [course] = await db
    .update(coursesTable)
    .set({
      name: parsed.data.name,
      credits: parsed.data.credits,
      marks: parsed.data.marks ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.semesterId, semesterId)))
    .returning();

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json({ course });
});

router.delete("/semesters/:semesterId/courses/:courseId", async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;

  const userId = req.user!.id;
  const { semesterId, courseId } = req.params;

  const [semester] = await db
    .select({ id: semestersTable.id })
    .from(semestersTable)
    .where(and(eq(semestersTable.id, semesterId), eq(semestersTable.userId, userId)));

  if (!semester) {
    res.status(404).json({ error: "Semester not found" });
    return;
  }

  await db
    .delete(coursesTable)
    .where(and(eq(coursesTable.id, courseId), eq(coursesTable.semesterId, semesterId)));

  res.json({ success: true });
});

export default router;
