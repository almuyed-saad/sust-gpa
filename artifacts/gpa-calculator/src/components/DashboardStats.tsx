import React from "react";
import { BookOpen, BookMarked, GraduationCap, RotateCcw, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGpaStore } from "@/lib/store";
import { calculateOverallStats } from "@/lib/gpa-utils";
import { useGpaActions } from "@/hooks/useGpaActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DashboardStats() {
  const semesters = useGpaStore((state) => state.semesters);
  const { clearAll } = useGpaActions();
  const stats = calculateOverallStats(semesters);

  return (
    <section aria-label="Academic overview" className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="group relative overflow-hidden rounded-2xl border-0 bg-[linear-gradient(135deg,hsl(var(--primary)),hsl(245_58%_52%))] text-primary-foreground shadow-lg shadow-primary/15">
        <div className="pointer-events-none absolute -right-8 -top-10 opacity-15 transition-transform duration-300 group-hover:scale-110">
          <GraduationCap className="h-36 w-36" strokeWidth={1.25} />
        </div>
        <CardContent className="relative flex min-h-[148px] flex-col justify-between p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary-foreground/75">Cumulative GPA</p>
            <span className="rounded-full bg-white/12 p-2 text-primary-foreground/80">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-end gap-2">
            <h2 className="font-display text-5xl font-extrabold leading-none tracking-[-0.05em]">
              {stats.cgpa.toFixed(2)}
            </h2>
            <span className="mb-1 text-sm text-primary-foreground/65">out of 4.00</span>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardContent className="flex min-h-[148px] items-center gap-4 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-500/12 text-sky-600 dark:text-sky-300">
            <BookMarked className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Total credits</p>
            <h2 className="mt-1 font-display text-4xl font-extrabold tracking-[-0.04em] text-foreground">
              {stats.totalCredits}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Weighted across your record</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border/80 bg-card/90 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <CardContent className="flex min-h-[148px] items-center justify-between gap-4 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-300">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Courses tracked</p>
              <h2 className="mt-1 font-display text-4xl font-extrabold tracking-[-0.04em] text-foreground">
                {stats.totalCourses}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {semesters.length} {semesters.length === 1 ? "semester" : "semesters"} recorded
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                title="Reset all data"
                aria-label="Reset all data"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl border-border bg-card text-foreground">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Reset your academic record?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  This permanently deletes all semesters, courses, and marks from this tracker. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Keep my data</AlertDialogCancel>
                <AlertDialogAction onClick={clearAll} className="bg-red-600 text-white hover:bg-red-700">
                  Yes, reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </section>
  );
}
