import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export interface Course {
  id: string;
  name: string;
  credits: number | '';
  marks: number | '';
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

interface GpaState {
  semesters: Semester[];
  addSemester: () => void;
  removeSemester: (id: string) => void;
  updateSemesterName: (id: string, name: string) => void;
  addCourse: (semesterId: string) => void;
  removeCourse: (semesterId: string, courseId: string) => void;
  updateCourse: (semesterId: string, courseId: string, field: keyof Course, value: string | number | '') => void;
  clearAll: () => void;
}

const createInitialSemester = (): Semester => ({
  id: uuidv4(),
  name: 'Year 1, Semester 1',
  courses: [
    { id: uuidv4(), name: '', credits: 3, marks: '' },
    { id: uuidv4(), name: '', credits: 3, marks: '' },
    { id: uuidv4(), name: '', credits: 3, marks: '' },
  ],
});

export const useGpaStore = create<GpaState>()(
  persist(
    (set) => ({
      semesters: [createInitialSemester()],

      addSemester: () => set((state) => ({
        semesters: [
          ...state.semesters,
          {
            id: uuidv4(),
            name: `Semester ${state.semesters.length + 1}`,
            courses: [{ id: uuidv4(), name: '', credits: 3, marks: '' }],
          }
        ]
      })),

      removeSemester: (id) => set((state) => ({
        semesters: state.semesters.filter(s => s.id !== id)
      })),

      updateSemesterName: (id, name) => set((state) => ({
        semesters: state.semesters.map(s => s.id === id ? { ...s, name } : s)
      })),

      addCourse: (semesterId) => set((state) => ({
        semesters: state.semesters.map(s => s.id === semesterId ? {
          ...s,
          courses: [...s.courses, { id: uuidv4(), name: '', credits: 3, marks: '' }]
        } : s)
      })),

      removeCourse: (semesterId, courseId) => set((state) => ({
        semesters: state.semesters.map(s => s.id === semesterId ? {
          ...s,
          courses: s.courses.filter(c => c.id !== courseId)
        } : s)
      })),

      updateCourse: (semesterId, courseId, field, value) => set((state) => ({
        semesters: state.semesters.map(s => s.id === semesterId ? {
          ...s,
          courses: s.courses.map(c => c.id === courseId ? { ...c, [field]: value } : c)
        } : s)
      })),

      clearAll: () => set({
        semesters: [createInitialSemester()]
      })
    }),
    {
      name: 'sust-gpa-calculator-v1',
    }
  )
);
