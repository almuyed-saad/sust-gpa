import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Target, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useGpaStore } from "@/lib/store";
import { calculateOverallStats, getEffectivePoints } from "@/lib/gpa-utils";

const GOAL_STORAGE_KEY = "sust-gpa-target-cgpa";
const DEFAULT_TARGET = 3.5;
const DEFAULT_PLANNED_CREDITS = 15;

export function GpaGoalPlanner() {
  const semesters = useGpaStore((state) => state.semesters);
  const stats = useMemo(() => calculateOverallStats(semesters), [semesters]);
  const qualityPoints = useMemo(
    () => semesters.reduce((total, semester) => total + semester.courses.reduce((semesterTotal, course) => {
      const { points, credits } = getEffectivePoints(course);
      return points !== null && credits !== null ? semesterTotal + points * credits : semesterTotal;
    }, 0), 0),
    [semesters],
  );
  const [targetCgpa, setTargetCgpa] = useState(() => {
    try {
      const rawStored = localStorage.getItem(GOAL_STORAGE_KEY);
      if (rawStored === null) return DEFAULT_TARGET;
      const stored = Number(rawStored);
      return Number.isFinite(stored) && stored >= 0 && stored <= 4 ? stored : DEFAULT_TARGET;
    } catch {
      return DEFAULT_TARGET;
    }
  });
  const [plannedCredits, setPlannedCredits] = useState(DEFAULT_PLANNED_CREDITS);

  useEffect(() => {
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, String(targetCgpa));
    } catch {}
  }, [targetCgpa]);

  const requiredGpa = plannedCredits > 0
    ? (targetCgpa * (stats.totalCredits + plannedCredits) - qualityPoints) / plannedCredits
    : targetCgpa;
  const roundedRequired = Math.round(requiredGpa * 100) / 100;
  const isOnTrack = stats.totalCredits > 0 && stats.cgpa >= targetCgpa;
  const isAchievable = roundedRequired <= 4;
  const hasRecord = stats.totalCredits > 0;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/80 bg-card shadow-sm">
      <div className="border-b border-border/70 bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Plan ahead</p>
            <h3 className="mt-1 font-display text-lg font-bold text-foreground">GPA target planner</h3>
          </div>
          <div className="rounded-xl bg-primary/10 p-2 text-primary"><Target className="h-4 w-4" /></div>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">See the average you need in your next credits to reach a target CGPA.</p>
      </div>

      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="target-cgpa" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Target CGPA</label>
            <Input
              id="target-cgpa"
              type="number"
              min="0"
              max="4"
              step="0.01"
              value={targetCgpa}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (event.target.value === "") setTargetCgpa(0);
                else if (!Number.isNaN(value)) setTargetCgpa(Math.min(4, Math.max(0, value)));
              }}
              className="h-10 rounded-xl border-border/70 bg-background text-center font-display font-bold text-foreground"
            />
          </div>
          <div>
            <label htmlFor="planned-credits" className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Next credits</label>
            <Input
              id="planned-credits"
              type="number"
              min="1"
              max="60"
              step="1"
              value={plannedCredits}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isNaN(value) && value > 0) setPlannedCredits(Math.min(60, value));
              }}
              className="h-10 rounded-xl border-border/70 bg-background text-center font-display font-bold text-foreground"
            />
          </div>
        </div>

        <div className={`rounded-2xl border p-4 ${isOnTrack ? "border-emerald-500/25 bg-emerald-500/8" : isAchievable ? "border-primary/20 bg-primary/5" : "border-amber-500/25 bg-amber-500/8"}`}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-xl p-2 ${isOnTrack ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : isAchievable ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-700 dark:text-amber-300"}`}>
              {isOnTrack ? <CheckCircle2 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{isOnTrack ? "You are on track" : "Required average"}</p>
              <p className="mt-1 font-display text-3xl font-extrabold tracking-[-0.04em] text-foreground">
                {isOnTrack ? targetCgpa.toFixed(2) : `${Math.max(0, roundedRequired).toFixed(2)}`}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {isOnTrack
                  ? `Your current ${stats.cgpa.toFixed(2)} CGPA already meets this target.`
                  : !hasRecord
                    ? `Aim for ${targetCgpa.toFixed(2)} across your first ${plannedCredits} credits.`
                    : isAchievable
                      ? `Average GPA needed across your next ${plannedCredits} credits.`
                      : "This target cannot be reached in one planned term at a 4.00 maximum."}
              </p>
            </div>
          </div>
        </div>

        <p className="text-[11px] leading-4 text-muted-foreground">This planner is saved on this device and does not change your academic record.</p>
      </CardContent>
    </Card>
  );
}
