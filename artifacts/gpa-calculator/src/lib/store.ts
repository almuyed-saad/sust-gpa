import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

export interface Course {
  id: string;
  name: string;
  credits: number | "";
  marks: number | "";
  gradeLetter: string;
}

export type SemesterStatus = "in-progress" | "completed";

export interface Semester {
  id: string;
  name: string;
  academicYear: string;
  termNumber: number;
  status: SemesterStatus;
  notes: string;
  courses: Course[];
}

export type SemesterMetadata = Pick<Semester, "name" | "academicYear" | "termNumber" | "status" | "notes">;

interface GpaState {
  semesters: Semester[];
  addSemester: () => void;
  removeSemester: (id: string) => void;
  updateSemesterName: (id: string, name: string) => void;
  updateSemesterMetadata: (id: string, updates: Partial<SemesterMetadata>) => void;
  addCourse: (semesterId: string) => void;
  removeCourse: (semesterId: string, courseId: string) => void;
  updateCourse: (semesterId: string, courseId: string, field: keyof Course, value: string | number | "") => void;
  clearAll: () => void;
  loadFromApi: (semesters: Semester[]) => void;
}

export function getCurrentAcademicYear(date = new Date()): string {
  const year = date.getFullYear();
  return `${year}-${String(year + 1).slice(-2)}`;
}

const newCourse = (): Course => ({
  id: uuidv4(),
  name: "",
  credits: 3,
  marks: "",
  gradeLetter: "",
});

function normalizeCourse(raw: Partial<Course> | undefined): Course {
  return {
    id: typeof raw?.id === "string" && raw.id ? raw.id : uuidv4(),
    name: typeof raw?.name === "string" ? raw.name : "",
    credits: typeof raw?.credits === "number" || raw?.credits === "" ? raw.credits : 3,
    marks: typeof raw?.marks === "number" || raw?.marks === "" ? raw.marks : "",
    gradeLetter: typeof raw?.gradeLetter === "string" ? raw.gradeLetter : "",
  };
}

export function normalizeSemester(raw: Partial<Semester> | undefined, index = 0): Semester {
  const fallbackTerm = (index % 3) + 1;
  const termNumber = typeof raw?.termNumber === "number" && Number.isInteger(raw.termNumber) && raw.termNumber >= 1 && raw.termNumber <= 3
    ? raw.termNumber
    : fallbackTerm;
  const status: SemesterStatus = raw?.status === "completed" ? "completed" : "in-progress";

  return {
    id: typeof raw?.id === "string" && raw.id ? raw.id : uuidv4(),
    name: typeof raw?.name === "string" && raw.name.trim() ? raw.name : `Year ${Math.floor(index / 3) + 1}, Semester ${termNumber}`,
    academicYear: typeof raw?.academicYear === "string" ? raw.academicYear : getCurrentAcademicYear(),
    termNumber,
    status,
    notes: typeof raw?.notes === "string" ? raw.notes : "",
    courses: Array.isArray(raw?.courses) ? raw.courses.map((course) => normalizeCourse(course)) : [],
  };
}

const createInitialSemester = (): Semester => normalizeSemester({
  name: "Year 1, Semester 1",
  academicYear: getCurrentAcademicYear(),
  termNumber: 1,
  status: "in-progress",
  notes: "",
  courses: [newCourse(), newCourse(), newCourse()],
}, 0);

export const useGpaStore = create<GpaState>()(
  persist(
    (set) => ({
      semesters: [createInitialSemester()],

      loadFromApi: (semesters) => set({ semesters: semesters.map((semester, index) => normalizeSemester(semester, index)) }),

      addSemester: () => set((state) => {
        const index = state.semesters.length;
        const termNumber = (index % 3) + 1;
        return {
          semesters: [
            ...state.semesters,
            normalizeSemester({
              name: `Year ${Math.floor(index / 3) + 1}, Semester ${termNumber}`,
              academicYear: getCurrentAcademicYear(),
              termNumber,
              status: "in-progress",
              notes: "",
              courses: [newCourse()],
            }, index),
          ],
        };
      }),

      removeSemester: (id) => set((state) => ({ semesters: state.semesters.filter((semester) => semester.id !== id) })),

      updateSemesterName: (id, name) => set((state) => ({
        semesters: state.semesters.map((semester) => semester.id === id ? { ...semester, name } : semester),
      })),

      updateSemesterMetadata: (id, updates) => set((state) => ({
        semesters: state.semesters.map((semester) => semester.id === id ? { ...semester, ...updates } : semester),
      })),

      addCourse: (semesterId) => set((state) => ({
        semesters: state.semesters.map((semester) => semester.id === semesterId ? {
          ...semester,
          courses: [...semester.courses, newCourse()],
        } : semester),
      })),

      removeCourse: (semesterId, courseId) => set((state) => ({
        semesters: state.semesters.map((semester) => semester.id === semesterId ? {
          ...semester,
          courses: semester.courses.filter((course) => course.id !== courseId),
        } : semester),
      })),

      updateCourse: (semesterId, courseId, field, value) => set((state) => ({
        semesters: state.semesters.map((semester) => semester.id === semesterId ? {
          ...semester,
          courses: semester.courses.map((course) => course.id === courseId ? { ...course, [field]: value } : course),
        } : semester),
      })),

      clearAll: () => set({ semesters: [createInitialSemester()] }),
    }),
    {
      name: "sust-gpa-calculator-v2",
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GpaState> | undefined;
        return {
          ...currentState,
          ...persisted,
          semesters: Array.isArray(persisted?.semesters)
            ? persisted.semesters.map((semester, index) => normalizeSemester(semester, index))
            : currentState.semesters,
        };
      },
    },
  ),
);
