import type { ApiSemester } from "./api";
import type { Course, Semester } from "./store";

export const SYNC_RESOLUTION_VERSION = "v1";

export type SyncChoice = "local" | "cloud" | "merge" | "keep-local";

export function mapApiSemester(semester: ApiSemester): Semester {
  return {
    id: semester.id,
    name: semester.name,
    academicYear: semester.academicYear ?? "",
    termNumber: semester.termNumber ?? 1,
    status: semester.status === "completed" ? "completed" : "in-progress",
    notes: semester.notes ?? "",
    courses: semester.courses.map((course) => ({
      id: course.id,
      name: course.name,
      credits: course.credits,
      marks: course.marks ?? "",
      gradeLetter: course.gradeLetter ?? "",
    })),
  };
}

export function mapApiSemesters(semesters: ApiSemester[]): Semester[] {
  return semesters.map(mapApiSemester);
}

export function hasMeaningfulSemester(semester: Semester): boolean {
  const hasCourseData = semester.courses.some((course) => (
    course.name.trim().length > 0
    || course.marks !== ""
    || course.gradeLetter.trim().length > 0
  ));
  const hasCustomMetadata = semester.notes.trim().length > 0
    || semester.status === "completed"
    || !/^Year \d+, Semester \d+$/.test(semester.name.trim());
  return hasCourseData || hasCustomMetadata;
}

export function hasMeaningfulRecord(semesters: Semester[]): boolean {
  return semesters.some(hasMeaningfulSemester);
}

function semesterKey(semester: Semester): string {
  return [semester.academicYear.trim().toLowerCase(), semester.termNumber, semester.name.trim().toLowerCase()].join("|");
}

function courseKey(course: Course): string {
  return [course.name.trim().toLowerCase(), course.credits, course.marks, course.gradeLetter.trim().toUpperCase()].join("|");
}

function mergeSemester(local: Semester, remote: Semester): Semester {
  const courses = [...local.courses];
  const existing = new Set(courses.map(courseKey));
  for (const course of remote.courses) {
    if (!existing.has(courseKey(course))) {
      courses.push({ ...course });
      existing.add(courseKey(course));
    }
  }

  return {
    ...local,
    notes: local.notes.trim() || remote.notes,
    status: local.status === "completed" || remote.status === "completed" ? "completed" : "in-progress",
    courses,
  };
}

export function mergeSemesters(local: Semester[], remote: Semester[]): Semester[] {
  const merged = local.map((semester) => ({
    ...semester,
    courses: semester.courses.map((course) => ({ ...course })),
  }));
  const byKey = new Map(merged.map((semester, index) => [semesterKey(semester), index]));

  for (const remoteSemester of remote) {
    const key = semesterKey(remoteSemester);
    const existingIndex = byKey.get(key);
    if (existingIndex === undefined) {
      byKey.set(key, merged.length);
      merged.push({
        ...remoteSemester,
        courses: remoteSemester.courses.map((course) => ({ ...course })),
      });
    } else {
      merged[existingIndex] = mergeSemester(merged[existingIndex], remoteSemester);
    }
  }

  return merged;
}

export function getSyncResolutionKey(userKey: string): string {
  return `sust-gpa-sync-resolution-${SYNC_RESOLUTION_VERSION}:${userKey}`;
}

export function hasResolvedSyncForUser(userKey: string): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(getSyncResolutionKey(userKey)) === "resolved";
}

export function markSyncResolvedForUser(userKey: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(getSyncResolutionKey(userKey), "resolved");
}
