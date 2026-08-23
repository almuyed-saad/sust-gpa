import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const testState = vi.hoisted(() => ({
  sessions: new Map<string, { user: { id: string; email: string } }>(),
  semesters: [] as Array<Record<string, unknown>>,
  courses: [] as Array<Record<string, unknown>>,
  sequence: 0,
}));

const tables = vi.hoisted(() => ({
  semestersTable: {
    id: "semesters.id",
    userId: "semesters.userId",
    name: "semesters.name",
    academicYear: "semesters.academicYear",
    termNumber: "semesters.termNumber",
    status: "semesters.status",
    notes: "semesters.notes",
    position: "semesters.position",
  },
  coursesTable: {
    id: "courses.id",
    semesterId: "courses.semesterId",
    name: "courses.name",
    credits: "courses.credits",
    marks: "courses.marks",
    gradeLetter: "courses.gradeLetter",
    position: "courses.position",
  },
}));

type Predicate =
  | { kind: "eq"; column: string; value: unknown }
  | { kind: "and"; conditions: Predicate[] }
  | undefined;

function flattenPredicates(predicate: Predicate): Array<{ column: string; value: unknown }> {
  if (!predicate) return [];
  if (predicate.kind === "eq") return [{ column: predicate.column, value: predicate.value }];
  return predicate.conditions.flatMap(flattenPredicates);
}

function matches(row: Record<string, unknown>, predicate: Predicate) {
  return flattenPredicates(predicate).every(({ column, value }) => {
    const field = column.split(".").at(-1);
    return field ? row[field] === value : false;
  });
}

function selectRows(table: unknown, fields: Record<string, unknown> | undefined, predicate: Predicate) {
  const source = table === tables.semestersTable ? testState.semesters : testState.courses;
  const rows = source.filter((row) => matches(row, predicate));
  if (!fields) return rows.map((row) => ({ ...row }));
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(fields).map(([key, column]) => {
        const field = String(column).split(".").at(-1) ?? "";
        return [key, row[field]];
      }),
    ),
  );
}

function createFakeDb() {
  return {
    select(fields?: Record<string, unknown>) {
      return {
        from(table: unknown) {
          let predicate: Predicate;
          const builder = {
            where(nextPredicate: Predicate) {
              predicate = nextPredicate;
              return builder;
            },
            orderBy() {
              return Promise.resolve(selectRows(table, fields, predicate));
            },
            then(resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) {
              return Promise.resolve(selectRows(table, fields, predicate)).then(resolve, reject);
            },
          };
          return builder;
        },
      };
    },
    insert(table: unknown) {
      return {
        values(values: Record<string, unknown>) {
          return {
            returning() {
              const row = {
                ...values,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              const target = table === tables.semestersTable ? testState.semesters : testState.courses;
              target.push(row);
              return Promise.resolve([{ ...row }]);
            },
          };
        },
      };
    },
    update(table: unknown) {
      let updates: Record<string, unknown> = {};
      let predicate: Predicate;
      const builder = {
        set(nextUpdates: Record<string, unknown>) {
          updates = nextUpdates;
          return builder;
        },
        where(nextPredicate: Predicate) {
          predicate = nextPredicate;
          return builder;
        },
        returning() {
          const target = table === tables.semestersTable ? testState.semesters : testState.courses;
          const row = target.find((candidate) => matches(candidate, predicate));
          if (!row) return Promise.resolve([]);
          Object.assign(row, updates);
          return Promise.resolve([{ ...row }]);
        },
      };
      return builder;
    },
    delete(table: unknown) {
      let predicate: Predicate;
      const builder = {
        where(nextPredicate: Predicate) {
          predicate = nextPredicate;
          const target = table === tables.semestersTable ? testState.semesters : testState.courses;
          const remaining = target.filter((candidate) => !matches(candidate, predicate));
          target.splice(0, target.length, ...remaining);
          if (table === tables.semestersTable) {
            const deletedSemesterIds = new Set(
              target.filter((candidate) => matches(candidate, predicate)).map((candidate) => candidate.id),
            );
            testState.courses = testState.courses.filter(
              (course) => !deletedSemesterIds.has(course.semesterId),
            );
          }
          return builder;
        },
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) {
          return Promise.resolve(undefined).then(resolve, reject);
        },
      };
      return builder;
    },
  };
}

const fakeDb = vi.hoisted(() => createFakeDb());

vi.mock("drizzle-orm", () => ({
  and: (...conditions: Predicate[]) => ({ kind: "and", conditions }),
  asc: (column: unknown) => ({ kind: "asc", column }),
  eq: (column: unknown, value: unknown) => ({ kind: "eq", column: String(column), value }),
}));

vi.mock("@workspace/db", () => ({
  db: fakeDb,
  ...tables,
  withRetry: (fn: () => unknown) => fn(),
}));

