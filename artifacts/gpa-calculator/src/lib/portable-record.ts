import { v4 as uuidv4 } from "uuid";
import { GRADE_OPTIONS } from "./gpa-utils";
import type { Course, Semester } from "./store";

export const RECORD_FORMAT = "sust-gpa-record";
export const RECORD_VERSION = 1;

export interface RecordBackup {
  format: typeof RECORD_FORMAT;
  version: typeof RECORD_VERSION;
  exportedAt: string;
  semesters: Semester[];
}

export interface ParsedRecordBackup {
  backup: RecordBackup;
  warnings: string[];
}

function normalizeCourse(raw: unknown, courseIndex: number, warnings: string[]): Course {
  const source = isRecord(raw) ? raw : {};
  const rawCredits = source.credits;
  const rawMarks = source.marks;
  const credits = typeof rawCredits === "number" && Number.isFinite(rawCredits)
    ? Math.min(10, Math.max(0, rawCredits))
    : "";
  const marks = typeof rawMarks === "number" && Number.isFinite(rawMarks)
    ? Math.min(100, Math.max(0, rawMarks))
    : "";
  const rawGrade = typeof source.gradeLetter === "string" ? source.gradeLetter.trim().toUpperCase() : "";
  const gradeLetter = GRADE_OPTIONS.includes(rawGrade) ? rawGrade : "";
  const hasBothResults = marks !== "" && gradeLetter !== "";
  if (hasBothResults) warnings.push(`Course ${courseIndex + 1}: grade letter was kept and marks were cleared.`);
  if (typeof rawCredits === "number" && rawCredits !== credits) warnings.push(`Course ${courseIndex + 1}: credits were clamped to the valid range.`);
  if (typeof rawMarks === "number" && rawMarks !== marks) warnings.push(`Course ${courseIndex + 1}: marks were clamped to the valid range.`);

  return {
    id: uuidv4(),
    name: typeof source.name === "string" ? source.name.trim().slice(0, 200) : "",
    credits,
    marks: gradeLetter ? "" : marks,
    gradeLetter,
  };
}

function normalizeSemester(raw: unknown, semesterIndex: number, warnings: string[]): Semester {
  const source = isRecord(raw) ? raw : {};
  const rawCourses = Array.isArray(source.courses) ? source.courses : [];
  if (rawCourses.length > 100) warnings.push(`Semester ${semesterIndex + 1}: only the first 100 courses were imported.`);

  return {
    id: uuidv4(),
    name: typeof source.name === "string" && source.name.trim()
      ? source.name.trim().slice(0, 120)
      : `Semester ${semesterIndex + 1}`,
    courses: rawCourses.slice(0, 100).map((course, courseIndex) => normalizeCourse(course, courseIndex, warnings)),
  };
}

export function createRecordBackup(semesters: Semester[]): RecordBackup {
  return {
    format: RECORD_FORMAT,
    version: RECORD_VERSION,
    exportedAt: new Date().toISOString(),
    semesters: semesters.map((semester) => ({
      id: semester.id,
      name: semester.name,
      courses: semester.courses.map((course) => ({ ...course })),
    })),
  };
}

export function serializeRecordBackup(semesters: Semester[]): string {
  return JSON.stringify(createRecordBackup(semesters), null, 2);
}

export function parseRecordBackup(rawText: string): ParsedRecordBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("This file is not valid JSON.");
  }

  if (!isRecord(parsed) || parsed.format !== RECORD_FORMAT || parsed.version !== RECORD_VERSION || !Array.isArray(parsed.semesters)) {
    throw new Error("This is not a compatible SUST GPA backup file.");
  }
  if (parsed.semesters.length > 100) throw new Error("A backup can contain at most 100 semesters.");

  const warnings: string[] = [];
  const semesters = parsed.semesters.map((semester, index) => normalizeSemester(semester, index, warnings));
  return {
    backup: {
      format: RECORD_FORMAT,
      version: RECORD_VERSION,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : new Date().toISOString(),
      semesters,
    },
    warnings,
  };
}

function escapeCsvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function createCsvExport(semesters: Semester[]): string {
  const rows: Array<Array<string | number>> = [["Semester", "Course", "Credits", "Marks", "Grade", "Grade Point"]];
  semesters.forEach((semester) => {
    semester.courses.forEach((course) => {
      const grade = course.gradeLetter || "";
      const marks = course.marks === "" ? "" : course.marks;
      const gradePoint = grade || marks !== "" ? getGradePoint(course) : "";
      rows.push([semester.name, course.name, course.credits, marks, grade, gradePoint]);
    });
  });
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function getGradePoint(course: Course): string {
  if (course.gradeLetter) {
    const index = GRADE_OPTIONS.indexOf(course.gradeLetter);
    const points = [4, 3.75, 3.5, 3.25, 3, 2.75, 2.5, 2.25, 2, 0][index];
    return points === undefined ? "" : points.toFixed(2);
  }
  if (typeof course.marks !== "number") return "";
  if (course.marks >= 80) return "4.00";
  if (course.marks >= 75) return "3.75";
  if (course.marks >= 70) return "3.50";
  if (course.marks >= 65) return "3.25";
  if (course.marks >= 60) return "3.00";
  if (course.marks >= 55) return "2.75";
  if (course.marks >= 50) return "2.50";
  if (course.marks >= 45) return "2.25";
  if (course.marks >= 40) return "2.00";
  return "0.00";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
