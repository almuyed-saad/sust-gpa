import { useCallback, useRef } from "react";
import { useAuth } from "@workspace/replit-auth-web";
import { api } from "@/lib/api";
import { useGpaStore, type Course } from "@/lib/store";

function mapApiCourse(c: { id: string; name: string; credits: number; marks: number | null; gradeLetter?: string | null }): Course {
  return {
    id: c.id,
    name: c.name,
    credits: c.credits,
    marks: c.marks ?? '',
    gradeLetter: c.gradeLetter ?? '',
  };
}

export function useGpaActions() {
  const { isAuthenticated } = useAuth();
  const store = useGpaStore();
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const addSemester = useCallback(async () => {
    const name = `Semester ${store.semesters.length + 1}`;
    if (!isAuthenticated) {
      store.addSemester();
      return;
    }
    try {
      const { semester } = await api.createSemester(name);
      store.loadFromApi([...store.semesters, {
        id: semester.id,
        name: semester.name,
        courses: semester.courses.map(mapApiCourse),
      }]);
    } catch {
      store.addSemester();
    }
  }, [isAuthenticated, store]);

  const removeSemester = useCallback(async (id: string) => {
    store.removeSemester(id);
    if (isAuthenticated) {
      try { await api.deleteSemester(id); } catch {}
    }
  }, [isAuthenticated, store]);

  const updateSemesterName = useCallback(async (id: string, name: string) => {
    store.updateSemesterName(id, name);
    if (isAuthenticated) {
      try { await api.updateSemester(id, name); } catch {}
    }
  }, [isAuthenticated, store]);

  const addCourse = useCallback(async (semesterId: string) => {
    if (!isAuthenticated) {
      store.addCourse(semesterId);
      return;
    }
    try {
      const { course } = await api.createCourse(semesterId, { name: "", credits: 3, marks: null, gradeLetter: null });
      store.loadFromApi(store.semesters.map(s =>
        s.id === semesterId
          ? { ...s, courses: [...s.courses, mapApiCourse(course)] }
          : s
      ));
    } catch {
      store.addCourse(semesterId);
    }
  }, [isAuthenticated, store]);

  const removeCourse = useCallback(async (semesterId: string, courseId: string) => {
    store.removeCourse(semesterId, courseId);
    if (isAuthenticated) {
      try { await api.deleteCourse(semesterId, courseId); } catch {}
    }
  }, [isAuthenticated, store]);

  const updateCourse = useCallback((semesterId: string, courseId: string, field: keyof Course, value: string | number | '') => {
    store.updateCourse(semesterId, courseId, field, value);

    if (!isAuthenticated) return;

    const timerKey = `${semesterId}:${courseId}`;
    clearTimeout(debounceTimers.current[timerKey]);
    debounceTimers.current[timerKey] = setTimeout(() => {
      const semester = store.semesters.find(s => s.id === semesterId);
      const course = semester?.courses.find(c => c.id === courseId);
      if (!course) return;

      const updated = { ...course, [field]: value };
      api.updateCourse(semesterId, courseId, {
        name: updated.name,
        credits: typeof updated.credits === 'number' ? updated.credits : 3,
        marks: typeof updated.marks === 'number' ? updated.marks : null,
        gradeLetter: updated.gradeLetter || null,
      }).catch(() => {});
    }, 600);
  }, [isAuthenticated, store]);

  const clearAll = useCallback(async () => {
    store.clearAll();
  }, [store]);

  return { addSemester, removeSemester, updateSemesterName, addCourse, removeCourse, updateCourse, clearAll };
}
