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
    <div className="group grid grid-cols-12 gap-2 items-center py-3 border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg">
      <div className="col-span-4">
        <Input
          placeholder="Course name…"
          value={course.name}
          onChange={(e) => updateCourse(semesterId, course.id, 'name', e.target.value)}
          className="bg-transparent border-transparent hover:border-border focus:bg-card focus:border-primary shadow-none h-9 text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      <div className="col-span-1">
        <Input
          type="number"
          step="0.5"
          placeholder="3"
          value={course.credits}
          onChange={handleCreditsChange}
          className="bg-transparent border-transparent hover:border-border focus:bg-card focus:border-primary shadow-none h-9 text-center text-foreground"
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
              ? 'bg-muted/60 border-border/40 text-muted-foreground/40 cursor-not-allowed'
              : 'bg-transparent border-transparent hover:border-border focus:bg-card focus:border-primary text-foreground'
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
                : 'bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="col-span-1 flex items-center justify-center">
        {gradeInfo.points !== null ? (
          <div className={`px-2 py-1 rounded-md border text-xs font-bold ${getGradePointClass(gradeInfo.points)}`}>
            {gradeInfo.points.toFixed(2)}
          </div>
        ) : (
          <div className="px-2 py-1 rounded-md border text-xs font-semibold bg-muted/60 text-muted-foreground/40 border-border/40">
            —
          </div>
        )}
      </div>

      <div className="col-span-0 flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeCourse(semesterId, course.id)}
          className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8 w-8"
          title="Remove Course"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function getGradeButtonActiveClass(g: string): string {
  if (g === 'A+') return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50 ring-1 ring-emerald-500/30';
  if (g === 'A' || g === 'A-') return 'bg-blue-500/20 text-blue-500 border-blue-500/50 ring-1 ring-blue-500/30';
  if (g === 'B+' || g === 'B' || g === 'B-') return 'bg-indigo-500/20 text-indigo-500 border-indigo-500/50 ring-1 ring-indigo-500/30';
  if (g === 'C+' || g === 'C') return 'bg-amber-500/20 text-amber-500 border-amber-500/50 ring-1 ring-amber-500/30';
  if (g === 'D') return 'bg-orange-500/20 text-orange-500 border-orange-500/50 ring-1 ring-orange-500/30';
  return 'bg-red-500/20 text-red-500 border-red-500/50 ring-1 ring-red-500/30';
}

function getGradePointClass(points: number): string {
  if (points >= 3.75) return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
  if (points >= 3.25) return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
  if (points >= 2.75) return 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30';
  if (points >= 2.50) return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
  if (points >= 2.00) return 'bg-orange-500/15 text-orange-500 border-orange-500/30';
  return 'bg-red-500/15 text-red-500 border-red-500/30';
}
