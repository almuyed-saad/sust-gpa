import React from "react";
import { Check, Trash2 } from "lucide-react";
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
    if (val === "") {
      updateCourse(semesterId, course.id, "marks", "");
      return;
    }
    const num = Number(val);
    if (!Number.isNaN(num) && num >= 0 && num <= 100) {
      updateCourse(semesterId, course.id, "marks", num);
      if (course.gradeLetter) updateCourse(semesterId, course.id, "gradeLetter", "");
    }
  };

  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      updateCourse(semesterId, course.id, "credits", "");
      return;
    }
    const num = Number(val);
    if (!Number.isNaN(num) && num >= 0 && num <= 10) {
      updateCourse(semesterId, course.id, "credits", num);
    }
  };

  const handleGradeSelect = (grade: string) => {
    if (course.gradeLetter === grade) {
      updateCourse(semesterId, course.id, "gradeLetter", "");
      return;
    }
    updateCourse(semesterId, course.id, "gradeLetter", grade);
    if (course.marks !== "") updateCourse(semesterId, course.id, "marks", "");
  };

  const gradeInfo = getGradeInfo(course.marks, course.gradeLetter || undefined);
  const hasResult = gradeInfo.points !== null;

  return (
    <div className="group rounded-2xl border border-border/70 bg-card p-3 shadow-xs transition-all duration-200 hover:border-primary/25 hover:shadow-sm sm:p-4 lg:grid lg:grid-cols-[minmax(0,1fr)_88px_118px_minmax(210px,1.1fr)_70px_36px] lg:items-center lg:gap-3 lg:rounded-xl lg:border-0 lg:bg-transparent lg:p-3 lg:shadow-none lg:hover:bg-muted/35">
      <div className="min-w-0">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground lg:sr-only" htmlFor={`course-${course.id}`}>
          Course name
        </label>
        <Input
          id={`course-${course.id}`}
          placeholder="e.g. Linear Algebra"
          value={course.name}
          onChange={(e) => updateCourse(semesterId, course.id, "name", e.target.value)}
          className="h-10 rounded-xl border-border/70 bg-background text-sm font-medium text-foreground shadow-none placeholder:text-muted-foreground/55 focus-visible:ring-2 lg:h-9 lg:border-transparent lg:bg-transparent"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:mt-0 lg:block">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground lg:sr-only" htmlFor={`credits-${course.id}`}>
            Credits
          </label>
          <Input
            id={`credits-${course.id}`}
            type="number"
            min="0"
            max="10"
            step="0.5"
            placeholder="3"
            value={course.credits}
            onChange={handleCreditsChange}
            className="h-10 rounded-xl border-border/70 bg-background text-center text-sm font-semibold text-foreground shadow-none focus-visible:ring-2 lg:h-9 lg:border-transparent lg:bg-transparent"
          />
        </div>

        <div className="lg:hidden">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground" htmlFor={`marks-mobile-${course.id}`}>
            Marks
          </label>
          <Input
            id={`marks-mobile-${course.id}`}
            type="number"
            min="0"
            max="100"
            placeholder="0–100"
            value={course.marks}
            onChange={handleMarksChange}
            disabled={!!course.gradeLetter}
            className="h-10 rounded-xl border-border/70 bg-background text-center text-sm font-semibold text-foreground shadow-none focus-visible:ring-2 disabled:bg-muted/60 disabled:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="mt-3 hidden lg:block lg:mt-0">
        <label className="sr-only" htmlFor={`marks-desktop-${course.id}`}>Marks</label>
        <Input
          id={`marks-desktop-${course.id}`}
          type="number"
          min="0"
          max="100"
          placeholder="0–100"
          value={course.marks}
          onChange={handleMarksChange}
          disabled={!!course.gradeLetter}
          className="h-9 rounded-lg border-transparent bg-transparent text-center text-sm font-semibold text-foreground shadow-none focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground/45"
        />
      </div>

      <div className="mt-3 lg:mt-0">
        <div className="mb-1.5 flex items-center justify-between lg:hidden">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Grade override</span>
          {course.gradeLetter && <span className="text-[11px] text-muted-foreground">Tap again to clear</span>}
        </div>
        <div className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap lg:justify-center">
          {GRADE_OPTIONS.map((grade) => {
            const selected = course.gradeLetter === grade;
            return (
              <button
                key={grade}
                type="button"
                onClick={() => handleGradeSelect(grade)}
                aria-pressed={selected}
                aria-label={`${selected ? "Clear" : "Select"} grade ${grade}`}
                className={`min-h-9 rounded-lg border px-1.5 text-xs font-bold transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 sm:min-w-[34px] lg:min-h-7 lg:rounded-md lg:px-1.5 ${selected ? getGradeButtonActiveClass(grade) : "border-border/70 bg-background text-muted-foreground hover:border-foreground/35 hover:text-foreground"}`}
              >
                {selected && <Check className="mr-0.5 inline h-3 w-3" />}
                {grade}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 lg:mt-0 lg:block lg:border-0 lg:pt-0 lg:text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground lg:hidden">Grade point</span>
        {hasResult ? (
          <div className={`inline-flex min-w-[58px] items-center justify-center rounded-lg border px-2 py-1.5 text-sm font-extrabold ${getGradePointClass(gradeInfo.points!)}`}>
            {gradeInfo.points!.toFixed(2)}
          </div>
        ) : (
          <div className="inline-flex min-w-[58px] items-center justify-center rounded-lg border border-border/60 bg-muted/55 px-2 py-1.5 text-sm font-semibold text-muted-foreground/60">
            —
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-end lg:mt-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeCourse(semesterId, course.id)}
          className="h-9 w-9 rounded-lg text-muted-foreground opacity-100 transition-colors hover:bg-red-500/10 hover:text-red-500 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
          title="Remove course"
          aria-label={`Remove ${course.name || "course"}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getGradeButtonActiveClass(grade: string): string {
  if (grade === "A+") return "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300";
  if (grade === "A" || grade === "A-") return "border-sky-500/50 bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/25 dark:text-sky-300";
  if (grade === "B+" || grade === "B" || grade === "B-") return "border-indigo-500/50 bg-indigo-500/15 text-indigo-600 ring-1 ring-indigo-500/25 dark:text-indigo-300";
  if (grade === "C+" || grade === "C") return "border-amber-500/50 bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-300";
  if (grade === "D") return "border-orange-500/50 bg-orange-500/15 text-orange-600 ring-1 ring-orange-500/25 dark:text-orange-300";
  return "border-red-500/50 bg-red-500/15 text-red-600 ring-1 ring-red-500/25 dark:text-red-300";
}

function getGradePointClass(points: number): string {
  if (points >= 3.75) return "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300";
  if (points >= 3.25) return "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-300";
  if (points >= 2.75) return "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300";
  if (points >= 2.5) return "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300";
  if (points >= 2) return "border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300";
  return "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-300";
}
