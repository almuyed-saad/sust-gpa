import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Calculator,
  ChartSpline,
  Cloud,
  CloudOff,
  GraduationCap,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/DashboardStats";
import { GradingScale } from "@/components/GradingScale";
import { SemesterCard } from "@/components/SemesterCard";
import { useAuth, login, logout } from "@/hooks/useAuth";
import { useGpaActions } from "@/hooks/useGpaActions";
import { api } from "@/lib/api";
import { calculateSemesterStats } from "@/lib/gpa-utils";
import { useGpaStore } from "@/lib/store";
import { THEMES, Theme, useTheme } from "@/lib/theme";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEMES.find((item) => item.id === theme) ?? THEMES[0];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-border/70 bg-card px-3 text-sm font-semibold text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Choose appearance theme"
        aria-expanded={open}
      >
        <span className="text-base leading-none" aria-hidden="true">{current.emoji}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 z-[100] mt-2 w-40 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-lg"
          >
            {THEMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTheme(item.id as Theme);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${theme === item.id ? "bg-primary/10 font-bold text-primary" : "text-foreground hover:bg-muted"}`}
              >
                <span className="text-base" aria-hidden="true">{item.emoji}</span>
                {item.label}
                {theme === item.id && <span className="ml-auto text-xs">✓</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GpaChart() {
  const semesters = useGpaStore((state) => state.semesters);
  const { theme } = useTheme();
  const chartData = semesters
    .map((semester, index) => ({
      name: semester.name || `Sem ${index + 1}`,
      gpa: calculateSemesterStats(semester.courses).gpa,
    }))
    .filter((item) => item.gpa > 0);

  if (chartData.length < 2) return null;
  const tickColor = theme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-6" aria-labelledby="progress-heading">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Momentum</p>
          <h3 id="progress-heading" className="mt-1 font-display text-lg font-bold text-foreground">GPA progression</h3>
        </div>
        <div className="rounded-xl bg-primary/10 p-2 text-primary"><ChartSpline className="h-4 w-4" /></div>
      </div>
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor }} dy={10} />
            <YAxis domain={[0, 4]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: tickColor }} dx={-10} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", boxShadow: "0 10px 25px -10px rgb(15 23 42 / 0.2)" }}
              formatter={(value: number) => [value.toFixed(2), "GPA"]}
            />
            <Area type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const semesters = useGpaStore((state) => state.semesters);
  const loadFromApi = useGpaStore((state) => state.loadFromApi);
  const { addSemester } = useGpaActions();
  const { user, isAuthenticated, isLoading } = useAuth();
  const loaded = useRef(false);
  const displayName = user?.firstName || user?.email?.split("@")[0] || "Student";

  useEffect(() => {
    if (!isLoading && isAuthenticated && !loaded.current) {
      loaded.current = true;
      api.getSemesters()
        .then(({ semesters: remoteSemesters }) => {
          loadFromApi(remoteSemesters.map((semester) => ({
            id: semester.id,
            name: semester.name,
            courses: semester.courses.map((course) => ({
              id: course.id,
              name: course.name,
              credits: course.credits,
              marks: course.marks ?? "",
              gradeLetter: course.gradeLetter ?? "",
            })),
          })));
        })
        .catch(console.error);
    }
  }, [isAuthenticated, isLoading, loadFromApi]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 shadow-xs backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <Calculator className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-extrabold tracking-tight text-foreground sm:text-lg">SUST GPA</p>
              <p className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground sm:block">Academic tracker</p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Dashboard sections">
            <a href="#record" className="transition-colors hover:text-foreground">Academic record</a>
            <a href="#grading-scale" className="transition-colors hover:text-foreground">Grading scale</a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" aria-label="Loading account" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 sm:flex">
                  <Cloud className="h-3.5 w-3.5" />
                  Synced
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  {user?.profileImageUrl ? <img src={user.profileImageUrl} alt={displayName} className="h-9 w-9 rounded-xl border border-border object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><User className="h-4 w-4" /></div>}
                  <span className="max-w-28 truncate text-sm font-semibold text-foreground">{displayName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="h-10 rounded-xl px-3 text-muted-foreground hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30">
                  <LogOut className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground sm:flex"><CloudOff className="h-3.5 w-3.5" /> Local only</div>
                <Button size="sm" onClick={login} className="h-10 rounded-xl px-3 shadow-md shadow-primary/15"><LogIn className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline">Log in to sync</span><span className="sm:hidden">Log in</span></Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <section className="relative mb-8 overflow-hidden rounded-[1.75rem] bg-[linear-gradient(120deg,hsl(var(--primary)/0.98),hsl(245_58%_52%/0.93))] px-5 py-7 text-primary-foreground shadow-xl shadow-primary/15 sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-16 -top-20 opacity-10"><GraduationCap className="h-64 w-64" strokeWidth={1} /></div>
          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary-foreground/85">
              <Sparkles className="h-3.5 w-3.5" /> Built for SUST students
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-5xl">Your academic progress, made clear.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/75 sm:text-base">Track semester results, calculate your CGPA, and keep your academic record ready wherever you study.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#record" className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-primary shadow-sm transition-transform active:scale-[0.98] hover:bg-white/90">Open academic record <ArrowUpRight className="h-4 w-4" /></a>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary-foreground/70"><ShieldCheck className="h-4 w-4" /> Autosaves as you edit</div>
            </div>
          </div>
        </section>

        {!isAuthenticated && !isLoading && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300"><CloudOff className="h-4 w-4" /></div>
            <p className="text-sm leading-5 text-foreground"><span className="font-bold">You’re in local mode.</span> Your progress stays in this browser. Sign in to sync it across devices.</p>
            <Button size="sm" variant="outline" onClick={login} className="rounded-xl border-amber-500/30 text-amber-800 hover:bg-amber-500/10 dark:text-amber-200 sm:ml-auto">Sign in to sync</Button>
          </motion.div>
        )}

        <DashboardStats />

        <div id="record" className="mt-10 grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-labelledby="record-heading" className="min-w-0">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Organize your journey</p>
                <h2 id="record-heading" className="mt-1 font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Academic record</h2>
                <p className="mt-1 text-sm text-muted-foreground">Add semesters and enter course results as they become available.</p>
              </div>
              <Button onClick={addSemester} className="h-11 rounded-xl px-4 shadow-md shadow-primary/15"><span className="mr-2 text-lg leading-none">+</span> Add semester</Button>
            </div>

            <div className="space-y-5">
              <AnimatePresence mode="popLayout">
                {semesters.length === 0 ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] px-5 py-12 text-center sm:py-16">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7" /></div>
                    <h3 className="mt-5 font-display text-lg font-bold text-foreground">Start your academic record</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create your first semester, add your courses, and let the tracker calculate the rest.</p>
                    <Button onClick={addSemester} variant="outline" className="mt-5 h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/5">Create first semester</Button>
                  </motion.div>
                ) : (
                  semesters.map((semester) => (
                    <motion.div key={semester.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}>
                      <SemesterCard semester={semester} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {semesters.length > 0 && <div className="mt-5"><Button onClick={addSemester} variant="outline" className="h-11 w-full rounded-xl border-dashed border-primary/30 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"><span className="mr-2 text-lg leading-none">+</span> Add another semester</Button></div>}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div id="grading-scale"><GradingScale /></div>
            <GpaChart />
          </aside>
        </div>
      </main>

      <footer className="border-t border-border/70 bg-card/60">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-foreground"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Calculator className="h-3.5 w-3.5" /></div>SUST GPA</div>
          <p>Made by <a href="https://almuyed-saad.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Saad</a> · Mathematics student at SUST, Bangladesh.</p>
          <p className="text-xs">{isAuthenticated ? <span className="font-semibold text-emerald-600 dark:text-emerald-300">Cloud synced</span> : <span className="font-semibold text-amber-600 dark:text-amber-300">Browser-only mode</span>}</p>
        </div>
      </footer>
    </div>
  );
}
