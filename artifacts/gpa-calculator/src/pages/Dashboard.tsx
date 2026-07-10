import React, { useEffect, useRef, useState } from "react";
import { Plus, Calculator, LogIn, LogOut, User, Cloud, CloudOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGpaStore } from "@/lib/store";
import { SemesterCard } from "@/components/SemesterCard";
import { DashboardStats } from "@/components/DashboardStats";
import { GradingScale } from "@/components/GradingScale";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateSemesterStats } from "@/lib/gpa-utils";
import { useAuth, login, logout } from "@/hooks/useAuth";
import { useGpaActions } from "@/hooks/useGpaActions";
import { api } from "@/lib/api";
import { useTheme, THEMES, Theme } from "@/lib/theme";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors shadow-xs"
        aria-label="Toggle theme"
      >
        <span className="text-base leading-none">{current.emoji}</span>
        <span className="hidden sm:inline">{current.label}</span>
        <svg className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-36 bg-card border border-border rounded-xl shadow-md overflow-hidden z-[100]"
          >
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id as Theme); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors
                  ${theme === t.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                  }`}
              >
                <span className="text-base">{t.emoji}</span>
                {t.label}
                {theme === t.id && (
                  <svg className="w-3.5 h-3.5 ml-auto text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GpaChart() {
  const semesters = useGpaStore(state => state.semesters);
  const { theme } = useTheme();

  const chartData = semesters
    .map((s, idx) => ({
      name: s.name || `Sem ${idx + 1}`,
      gpa: calculateSemesterStats(s.courses).gpa
    }))
    .filter(d => d.gpa > 0);

  if (chartData.length < 2) return null;

  const tickColor = theme === "dark" ? "#94a3b8" : "#64748b";

  return (
    <div className="bg-card p-6 rounded-xl border border-border shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">GPA Progression</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} dy={10} />
            <YAxis domain={[0, 4.0]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} dx={-10} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid hsl(var(--border))',
                backgroundColor: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: number) => [value.toFixed(2), 'GPA']}
            />
            <Area type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const semesters = useGpaStore((state) => state.semesters);
  const loadFromApi = useGpaStore((state) => state.loadFromApi);
  const { addSemester } = useGpaActions();
  const { user, isAuthenticated, isLoading } = useAuth();
  const loaded = useRef(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !loaded.current) {
      loaded.current = true;
      api.getSemesters().then(({ semesters }) => {
        loadFromApi(semesters.map(s => ({
          id: s.id,
          name: s.name,
          courses: s.courses.map(c => ({
            id: c.id,
            name: c.name,
            credits: c.credits,
            marks: c.marks ?? '',
            gradeLetter: c.gradeLetter ?? '',
          }))
        })));
      }).catch(console.error);
    }
  }, [isAuthenticated, isLoading, loadFromApi]);

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-tight text-foreground">SUST GPA Calculator</h1>
              <p className="text-xs font-medium text-muted-foreground">Grade & GPA Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth section */}
            {isLoading ? (
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md text-xs font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    Synced
                  </div>
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={displayName} className="w-7 h-7 rounded-full border border-border" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="font-medium text-foreground">{displayName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 text-muted-foreground hover:text-red-600 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-muted-foreground bg-muted px-2 py-1 rounded-md text-xs font-medium">
                  <CloudOff className="w-3.5 h-3.5" />
                  Local only
                </div>
                <Button size="sm" onClick={login} className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
                  <LogIn className="w-4 h-4" />
                  Log in to save
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full flex-1">
        {!isAuthenticated && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-primary/8 border border-primary/20 rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <LogIn className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Log in to save your data.</span>{' '}
              Your progress is saved in the browser for now, but logging in syncs it to the cloud — accessible from any device.
            </p>
            <Button size="sm" variant="outline" onClick={login} className="ml-auto shrink-0 border-primary/30 text-primary hover:bg-primary/10">
              Log in
            </Button>
          </motion.div>
        )}

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Academic Record</h2>
              <Button
                onClick={addSemester}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Semester
              </Button>
            </div>

            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {semesters.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 bg-card rounded-xl border border-dashed border-border"
                  >
                    <p className="text-muted-foreground mb-4">No semesters yet. Add your first one!</p>
                    <Button onClick={addSemester} variant="outline">Create your first semester</Button>
                  </motion.div>
                ) : (
                  semesters.map((semester) => (
                    <motion.div
                      key={semester.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <SemesterCard semester={semester} />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {semesters.length > 0 && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={addSemester}
                  variant="outline"
                  className="border-dashed text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all w-full md:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Semester
                </Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <GradingScale />
            <GpaChart />
          </div>
        </div>
      </main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-foreground">SUST GPA Calculator</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made by <span className="font-semibold text-foreground">Saad</span> — Mathematics student at SUST, Bangladesh.
          </p>
          <p className="text-xs text-muted-foreground">
            Bangladesh university grading scale · A+ = 4.00, F = 0.00 · Data is{' '}
            {isAuthenticated ? (
              <span className="text-emerald-600 font-medium">cloud-synced ✓</span>
            ) : (
              <span className="text-amber-600 font-medium">browser-only</span>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
