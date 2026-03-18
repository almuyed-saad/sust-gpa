import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Course } from "@/lib/store";
import { getGradeInfo, GRADE_OPTIONS } from "@/lib/gpa-utils";
import { useGpaActions } from "@/hooks/useGpaActions";

interface CourseRowProps {
  semesterId: string;
  course: Course;
}

export function CourseRow({ semesterId, course }: CourseRowProps) {
  const { updateCourse, removeCourse } = useGpaActions();

  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      updateCourse(semesterId, course.id, 'marks', '');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      updateCourse(semesterId, course.id, 'marks', num);
      if (course.gradeLetter) {
        updateCourse(semesterId, course.id, 'gradeLetter', '');
      }
    }
  };

  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') { updateCourse(semesterId, course.id, 'credits', ''); return; }
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      updateCourse(semesterId, course.id, 'credits', num);
    }
  };

  const handleGradeSelect = (g: string) => {
    if (course.gradeLetter === g) {
      updateCourse(semesterId, course.id, 'gradeLetter', '');
    } else {
      updateCourse(semesterId, course.id, 'gradeLetter', g);
      if (course.marks !== '') {
        updateCourse(semesterId, course.id, 'marks', '');
      }
    }
  };

  const gradeInfo = getGradeInfo(course.marks, course.gradeLetter || undefined);

  return (
    <div className="group grid grid-cols-12 gap-2 items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <div className="col-span-4">
        <Input
          placeholder="Course name…"
          value={course.name}
          onChange={(e) => updateCourse(semesterId, course.id, 'name', e.target.value)}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9"
        />
      </div>

      <div className="col-span-1">
        <Input
          type="number"
          step="0.5"
          placeholder="3"
          value={course.credits}
          onChange={handleCreditsChange}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9 text-center"
        />
      </div>

      <div className="col-span-2">
        <Input
          type="number"
          placeholder="0–100"
          value={course.marks}
          onChange={handleMarksChange}
          disabled={!!course.gradeLetter}
          className={`h-9 text-center shadow-none transition-colors ${
            course.gradeLetter
              ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
              : 'bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary'
          }`}
        />
      </div>

      <div className="col-span-4 flex flex-wrap gap-1 items-center justify-center">
        {GRADE_OPTIONS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => handleGradeSelect(g)}
            className={`px-1.5 py-0.5 rounded text-xs font-bold border transition-all ${
              course.gradeLetter === g
                ? getGradeButtonActiveClass(g)
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-800'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="col-span-1 flex items-center justify-center">
        {gradeInfo.points !== null ? (
          <div className={`px-2 py-1 rounded-md border text-xs font-bold ${gradeInfo.colorClass}`}>
            {gradeInfo.points.toFixed(2)}
          </div>
        ) : (
          <div className="px-2 py-1 rounded-md border text-xs font-semibold bg-slate-50 text-slate-300 border-slate-200">
            —
          </div>
        )}
      </div>

      <div className="col-span-0 flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeCourse(semesterId, course.id)}
          className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-8 w-8"
          title="Remove Course"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function getGradeButtonActiveClass(g: string): string {
  if (g === 'A+') return 'bg-emerald-100 text-emerald-800 border-emerald-400 ring-1 ring-emerald-300';
  if (g === 'A' || g === 'A-') return 'bg-blue-100 text-blue-800 border-blue-400 ring-1 ring-blue-300';
  if (g === 'B+' || g === 'B' || g === 'B-') return 'bg-indigo-100 text-indigo-800 border-indigo-400 ring-1 ring-indigo-300';
  if (g === 'C+' || g === 'C') return 'bg-amber-100 text-amber-800 border-amber-400 ring-1 ring-amber-300';
  if (g === 'D') return 'bg-orange-100 text-orange-800 border-orange-400 ring-1 ring-orange-300';
  return 'bg-red-100 text-red-800 border-red-400 ring-1 ring-red-300';
}
