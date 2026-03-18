import React, { useState } from "react";
import { Plus, Trash2, Edit2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Semester } from "@/lib/store";
import { CourseRow } from "./CourseRow";
import { calculateSemesterStats } from "@/lib/gpa-utils";
import { useGpaActions } from "@/hooks/useGpaActions";

interface SemesterCardProps {
  semester: Semester;
}

export function SemesterCard({ semester }: SemesterCardProps) {
  const { addCourse, removeSemester, updateSemesterName } = useGpaActions();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(semester.name);

  const stats = calculateSemesterStats(semester.courses);

  const saveName = () => {
    if (tempName.trim()) {
      updateSemesterName(semester.id, tempName);
    } else {
      setTempName(semester.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') {
      setTempName(semester.name);
      setIsEditingName(false);
    }
  };

  return (
    <Card className="overflow-hidden bg-white shadow-sm border-slate-200/60 mb-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-2 w-full max-w-sm">
              <Input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={saveName}
                className="h-8 text-base font-display font-semibold"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={saveName}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h3 className="text-lg font-display font-semibold text-slate-900 group-hover:text-primary transition-colors">
                {semester.name}
              </h3>
              <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-md border shadow-sm">
            <div className="text-xs text-slate-500 font-medium">
              Credits: <span className="text-slate-900">{stats.totalCredits}</span>
            </div>
            <div className="w-px h-4 bg-slate-200"></div>
            <div className="text-xs text-slate-500 font-medium">
              GPA: <span className="text-primary font-bold">{stats.gpa.toFixed(2)}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeSemester(semester.id)}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
            title="Delete Semester"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Course</div>
          <div className="col-span-2 text-center">Credits</div>
          <div className="col-span-1 text-center">Mode</div>
          <div className="col-span-3 text-center">Marks / Grade</div>
          <div className="col-span-1 text-center">GP</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {semester.courses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CourseRow semesterId={semester.id} course={course} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Button
          variant="outline"
          onClick={() => addCourse(semester.id)}
          className="mt-4 w-full border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>
    </Card>
  );
}
