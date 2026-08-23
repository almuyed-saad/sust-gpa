import React, { useMemo } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Cloud, GraduationCap, Printer, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { CloudSyncResolutionDialog } from "@/components/CloudSyncResolutionDialog";
import { useAuth } from "@/hooks/useAuth";
import { useCloudSyncResolution } from "@/hooks/useCloudSyncResolution";
import { calculateOverallStats, calculateSemesterStats, getGradeInfo } from "@/lib/gpa-utils";
import { useGpaStore } from "@/lib/store";

export default function Transcript() {
  const semesters = useGpaStore((state) => state.semesters);
  const { user, isAuthenticated } = useAuth();
  const { conflict, isWorking: isSyncWorking, error: syncError, resolve } = useCloudSyncResolution();
  const stats = useMemo(() => calculateOverallStats(semesters), [semesters]);
  const displayName = user?.firstName || user?.email?.split("@")[0] || "Student";
  const generatedDate = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date());


  const printableSemesters = semesters.map((semester) => ({
    ...semester,
    courses: semester.courses.filter((course) => course.name.trim() || course.marks !== "" || course.gradeLetter),
    stats: calculateSemesterStats(semester.courses),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="print-hidden border-b border-border/70 bg-background/90 shadow-xs backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[1000px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <Button onClick={() => window.print()} className="h-10 rounded-xl px-4 shadow-md shadow-primary/15">
            <Printer className="mr-2 h-4 w-4" />
            Print summary
          </Button>
        </div>
      </div>

      <CloudSyncResolutionDialog conflict={conflict} isWorking={isSyncWorking} error={syncError} onResolve={(choice) => { void resolve(choice); }} />

      {syncError && !conflict && (
        <div className="mx-auto mt-4 flex max-w-[1000px] items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-900 dark:text-amber-200" role="alert">
          <Cloud className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{syncError}</span>
        </div>
      )}

      <main className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 sm:py-12">
        <article className="transcript-page overflow-hidden rounded-2xl border border-border/80 bg-card shadow-lg shadow-slate-950/5 print:rounded-none print:border-0 print:shadow-none">
          <header className="relative overflow-hidden border-b border-border/70 bg-[linear-gradient(120deg,hsl(var(--primary)),hsl(245_58%_52%))] px-6 py-8 text-primary-foreground sm:px-10 sm:py-10">
            <div className="pointer-events-none absolute -right-10 -top-16 opacity-10"><GraduationCap className="h-60 w-60" strokeWidth={1} /></div>
            <div className="relative z-10 flex flex-col gap-7 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><GraduationCap className="h-6 w-6" /></div>
                  <div>
                    <p className="font-display text-xl font-extrabold tracking-tight">SUST GPA</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-foreground/70">Academic record</p>
                  </div>
                </div>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/70">Unofficial academic overview</p>
                <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Transcript summary</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-primary-foreground/75">A clear, printable view of your semester results, credits, grades, and cumulative performance.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm backdrop-blur-sm sm:min-w-52">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground/60">Prepared for</p>
                <p className="mt-1 truncate font-bold">{displayName}</p>
                {user?.email && <p className="mt-0.5 truncate text-xs text-primary-foreground/70">{user.email}</p>}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-primary-foreground/65"><CalendarDays className="h-3.5 w-3.5" /> {generatedDate}</p>
              </div>
            </div>
          </header>

          <div className="px-6 py-7 sm:px-10 sm:py-9">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryMetric label="Cumulative GPA" value={stats.cgpa.toFixed(2)} accent />
              <SummaryMetric label="Total credits" value={String(stats.totalCredits)} />
              <SummaryMetric label="Courses completed" value={String(stats.totalCourses)} />
              <SummaryMetric label="Semesters" value={String(semesters.length)} />
            </div>

            <div className="mt-9 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Academic history</p>
                <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground">Semester results</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                {isAuthenticated ? <><Cloud className="h-3.5 w-3.5 text-emerald-600" /> Cloud-synced record</> : <><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Browser record</>}
              </div>
            </div>

            {printableSemesters.length === 0 || printableSemesters.every((semester) => semester.courses.length === 0) ? (
              <div className="py-14 text-center text-sm text-muted-foreground">No course results have been recorded yet.</div>
            ) : (
              <div className="mt-6 space-y-8">
                {printableSemesters.map((semester) => (
                  <section key={semester.id} className="transcript-semester break-inside-avoid overflow-hidden rounded-2xl border border-border/80">
                    <div className="flex flex-col gap-3 border-b border-border/70 bg-muted/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                      <div>
                        <h3 className="font-display text-base font-extrabold text-foreground sm:text-lg">{semester.name}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          <span>{semester.courses.length} {semester.courses.length === 1 ? "course" : "courses"} recorded</span>
                          <span className="text-border">·</span>
                          <span>{semester.academicYear || "Academic year not set"} · Term {semester.termNumber}</span>
                        </p>
                        {semester.notes && <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{semester.notes}</p>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold sm:justify-end">
                        <span className={`rounded-lg border px-3 py-2 ${semester.status === "completed" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>{semester.status === "completed" ? "Completed" : "In progress"}</span>
                        <span className="rounded-lg border border-border bg-card px-3 py-2 text-muted-foreground">{semester.stats.totalCredits} credits</span>
                        <span className="rounded-lg border border-primary/20 bg-primary/8 px-3 py-2 text-primary">GPA {semester.stats.gpa.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[560px] border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border/70 bg-card text-left text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                            <th className="px-4 py-3 font-bold sm:px-5">Course</th>
                            <th className="px-3 py-3 text-center font-bold">Credits</th>
                            <th className="px-3 py-3 text-center font-bold">Marks</th>
                            <th className="px-3 py-3 text-center font-bold">Grade</th>
                            <th className="px-4 py-3 text-right font-bold sm:px-5">GP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {semester.courses.length > 0 ? semester.courses.map((course) => {
                            const gradeInfo = getGradeInfo(course.marks, course.gradeLetter || undefined);
                            return (
                              <tr key={course.id} className="border-b border-border/60 last:border-0">
                                <td className="max-w-[300px] truncate px-4 py-3.5 font-semibold text-foreground sm:px-5">{course.name || "Unnamed course"}</td>
                                <td className="px-3 py-3.5 text-center text-muted-foreground">{course.credits || "—"}</td>
                                <td className="px-3 py-3.5 text-center text-muted-foreground">{course.marks === "" ? "—" : course.marks}</td>
                                <td className="px-3 py-3.5 text-center"><span className={`inline-flex min-w-10 justify-center rounded-md border px-2 py-1 text-xs font-extrabold ${gradeInfo.points === null ? "border-border bg-muted text-muted-foreground" : gradeInfo.colorClass}`}>{gradeInfo.grade}</span></td>
                                <td className="px-4 py-3.5 text-right font-extrabold text-foreground sm:px-5">{gradeInfo.points === null ? "—" : gradeInfo.points.toFixed(2)}</td>
                              </tr>
                            );
                          }) : (
                            <tr><td colSpan={5} className="px-4 py-5 text-center text-xs text-muted-foreground">No completed courses in this semester.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            )}

            <div className="mt-9 grid gap-4 border-t border-border pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Record note</p>
                <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">This summary is generated from the records currently stored in SUST GPA. Confirm official results with your university transcript when needed.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /> GPA calculated using the SUST scale</div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}

function SummaryMetric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? "border-primary/25 bg-primary/5" : "border-border/80 bg-muted/20"}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold tracking-[-0.04em] ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
