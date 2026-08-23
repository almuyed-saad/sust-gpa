import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import {
  ArrowUpRight,
  Calculator,
  ChartSpline,
  Check,
  ClipboardList,
  ChevronDown,
  Cloud,
  CloudOff,
  Flower2,
  GraduationCap,
  LogIn,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Waves,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/DashboardStats";
import { CloudSyncResolutionDialog } from "@/components/CloudSyncResolutionDialog";
import { DataPortability } from "@/components/DataPortability";
import { GpaGoalPlanner } from "@/components/GpaGoalPlanner";
import { GradingScale } from "@/components/GradingScale";
import { SemesterCard } from "@/components/SemesterCard";
import { useAuth, login, logout } from "@/hooks/useAuth";
import { useCloudSyncResolution } from "@/hooks/useCloudSyncResolution";
import { useGpaActions } from "@/hooks/useGpaActions";
import { calculateSemesterStats } from "@/lib/gpa-utils";
import { useGpaStore } from "@/lib/store";
import { THEMES, Theme, useTheme } from "@/lib/theme";

function ThemeIcon({ theme, className = "h-4 w-4" }: { theme: Theme; className?: string }) {
  if (theme === "dark") return <Moon className={className} />;
  if (theme === "ocean") return <Waves className={className} />;
  if (theme === "sunset") return <Flower2 className={className} />;
  return <Sun className={className} />;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = THEMES.find((item) => item.id === theme) ?? THEMES[0];
  const currentIndex = THEMES.findIndex((item) => item.id === theme);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const focusOption = (index: number) => {
    setOpen(true);
    window.setTimeout(() => optionRefs.current[index]?.focus(), 0);
  };

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            focusOption(currentIndex >= 0 ? currentIndex : 0);
          }
        }}
        className={`group inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-bold shadow-xs transition-all duration-200 hover:-translate-y-px hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${open ? "border-primary/40 bg-primary/5 text-primary shadow-sm" : "border-border/70 bg-card text-foreground"}`}
        aria-label={`Appearance: ${current.label}. Choose theme`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105" aria-hidden="true">
          <ThemeIcon theme={theme} className="h-3.5 w-3.5" />
        </span>
        <span className="hidden min-[420px]:inline text-muted-foreground">Theme</span>
        <span>{current.label}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 z-[100] mt-2 w-[min(250px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-xl shadow-slate-950/10 dark:shadow-black/30"
            role="menu"
            aria-label="Choose appearance theme"
          >
            <div className="mb-1 flex items-center gap-2 px-2.5 pb-2 pt-1">
              <div className="rounded-lg bg-primary/10 p-1.5 text-primary"><Palette className="h-3.5 w-3.5" /></div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-foreground">Appearance</p>
                <p className="text-[11px] text-muted-foreground">Personalize your workspace</p>
              </div>
            </div>
            <div className="space-y-1 border-t border-border/70 pt-2">
              {THEMES.map((item, index) => {
                const selected = theme === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(node) => { optionRefs.current[index] = node; }}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      setTheme(item.id);
                      setOpen(false);
                      triggerRef.current?.focus();
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        focusOption((index + 1) % THEMES.length);
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        focusOption((index - 1 + THEMES.length) % THEMES.length);
                      }
                      if (event.key === "Home") {
                        event.preventDefault();
                        focusOption(0);
                      }
                      if (event.key === "End") {
                        event.preventDefault();
                        focusOption(THEMES.length - 1);
                      }
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setTheme(item.id);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all duration-150 ${selected ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}
                  >
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${selected ? "border-primary/25 bg-background text-primary" : "border-border/70 bg-muted/55 text-muted-foreground"}`}>
                      <ThemeIcon theme={item.id} className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">{item.label}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{item.description}</span>
                    </span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
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
  const prefersReducedMotion = useReducedMotion();
  const { addSemester } = useGpaActions();
  const { conflict, isWorking: isSyncWorking, error: syncError, resolve } = useCloudSyncResolution();
  const { user, isAuthenticated, isLoading } = useAuth();
  const displayName = user?.firstName || user?.email?.split("@")[0] || "Student";


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
            <Link href="/transcript" className="transition-colors hover:text-foreground">Transcript</Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" aria-label="Loading account" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className={`hidden items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold sm:flex ${conflict ? "border-amber-500/25 bg-amber-500/8 text-amber-700 dark:text-amber-300" : "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"}`}>
                  {conflict ? <CloudOff className="h-3.5 w-3.5" /> : <Cloud className="h-3.5 w-3.5" />}
                  {conflict ? "Review sync" : "Synced"}
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

        {syncError && !conflict && (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-900 dark:text-amber-200" role="alert">
            <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{syncError}</span>
          </div>
        )}

        {!isAuthenticated && !isLoading && (
          <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.2 }} className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
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
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <DataPortability />
                <Link href="/transcript" className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground shadow-xs transition-colors hover:bg-muted sm:px-4 sm:text-sm">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Transcript
                </Link>
                <Button onClick={addSemester} className="h-11 rounded-xl px-4 shadow-md shadow-primary/15"><span className="mr-2 text-lg leading-none">+</span> Add semester</Button>
              </div>
            </div>

            <div className="space-y-5">
              <AnimatePresence mode="popLayout">
                {semesters.length === 0 ? (
                  <motion.div initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: prefersReducedMotion ? 0 : 0.2 }} className="rounded-2xl border border-dashed border-primary/30 bg-primary/[0.03] px-5 py-12 text-center sm:py-16">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><GraduationCap className="h-7 w-7" /></div>
                    <h3 className="mt-5 font-display text-lg font-bold text-foreground">Start your academic record</h3>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Create your first semester, add your courses, and let the tracker calculate the rest.</p>
                    <Button onClick={addSemester} variant="outline" className="mt-5 h-11 rounded-xl border-primary/30 text-primary hover:bg-primary/5">Create first semester</Button>
                  </motion.div>
                ) : (
                  semesters.map((semester) => (
                    <motion.div key={semester.id} layout={!prefersReducedMotion} initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.97 }} transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: [0.23, 1, 0.32, 1] }}>
                      <SemesterCard semester={semester} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {semesters.length > 0 && <div className="mt-5"><Button onClick={addSemester} variant="outline" className="h-11 w-full rounded-xl border-dashed border-primary/30 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary"><span className="mr-2 text-lg leading-none">+</span> Add another semester</Button></div>}
          </section>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <GpaGoalPlanner />
            <div id="grading-scale"><GradingScale /></div>
            <GpaChart />
          </aside>
        </div>
      </main>

      <CloudSyncResolutionDialog conflict={conflict} isWorking={isSyncWorking} error={syncError} onResolve={(choice) => { void resolve(choice); }} />

      <footer className="border-t border-border/70 bg-card/60">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-foreground"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Calculator className="h-3.5 w-3.5" /></div>SUST GPA</div>
          <p>Made by <a href="https://almuyed-saad.netlify.app/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Saad</a> · Mathematics student at SUST, Bangladesh.</p>
          <p className="text-xs">{conflict ? <span className="font-semibold text-amber-600 dark:text-amber-300">Sync choice needed</span> : isAuthenticated ? <span className="font-semibold text-emerald-600 dark:text-emerald-300">Cloud synced</span> : <span className="font-semibold text-amber-600 dark:text-amber-300">Browser-only mode</span>}</p>
        </div>
      </footer>
    </div>
  );
}
