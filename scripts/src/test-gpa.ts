import assert from "node:assert/strict";
import {
  calculateOverallStats,
  calculateSemesterStats,
  getGradeInfoFromLetter,
  getGradeInfoFromMarks,
} from "../../artifacts/gpa-calculator/src/lib/gpa-utils.ts";
import type { Course, Semester } from "../../artifacts/gpa-calculator/src/lib/store.ts";
import { createCsvExport, parseRecordBackup, serializeRecordBackup } from "../../artifacts/gpa-calculator/src/lib/portable-record.ts";
import { hasMeaningfulRecord, mergeSemesters } from "../../artifacts/gpa-calculator/src/lib/sync-resolution.ts";

function closeTo(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${message}: expected ${expected}, received ${actual}`);
}

function course(overrides: Partial<Course> = {}): Course {
  return {
    id: "course-test",
    name: "Test Course",
    credits: 3,
    marks: "",
    gradeLetter: "",
    ...overrides,
  };
}

const boundaryCases: Array<[number, string, number]> = [
  [80, "A+", 4.0],
  [75, "A", 3.75],
  [70, "A-", 3.5],
  [65, "B+", 3.25],
  [60, "B", 3.0],
  [55, "B-", 2.75],
  [50, "C+", 2.5],
  [45, "C", 2.25],
  [40, "D", 2.0],
  [39, "F", 0.0],
];

for (const [marks, grade, points] of boundaryCases) {
  const result = getGradeInfoFromMarks(marks);
  assert.equal(result.grade, grade, `marks ${marks} should map to ${grade}`);
  assert.equal(result.points, points, `marks ${marks} should map to ${points} points`);
}

assert.equal(getGradeInfoFromMarks(-1).points, null);
assert.equal(getGradeInfoFromMarks(101).points, null);
assert.equal(getGradeInfoFromMarks("").points, null);
assert.equal(getGradeInfoFromLetter("not-a-grade").points, null);

const letterOverride = calculateSemesterStats([
  course({ credits: 3, marks: 40, gradeLetter: "A+" }),
]);
closeTo(letterOverride.gpa, 4.0, "grade letter should override marks");
assert.equal(letterOverride.totalCredits, 3);

const weightedSemester = calculateSemesterStats([
  course({ id: "a", credits: 3, gradeLetter: "A+" }),
  course({ id: "b", credits: 4, gradeLetter: "B" }),
]);
closeTo(weightedSemester.gpa, (3 * 4 + 4 * 3) / 7, "semester GPA should be credit weighted");
assert.equal(weightedSemester.totalCredits, 7);

const semesters: Semester[] = [
  { id: "semester-1", name: "Semester 1", academicYear: "2025-26", termNumber: 1, status: "completed", notes: "Strong start", courses: [course({ id: "s1", credits: 3, gradeLetter: "A+" })] },
  { id: "semester-2", name: "Semester 2", academicYear: "2025-26", termNumber: 2, status: "in-progress", notes: "Current term", courses: [course({ id: "s2", credits: 3, gradeLetter: "B" })] },
];
const overall = calculateOverallStats(semesters);
closeTo(overall.cgpa, 3.5, "overall CGPA should combine all completed courses");
assert.equal(overall.totalCredits, 6);
assert.equal(overall.totalCourses, 2);

const backupText = serializeRecordBackup(semesters);
const parsedBackup = parseRecordBackup(backupText);
assert.equal(parsedBackup.backup.format, "sust-gpa-record");
assert.equal(parsedBackup.backup.version, 2);
assert.equal(parsedBackup.backup.semesters.length, 2);
assert.equal(parsedBackup.backup.semesters[0]?.academicYear, "2025-26");
assert.equal(parsedBackup.backup.semesters[0]?.termNumber, 1);
assert.equal(parsedBackup.backup.semesters[0]?.status, "completed");
assert.equal(parsedBackup.backup.semesters[0]?.notes, "Strong start");
assert.equal(parsedBackup.backup.semesters[0]?.courses[0]?.gradeLetter, "A+");
assert.notEqual(parsedBackup.backup.semesters[0]?.id, "semester-1", "imports should generate fresh local IDs");
assert.equal(parsedBackup.warnings.length, 0);

const normalized = parseRecordBackup(JSON.stringify({
  format: "sust-gpa-record",
  version: 1,
  semesters: [{
    name: "  Semester with override  ",
    courses: [{ name: "  Course  ", credits: 3, marks: 42, gradeLetter: "a+" }],
  }],
}));
assert.equal(normalized.backup.semesters[0]?.name, "Semester with override");
assert.equal(normalized.backup.semesters[0]?.courses[0]?.name, "Course");
assert.equal(normalized.backup.semesters[0]?.courses[0]?.gradeLetter, "A+");
assert.equal(normalized.backup.semesters[0]?.courses[0]?.marks, "", "grade letter should take precedence over marks");
assert.equal(normalized.backup.semesters[0]?.academicYear, "");
assert.equal(normalized.backup.semesters[0]?.termNumber, 1);
assert.equal(normalized.backup.semesters[0]?.status, "in-progress");
assert.equal(normalized.backup.semesters[0]?.notes, "");
assert.equal(normalized.warnings.length, 1);
assert.throws(() => parseRecordBackup("not-json"), /valid JSON/);
assert.throws(() => parseRecordBackup(JSON.stringify({ format: "other", version: 1, semesters: [] })), /compatible/);

const csv = createCsvExport(semesters);
assert.match(csv, /Semester,Academic Year,Term,Status,Notes,Course,Credits,Marks,Grade,Grade Point/);
assert.match(csv, /Semester 1,2025-26,1,completed,Strong start,Test Course,3,,A\+,4\.00/);

const emptyLegacyRecord: Semester[] = [{
  id: "empty",
  name: "Year 1, Semester 1",
  academicYear: "2025-26",
  termNumber: 1,
  status: "in-progress",
  notes: "",
  courses: [course({ name: "", credits: 3, marks: "", gradeLetter: "" })],
}];
assert.equal(hasMeaningfulRecord(emptyLegacyRecord), false, "a blank starter record should not trigger a sync conflict");
assert.equal(hasMeaningfulRecord([semesters[0]!]), true, "a populated record should trigger a sync conflict");

const localSyncRecord: Semester = {
  id: "local-semester",
  name: "Semester 1",
  academicYear: "2025-26",
  termNumber: 1,
  status: "in-progress",
  notes: "Local note",
  courses: [course({ id: "local-course", name: "Algebra", gradeLetter: "A" })],
};
const remoteSyncRecord: Semester = {
  id: "remote-semester",
  name: "Semester 1",
  academicYear: "2025-26",
  termNumber: 1,
  status: "completed",
  notes: "Cloud note",
  courses: [
    course({ id: "remote-course-duplicate", name: "Algebra", gradeLetter: "A" }),
    course({ id: "remote-course-new", name: "Analysis", gradeLetter: "B" }),
  ],
};
const merged = mergeSemesters([localSyncRecord], [remoteSyncRecord]);
assert.equal(merged.length, 1);
assert.equal(merged[0]?.courses.length, 2, "matching courses should not be duplicated during merge");
assert.equal(merged[0]?.status, "completed", "completed status should win during merge");
assert.equal(merged[0]?.notes, "Local note", "local notes should be preserved when present");

console.log("SUST GPA regression checks passed.");
