import { Course, Semester } from "./store";

export interface GradeInfo {
  grade: string;
  points: number | null;
  colorClass: string;
}

const GRADE_MAP: Record<string, { points: number; colorClass: string }> = {
  'A+': { points: 4.00, colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  'A':  { points: 3.75, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  'A-': { points: 3.50, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  'B+': { points: 3.25, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'B':  { points: 3.00, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'B-': { points: 2.75, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  'C+': { points: 2.50, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  'C':  { points: 2.25, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  'D':  { points: 2.00, colorClass: 'bg-orange-100 text-orange-800 border-orange-200' },
  'F':  { points: 0.00, colorClass: 'bg-red-100 text-red-800 border-red-200' },
};

export const GRADE_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F'];

export function getGradeInfoFromLetter(letter: string): GradeInfo {
  const entry = GRADE_MAP[letter];
  if (!entry) return { grade: '-', points: null, colorClass: 'bg-slate-100 text-slate-500 border-slate-200' };
  return { grade: letter, points: entry.points, colorClass: entry.colorClass };
}

export function getGradeInfoFromMarks(marks: number | ''): GradeInfo {
  if (marks === '' || isNaN(marks as number) || (marks as number) < 0 || (marks as number) > 100) {
    return { grade: '-', points: null, colorClass: 'bg-slate-100 text-slate-500 border-slate-200' };
  }
  const m = Math.round(Number(marks));
  if (m >= 80) return { grade: 'A+', points: 4.00, colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (m >= 75) return { grade: 'A',  points: 3.75, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (m >= 70) return { grade: 'A-', points: 3.50, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (m >= 65) return { grade: 'B+', points: 3.25, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (m >= 60) return { grade: 'B',  points: 3.00, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (m >= 55) return { grade: 'B-', points: 2.75, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (m >= 50) return { grade: 'C+', points: 2.50, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (m >= 45) return { grade: 'C',  points: 2.25, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (m >= 40) return { grade: 'D',  points: 2.00, colorClass: 'bg-orange-100 text-orange-800 border-orange-200' };
  return { grade: 'F', points: 0.00, colorClass: 'bg-red-100 text-red-800 border-red-200' };
}

export function getGradeInfo(marks: number | '', gradeLetter?: string): GradeInfo {
  if (gradeLetter) return getGradeInfoFromLetter(gradeLetter);
  return getGradeInfoFromMarks(marks);
}

export function getEffectivePoints(course: Course): { points: number | null; credits: number | null } {
  const credits = typeof course.credits === 'number' && course.credits > 0 ? course.credits : null;
  if (!credits) return { points: null, credits: null };

  if (course.gradeLetter) {
    const info = getGradeInfoFromLetter(course.gradeLetter);
    return { points: info.points, credits };
  }

  if (course.marks !== '') {
    const info = getGradeInfoFromMarks(course.marks);
    return { points: info.points, credits };
  }

  return { points: null, credits: null };
}

export function calculateSemesterStats(courses: Course[]) {
  let totalPoints = 0;
  let totalCredits = 0;

  courses.forEach(course => {
    const { points, credits } = getEffectivePoints(course);
    if (points !== null && credits !== null) {
      totalPoints += points * credits;
      totalCredits += credits;
    }
  });

  const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
  return { gpa, totalCredits };
}

export function calculateOverallStats(semesters: Semester[]) {
  let grandTotalPoints = 0;
  let grandTotalCredits = 0;
  let totalCourses = 0;

  semesters.forEach(semester => {
    semester.courses.forEach(course => {
      const { points, credits } = getEffectivePoints(course);
      if (points !== null && credits !== null) {
        grandTotalPoints += points * credits;
        grandTotalCredits += credits;
        totalCourses++;
      }
    });
  });

  const cgpa = grandTotalCredits > 0 ? grandTotalPoints / grandTotalCredits : 0;
  return { cgpa, totalCredits: grandTotalCredits, totalCourses };
}
