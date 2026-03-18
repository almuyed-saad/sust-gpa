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

export interface ApiSemester {
  id: string;
  name: string;
  courses: ApiCourse[];
}

export const api = {
  getSemesters: () => apiFetch<{ semesters: ApiSemester[] }>("/semesters"),
  createSemester: (name: string) =>
    apiFetch<{ semester: ApiSemester }>("/semesters", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  updateSemester: (id: string, name: string) =>
    apiFetch<{ semester: ApiSemester }>(`/semesters/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
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
