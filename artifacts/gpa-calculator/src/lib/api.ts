const BASE = "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export interface ApiCourse {
  id: string;
  semesterId: string;
  name: string;
  credits: number;
  marks: number | null;
  gradeLetter: string | null;
}

export type ApiSemesterStatus = "in-progress" | "completed";

export interface ApiSemester {
  id: string;
  name: string;
  academicYear: string;
  termNumber: number;
  status: ApiSemesterStatus;
  notes: string | null;
  courses: ApiCourse[];
}

export const api = {
  getSemesters: () => apiFetch<{ semesters: ApiSemester[] }>("/semesters"),
  createSemester: (data: { name: string; academicYear?: string; termNumber?: number; status?: ApiSemesterStatus; notes?: string | null }) =>
    apiFetch<{ semester: ApiSemester }>("/semesters", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateSemester: (id: string, data: { name: string; academicYear?: string; termNumber?: number; status?: ApiSemesterStatus; notes?: string | null }) =>
    apiFetch<{ semester: ApiSemester }>(`/semesters/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteSemester: (id: string) =>
    apiFetch<{ success: boolean }>(`/semesters/${id}`, { method: "DELETE" }),
  createCourse: (semesterId: string, data: { name: string; credits: number; marks?: number | null; gradeLetter?: string | null }) =>
    apiFetch<{ course: ApiCourse }>(`/semesters/${semesterId}/courses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCourse: (semesterId: string, courseId: string, data: { name: string; credits: number; marks?: number | null; gradeLetter?: string | null }) =>
    apiFetch<{ course: ApiCourse }>(`/semesters/${semesterId}/courses/${courseId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteCourse: (semesterId: string, courseId: string) =>
    apiFetch<{ success: boolean }>(`/semesters/${semesterId}/courses/${courseId}`, { method: "DELETE" }),
};
