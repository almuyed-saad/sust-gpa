import assert from "node:assert/strict";
import {
  calculateOverallStats,
  calculateSemesterStats,
  getGradeInfoFromLetter,
  getGradeInfoFromMarks,
} from "../../artifacts/gpa-calculator/src/lib/gpa-utils.ts";
import type { Course, Semester } from "../../artifacts/gpa-calculator/src/lib/store.ts";
import { createCsvExport, parseRecordBackup, serializeRecordBackup } from "../../artifacts/gpa-calculator/src/lib/portable-record.ts";

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
  { id: "semester-1", name: "Semester 1", courses: [course({ id: "s1", credits: 3, gradeLetter: "A+" })] },
  { id: "semester-2", name: "Semester 2", courses: [course({ id: "s2", credits: 3, gradeLetter: "B" })] },
];
const overall = calculateOverallStats(semesters);
closeTo(overall.cgpa, 3.5, "overall CGPA should combine all completed courses");
assert.equal(overall.totalCredits, 6);
assert.equal(overall.totalCourses, 2);

const backupText = serializeRecordBackup(semesters);
const parsedBackup = parseRecordBackup(backupText);
assert.equal(parsedBackup.backup.format, "sust-gpa-record");
assert.equal(parsedBackup.backup.version, 1);
assert.equal(parsedBackup.backup.semesters.length, 2);
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
assert.equal(normalized.warnings.length, 1);
assert.throws(() => parseRecordBackup("not-json"), /valid JSON/);
assert.throws(() => parseRecordBackup(JSON.stringify({ format: "other", version: 1, semesters: [] })), /compatible/);

const csv = createCsvExport(semesters);
assert.match(csv, /Semester,Course,Credits,Marks,Grade,Grade Point/);
assert.match(csv, /Semester 1,Test Course,3,,A\+,4\.00/);

console.log("SUST GPA regression checks passed.");
