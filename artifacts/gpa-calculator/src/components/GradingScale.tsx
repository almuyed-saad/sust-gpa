import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GRADING_SCALE = [
  { marks: "80 - 100", grade: "A+", points: "4.00", color: "text-emerald-500 bg-emerald-500/15 border-emerald-500/30" },
  { marks: "75 - 79",  grade: "A",  points: "3.75", color: "text-blue-500 bg-blue-500/15 border-blue-500/30" },
  { marks: "70 - 74",  grade: "A-", points: "3.50", color: "text-blue-500 bg-blue-500/15 border-blue-500/30" },
  { marks: "65 - 69",  grade: "B+", points: "3.25", color: "text-indigo-500 bg-indigo-500/15 border-indigo-500/30" },
  { marks: "60 - 64",  grade: "B",  points: "3.00", color: "text-indigo-500 bg-indigo-500/15 border-indigo-500/30" },
  { marks: "55 - 59",  grade: "B-", points: "2.75", color: "text-indigo-500 bg-indigo-500/15 border-indigo-500/30" },
  { marks: "50 - 54",  grade: "C+", points: "2.50", color: "text-amber-500 bg-amber-500/15 border-amber-500/30" },
  { marks: "45 - 49",  grade: "C",  points: "2.25", color: "text-amber-500 bg-amber-500/15 border-amber-500/30" },
  { marks: "40 - 44",  grade: "D",  points: "2.00", color: "text-orange-500 bg-orange-500/15 border-orange-500/30" },
  { marks: "0 - 39",   grade: "F",  points: "0.00", color: "text-red-500 bg-red-500/15 border-red-500/30" },
];

export function GradingScale() {
  return (
    <Card className="shadow-sm border-border bg-card sticky top-6">
      <CardHeader className="pb-4 border-b border-border">
        <CardTitle className="text-lg font-display text-foreground">SUST Grading Scale</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/60 text-muted-foreground font-medium">
              <tr>
                <th className="px-4 py-3 border-b border-border">Marks</th>
                <th className="px-4 py-3 border-b border-border text-center">Letter Grade</th>
                <th className="px-4 py-3 border-b border-border text-right">Grade Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {GRADING_SCALE.map((row) => (
                <tr key={row.grade} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground font-medium whitespace-nowrap">{row.marks}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${row.color}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-foreground font-semibold">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
