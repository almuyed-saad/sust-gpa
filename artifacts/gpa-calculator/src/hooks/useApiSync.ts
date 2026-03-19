import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api, ApiSemester } from "@/lib/api";
import { useGpaStore, Course, Semester } from "@/lib/store";

function toStoreSemester(s: ApiSemester): Semester {
  return {
    id: s.id,
    name: s.name,
    courses: s.courses.map((c) => ({
      id: c.id,
      name: c.name,
      credits: c.credits,
      marks: c.marks ?? '',
    })),
  };
}

export function useApiSync() {
  const { isAuthenticated, isLoading } = useAuth();
  const loadFromApi = useGpaStore((s) => s.loadFromApi);
  const loaded = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !loaded.current) {
      loaded.current = true;
      api.getSemesters().then(({ semesters }) => {
        loadFromApi(semesters.map(toStoreSemester));
      }).catch(console.error);
    }
  }, [isAuthenticated, isLoading, loadFromApi]);

  const syncAddSemester = useCallback(async (localId: string, name: string) => {
    if (!isAuthenticated) return localId;
    try {
      const { semester } = await api.createSemester(name);
      return semester.id;
    } catch {
      return localId;
    }
  }, [isAuthenticated]);

  const syncDeleteSemester = useCallback(async (id: string) => {
    if (!isAuthenticated) return;
    try { await api.deleteSemester(id); } catch {}
  }, [isAuthenticated]);

  const syncUpdateSemesterName = useCallback(async (id: string, name: string) => {
    if (!isAuthenticated) return;
    try { await api.updateSemester(id, name); } catch {}
  }, [isAuthenticated]);

  const syncAddCourse = useCallback(async (semesterId: string, localCourseId: string) => {
    if (!isAuthenticated) return localCourseId;
    try {
      const { course } = await api.createCourse(semesterId, { name: "", credits: 3, marks: null });
      return course.id;
    } catch {
      return localCourseId;
    }
  }, [isAuthenticated]);

  const syncDeleteCourse = useCallback(async (semesterId: string, courseId: string) => {
    if (!isAuthenticated) return;
    try { await api.deleteCourse(semesterId, courseId); } catch {}
  }, [isAuthenticated]);

  const syncUpdateCourse = useCallback(async (
    semesterId: string,
    courseId: string,
    course: Course
  ) => {
    if (!isAuthenticated) return;
    try {
      await api.updateCourse(semesterId, courseId, {
        name: course.name,
        credits: typeof course.credits === 'number' ? course.credits : 3,
        marks: typeof course.marks === 'number' ? course.marks : null,
      });
    } catch {}
  }, [isAuthenticated]);

  return {
    syncAddSemester,
    syncDeleteSemester,
    syncUpdateSemesterName,
    syncAddCourse,
    syncDeleteCourse,
    syncUpdateCourse,
  };
}
