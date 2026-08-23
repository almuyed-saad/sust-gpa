import React, { useState } from "react";
import { Check, ChevronDown, Edit3, FileText, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const stats = calculateSemesterStats(semester.courses);

  const saveName = () => {
    const nextName = tempName.trim();
    if (nextName) {
      updateSemesterName(semester.id, nextName);
    } else {
      setTempName(semester.name);
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveName();
    if (e.key === "Escape") {
      setTempName(semester.name);
      setIsEditingName(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="border-b border-border/70 bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex max-w-md items-center gap-2">
                  <Input
                    autoFocus
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={saveName}
                    aria-label="Semester name"
                    className="h-9 bg-card font-display text-base font-semibold"
                  />
                  <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-emerald-600" onClick={saveName} aria-label="Save semester name">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="group flex max-w-full items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Rename ${semester.name}`}
                >
                  <h3 className="truncate font-display text-lg font-bold text-foreground transition-colors group-hover:text-primary sm:text-xl">
                    {semester.name}
                  </h3>
                  <Edit3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
                </button>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {semester.courses.length} {semester.courses.length === 1 ? "course" : "courses"} · Tap the title to rename
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed((value) => !value)}
              className="rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={isCollapsed ? `Expand ${semester.name}` : `Collapse ${semester.name}`}
            >
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                  title="Delete semester"
                  aria-label={`Delete ${semester.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl border-border bg-card text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Delete {semester.name}?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This removes the semester and all of its courses from your academic record.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => removeSemester(semester.id)} className="bg-red-600 text-white hover:bg-red-700">
                    Delete semester
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Credits</p>
            <p className="mt-0.5 font-display text-lg font-bold text-foreground">{stats.totalCredits}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Semester GPA</p>
            <p className="mt-0.5 font-display text-lg font-bold text-primary">{stats.gpa.toFixed(2)}</p>
          </div>
          <div className="col-span-2 ml-auto hidden text-xs text-muted-foreground sm:block">
            Weighted average across completed courses
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="p-4 sm:p-6">
              <div className="mb-3 hidden grid-cols-[minmax(0,1fr)_88px_118px_minmax(210px,1.1fr)_70px_36px] items-center gap-3 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground lg:grid">
                <div>Course</div>
                <div className="text-center">Credits</div>
                <div className="text-center">Marks</div>
                <div className="text-center">Grade override</div>
                <div className="text-center">GP</div>
                <div />
              </div>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {semester.courses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <CourseRow semesterId={semester.id} course={course} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                variant="outline"
                onClick={() => addCourse(semester.id)}
                className="mt-4 h-11 w-full rounded-xl border-dashed border-primary/30 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add course
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
