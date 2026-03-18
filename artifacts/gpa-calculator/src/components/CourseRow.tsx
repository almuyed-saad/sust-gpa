import React, { useState } from "react";
import { Trash2, Hash, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Course } from "@/lib/store";
import { getGradeInfo, GRADE_OPTIONS } from "@/lib/gpa-utils";
import { useGpaActions } from "@/hooks/useGpaActions";

interface CourseRowProps {
  semesterId: string;
  course: Course;
}

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'A':  'bg-blue-100 text-blue-800 border-blue-300',
  'A-': 'bg-blue-100 text-blue-800 border-blue-300',
  'B+': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'B':  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'B-': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'C+': 'bg-amber-100 text-amber-800 border-amber-300',
  'C':  'bg-amber-100 text-amber-800 border-amber-300',
  'D':  'bg-orange-100 text-orange-800 border-orange-300',
  'F':  'bg-red-100 text-red-800 border-red-300',
};

export function CourseRow({ semesterId, course }: CourseRowProps) {
  const { updateCourse, removeCourse } = useGpaActions();
  const inputMode: 'marks' | 'grade' = course.gradeLetter ? 'grade' : 'marks';

  const switchToMarks = () => {
    updateCourse(semesterId, course.id, 'gradeLetter', '');
  };

  const switchToGrade = () => {
    updateCourse(semesterId, course.id, 'marks', '');
    updateCourse(semesterId, course.id, 'gradeLetter', course.gradeLetter || '');
  };

  const handleMarksChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') { updateCourse(semesterId, course.id, 'marks', ''); return; }
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      updateCourse(semesterId, course.id, 'marks', num);
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

  const gradeInfo = getGradeInfo(course.marks, course.gradeLetter || undefined);

  return (
    <div className="group grid grid-cols-1 md:grid-cols-12 gap-2 items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <div className="md:col-span-4">
        <Input
          placeholder="Course Name (e.g. Calculus I)"
          value={course.name}
          onChange={(e) => updateCourse(semesterId, course.id, 'name', e.target.value)}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9"
        />
      </div>

      <div className="md:col-span-2">
        <Input
          type="number"
          step="0.5"
          placeholder="Credits"
          value={course.credits}
          onChange={handleCreditsChange}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9 text-center"
        />
      </div>

      <div className="md:col-span-1 flex justify-center">
        <div className="flex rounded-md border border-slate-200 overflow-hidden bg-white shadow-sm text-xs">
          <button
            type="button"
            onClick={switchToMarks}
            title="Enter marks (0–100)"
            className={`px-2 py-1.5 flex items-center gap-1 transition-colors font-medium ${inputMode === 'marks' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Hash className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={switchToGrade}
            title="Select grade letter"
            className={`px-2 py-1.5 flex items-center gap-1 transition-colors font-medium border-l border-slate-200 ${inputMode === 'grade' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <GraduationCap className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="md:col-span-3">
        {inputMode === 'marks' ? (
          <Input
            type="number"
            placeholder="Marks (0–100)"
            value={course.marks}
            onChange={handleMarksChange}
            className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9 text-center font-medium"
          />
        ) : (
          <div className="flex flex-wrap gap-1 justify-center">
            {GRADE_OPTIONS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updateCourse(semesterId, course.id, 'gradeLetter', g)}
                className={`px-2 py-0.5 rounded text-xs font-bold border transition-all ${
                  course.gradeLetter === g
                    ? (GRADE_COLORS[g] || 'bg-primary text-white border-primary') + ' ring-2 ring-offset-1 ring-primary/40'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-1 flex items-center justify-center">
        {gradeInfo.points !== null ? (
          <div className={`px-2 py-1 rounded-md border text-xs font-bold ${gradeInfo.colorClass}`}>
            {gradeInfo.points.toFixed(2)}
          </div>
        ) : (
          <div className="px-2 py-1 rounded-md border text-xs font-semibold bg-slate-50 text-slate-400 border-slate-200">
            —
          </div>
        )}
      </div>

      <div className="md:col-span-1 flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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
