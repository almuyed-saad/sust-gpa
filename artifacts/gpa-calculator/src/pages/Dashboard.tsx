import React, { useEffect, useRef } from "react";
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

function GpaChart() {
  const semesters = useGpaStore(state => state.semesters);

  const chartData = semesters
    .map((s, idx) => ({
      name: s.name || `Sem ${idx + 1}`,
      gpa: calculateSemesterStats(s.courses).gpa
    }))
    .filter(d => d.gpa > 0);

  if (chartData.length < 2) return null;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-6">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">GPA Progression</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
            <YAxis domain={[0, 4.0]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white shadow-inner">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-none tracking-tight text-slate-900">SUST GPA Calculator</h1>
              <p className="text-xs font-medium text-slate-500">Grade & GPA Tracker</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            ) : isAuthenticated ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium">
                    <Cloud className="w-3.5 h-3.5" />
                    Synced
                  </div>
                  {user?.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt={displayName} className="w-7 h-7 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="font-medium text-slate-700">{displayName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50">
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Log out</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">
                  <CloudOff className="w-3.5 h-3.5" />
                  Local only
                </div>
                <Button size="sm" onClick={login} className="gap-1.5 bg-primary hover:bg-primary/90 text-white shadow-sm">
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
            className="mb-6 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <LogIn className="w-4 h-4 text-blue-600 shrink-0" />
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Log in to save your data.</span>{' '}
              Your progress is saved in the browser for now, but logging in syncs it to the cloud — accessible from any device.
            </p>
            <Button size="sm" variant="outline" onClick={login} className="ml-auto shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">
              Log in
            </Button>
          </motion.div>
        )}

        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Academic Record</h2>
              <Button
                onClick={addSemester}
                className="bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
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
                    className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"
                  >
                    <p className="text-slate-500 mb-4">No semesters yet. Add your first one!</p>
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
                  className="border-dashed border-slate-300 text-slate-500 hover:text-primary hover:border-primary hover:bg-primary/5 transition-all w-full md:w-auto"
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

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white">
              <Calculator className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-800">SUST GPA Calculator</span>
          </div>
          <p className="text-sm text-slate-500">
            Made by <span className="font-semibold text-slate-700">Saad</span> — Mathematics student at SUST, Bangladesh.
          </p>
          <p className="text-xs text-slate-400">
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
