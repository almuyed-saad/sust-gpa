import React from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Course } from "@/lib/store";
import { GradeBadge } from "./GradeBadge";
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
    }
  };

  const handleCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      updateCourse(semesterId, course.id, 'credits', '');
      return;
    }
    const num = Number(val);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      updateCourse(semesterId, course.id, 'credits', num);
    }
  };

  return (
    <div className="group grid grid-cols-1 md:grid-cols-12 gap-3 items-center py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <div className="md:col-span-5">
        <Input
          placeholder="Course Name (e.g. Calculus I)"
          value={course.name}
          onChange={(e) => updateCourse(semesterId, course.id, 'name', e.target.value)}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9"
        />
      </div>
      <div className="md:col-span-2 relative">
        <Input
          type="number"
          step="0.5"
          placeholder="Credits"
          value={course.credits}
          onChange={handleCreditsChange}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9 text-center"
        />
      </div>
      <div className="md:col-span-2 relative">
        <Input
          type="number"
          placeholder="Marks"
          value={course.marks}
          onChange={handleMarksChange}
          className="bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary shadow-none h-9 text-center font-medium"
        />
      </div>
      <div className="md:col-span-2 flex items-center justify-center gap-2">
        <GradeBadge marks={course.marks} type="grade" />
        <GradeBadge marks={course.marks} type="points" />
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