vi.mock("../lib/auth", () => ({
  getSessionId: (req: { get(name: string): string | undefined }) => {
    const header = req.get("authorization");
    return header?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  },
  getSession: async (sid: string) => testState.sessions.get(sid) ?? null,
  clearSession: async () => undefined,
}));

import app from "../app";

function seedRecords() {
  testState.semesters = [
    {
      id: "semester-a",
      userId: "user-a",
      name: "User A Semester",
      academicYear: "2025–26",
      termNumber: 1,
      status: "completed",
      notes: null,
      position: 0,
    },
    {
      id: "semester-b",
      userId: "user-b",
      name: "User B Semester",
      academicYear: "2025–26",
      termNumber: 1,
      status: "completed",
      notes: null,
      position: 0,
    },
  ];
  testState.courses = [
    {
      id: "course-a",
      semesterId: "semester-a",
      name: "Algorithms",
      credits: 3,
      marks: 86,
      gradeLetter: "A+",
      position: 0,
    },
    {
      id: "course-b",
      semesterId: "semester-b",
      name: "Databases",
      credits: 3,
      marks: 82,
      gradeLetter: "A",
      position: 0,
    },
  ];
  testState.sessions = new Map([
    ["session-a", { user: { id: "user-a", email: "a@example.com" } }],
    ["session-b", { user: { id: "user-b", email: "b@example.com" } }],
  ]);
  testState.sequence = 0;
}

function auth(session = "session-a") {
  return { Authorization: `Bearer ${session}` };
}

describe("GPA API authentication and user isolation", () => {
  beforeEach(seedRecords);

  it("rejects unauthenticated semester reads", async () => {
    const response = await request(app).get("/api/semesters");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Unauthorized" });
  });

  it("returns only the authenticated user’s semesters and courses", async () => {
    const response = await request(app).get("/api/semesters").set(auth());

    expect(response.status).toBe(200);
    expect(response.body.semesters).toHaveLength(1);
    expect(response.body.semesters[0].id).toBe("semester-a");
    expect(response.body.semesters[0].courses[0].id).toBe("course-a");
  });

  it("allows CRUD for the authenticated user’s own records", async () => {
    const created = await request(app)
      .post("/api/semesters")
      .set(auth())
      .send({ name: "New Semester", academicYear: "2026–27", termNumber: 2, status: "in-progress" });

    expect(created.status).toBe(201);
    const semesterId = created.body.semester.id as string;
    const courseId = created.body.semester.courses[0].id as string;

    const updatedSemester = await request(app)
      .put(`/api/semesters/${semesterId}`)
      .set(auth())
      .send({ name: "Updated Semester" });
    expect(updatedSemester.status).toBe(200);
    expect(updatedSemester.body.semester.name).toBe("Updated Semester");

    const updatedCourse = await request(app)
      .put(`/api/semesters/${semesterId}/courses/${courseId}`)
      .set(auth())
      .send({ name: "Linear Algebra", credits: 4, marks: 91, gradeLetter: "A+" });
    expect(updatedCourse.status).toBe(200);
    expect(updatedCourse.body.course.name).toBe("Linear Algebra");
    expect(updatedCourse.body.course.credits).toBe(4);

    const deletedCourse = await request(app)
      .delete(`/api/semesters/${semesterId}/courses/${courseId}`)
      .set(auth());
    expect(deletedCourse.status).toBe(200);

    const deletedSemester = await request(app)
      .delete(`/api/semesters/${semesterId}`)
      .set(auth());
    expect(deletedSemester.status).toBe(200);
  });

  it("does not expose another user’s semester through the collection or allow updates", async () => {
    const read = await request(app).get("/api/semesters").set(auth());
    const update = await request(app)
      .put("/api/semesters/semester-b")
      .set(auth())
      .send({ name: "Attempted takeover" });
    const addCourse = await request(app)
      .post("/api/semesters/semester-b/courses")
      .set(auth())
      .send({ name: "Unauthorized Course", credits: 3, marks: 80, gradeLetter: "A" });
    const remove = await request(app).delete("/api/semesters/semester-b").set(auth());

    expect(read.status).toBe(200);
    expect(read.body.semesters.some((semester: { id: string }) => semester.id === "semester-b")).toBe(false);
    expect(update.status).toBe(404);
    expect(addCourse.status).toBe(404);
    expect(remove.status).toBe(200);
    expect(testState.semesters.some((semester) => semester.id === "semester-b")).toBe(true);
  });

  it("does not allow one user to update or delete another user’s course", async () => {
    const update = await request(app)
      .put("/api/semesters/semester-b/courses/course-b")
      .set(auth())
      .send({ name: "Attempted takeover", credits: 4, marks: 99, gradeLetter: "A+" });
    const remove = await request(app)
      .delete("/api/semesters/semester-b/courses/course-b")
      .set(auth());

    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
    expect(testState.courses.some((course) => course.id === "course-b")).toBe(true);
  });
});
