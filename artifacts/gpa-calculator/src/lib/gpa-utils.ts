import { Course, Semester } from "./store";

export interface GradeInfo {
  grade: string;
  points: number | null;
  colorClass: string;
}

export function getGradeInfo(marks: number | ''): GradeInfo {
  if (marks === '' || isNaN(marks as number) || marks < 0 || marks > 100) {
    return { grade: '-', points: null, colorClass: 'bg-slate-100 text-slate-500 border-slate-200' };
  }

  const m = Math.round(Number(marks));

  if (m >= 80) return { grade: 'A+', points: 4.00, colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
  if (m >= 75) return { grade: 'A', points: 3.75, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (m >= 70) return { grade: 'A-', points: 3.50, colorClass: 'bg-blue-100 text-blue-800 border-blue-200' };
  if (m >= 65) return { grade: 'B+', points: 3.25, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (m >= 60) return { grade: 'B', points: 3.00, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (m >= 55) return { grade: 'B-', points: 2.75, colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
  if (m >= 50) return { grade: 'C+', points: 2.50, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (m >= 45) return { grade: 'C', points: 2.25, colorClass: 'bg-amber-100 text-amber-800 border-amber-200' };
  if (m >= 40) return { grade: 'D', points: 2.00, colorClass: 'bg-orange-100 text-orange-800 border-orange-200' };
  
  return { grade: 'F', points: 0.00, colorClass: 'bg-red-100 text-red-800 border-red-200' };
}

export function calculateSemesterStats(courses: Course[]) {
  let totalPoints = 0;
  let totalCredits = 0;

  courses.forEach(course => {
    if (course.credits !== '' && course.marks !== '') {
      const credits = Number(course.credits);
      const { points } = getGradeInfo(course.marks);
      
      if (points !== null && !isNaN(credits) && credits > 0) {
        totalPoints += (points * credits);
        totalCredits += credits;
      }
    }
  });

  const gpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  return { gpa, totalCredits };
}

export function calculateOverallStats(semesters: Semester[]) {
  let grandTotalPoints = 0;
  let grandTotalCredits = 0;
  let totalCourses = 0;

  semesters.forEach(semester => {
    semester.courses.forEach(course => {
      if (course.credits !== '' && course.marks !== '') {
        const credits = Number(course.credits);
        const { points } = getGradeInfo(course.marks);
        
        if (points !== null && !isNaN(credits) && credits > 0) {
          grandTotalPoints += (points * credits);
          grandTotalCredits += credits;
          totalCourses++;
        }
      }
    });
  });

  const cgpa = grandTotalCredits > 0 ? (grandTotalPoints / grandTotalCredits) : 0;
  return { cgpa, totalCredits: grandTotalCredits, totalCourses };
}
