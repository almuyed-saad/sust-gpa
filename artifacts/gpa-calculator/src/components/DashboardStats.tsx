import React from "react";
import { GraduationCap, BookOpen, BookMarked, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGpaStore } from "@/lib/store";
import { calculateOverallStats } from "@/lib/gpa-utils";
import { useGpaActions } from "@/hooks/useGpaActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export function DashboardStats() {
  const semesters = useGpaStore((state) => state.semesters);
  const { clearAll } = useGpaActions();
  const stats = calculateOverallStats(semesters);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* CGPA card — gradient stays vivid, uses primary-foreground text */}
      <Card className="relative overflow-hidden border-none shadow-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <GraduationCap className="w-32 h-32" />
        </div>
        <CardContent className="p-6 relative z-10">
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">Cumulative GPA</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-display font-bold">{stats.cgpa.toFixed(2)}</h2>
            <span className="text-primary-foreground/60 text-sm">/ 4.00</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Credits */}
      <Card className="shadow-sm border-border bg-card">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <p className="text-muted-foreground text-sm font-medium mb-1">Total Credits</p>
            <h2 className="text-3xl font-display font-bold text-foreground">{stats.totalCredits}</h2>
          </div>
        </CardContent>
      </Card>

      {/* Total Courses */}
      <Card className="shadow-sm border-border bg-card">
        <CardContent className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-500">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">Total Courses</p>
              <h2 className="text-3xl font-display font-bold text-foreground">{stats.totalCourses}</h2>
            </div>
          </div>

          <div className="ml-auto">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10" title="Reset All Data">
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border text-foreground">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Reset all data?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will permanently delete all your semesters, courses, and marks. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAll} className="bg-red-600 hover:bg-red-700 text-white">
                    Yes, reset all data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
