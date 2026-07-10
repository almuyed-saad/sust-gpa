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
    <Card className="overflow-hidden bg-card shadow-sm border-border mb-6">
      <div className="px-6 py-4 border-b border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500" onClick={saveName}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
              <h3 className="text-lg font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                {semester.name}
              </h3>
              <Edit2 className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-card px-3 py-1.5 rounded-md border border-border shadow-xs">
            <div className="text-xs text-muted-foreground font-medium">
              Credits: <span className="text-foreground font-semibold">{stats.totalCredits}</span>
            </div>
            <div className="w-px h-4 bg-border"></div>
            <div className="text-xs text-muted-foreground font-medium">
              GPA: <span className="text-primary font-bold">{stats.gpa.toFixed(2)}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeSemester(semester.id)}
            className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            title="Delete Semester"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-6">
        <div className="hidden md:grid grid-cols-12 gap-2 mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <div className="col-span-4">Course</div>
          <div className="col-span-1 text-center">Credits</div>
          <div className="col-span-2 text-center">Marks</div>
          <div className="col-span-4 text-center">— or select Grade —</div>
          <div className="col-span-1 text-center">GP</div>
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
          className="mt-4 w-full border-dashed text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Course
        </Button>
      </div>
    </Card>
  );
}
