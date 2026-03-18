import React from "react";
import { Plus, Calculator } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useGpaStore } from "@/lib/store";
import { SemesterCard } from "@/components/SemesterCard";
import { DashboardStats } from "@/components/DashboardStats";
import { GradingScale } from "@/components/GradingScale";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { calculateSemesterStats } from "@/lib/gpa-utils";

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
      <h3 className="text-lg font-display font-semibold text-slate-800 mb-4">GPA Progression</h3>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
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
  const addSemester = useGpaStore((state) => state.addSemester);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white shadow-inner">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold leading-none tracking-tight text-slate-900">SUST Calculator</h1>
            <p className="text-xs font-medium text-slate-500">GPA & Grade Tracker</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold text-slate-800">Academic Record</h2>
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
                    <p className="text-slate-500 mb-4">No semesters added yet.</p>
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
    </div>
  );
}
