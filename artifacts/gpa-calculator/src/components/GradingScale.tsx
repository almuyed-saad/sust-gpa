import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GRADING_SCALE = [
  { marks: "80 - 100", grade: "A+", points: "4.00", color: "text-emerald-700 bg-emerald-50" },
  { marks: "75 - 79", grade: "A", points: "3.75", color: "text-blue-700 bg-blue-50" },
  { marks: "70 - 74", grade: "A-", points: "3.50", color: "text-blue-700 bg-blue-50" },
  { marks: "65 - 69", grade: "B+", points: "3.25", color: "text-indigo-700 bg-indigo-50" },
  { marks: "60 - 64", grade: "B", points: "3.00", color: "text-indigo-700 bg-indigo-50" },
  { marks: "55 - 59", grade: "B-", points: "2.75", color: "text-indigo-700 bg-indigo-50" },
  { marks: "50 - 54", grade: "C+", points: "2.50", color: "text-amber-700 bg-amber-50" },
  { marks: "45 - 49", grade: "C", points: "2.25", color: "text-amber-700 bg-amber-50" },
  { marks: "40 - 44", grade: "D", points: "2.00", color: "text-orange-700 bg-orange-50" },
  { marks: "0 - 39", grade: "F", points: "0.00", color: "text-red-700 bg-red-50" },
];

export function GradingScale() {
  return (
    <Card className="shadow-sm border-slate-200 bg-white sticky top-6">
      <CardHeader className="pb-4 border-b border-slate-100">
        <CardTitle className="text-lg font-display text-slate-800">SUST Grading Scale</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-3 border-b">Marks</th>
                <th className="px-4 py-3 border-b text-center">Letter Grade</th>
                <th className="px-4 py-3 border-b text-right">Grade Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {GRADING_SCALE.map((row) => (
                <tr key={row.grade} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-2 text-slate-600 font-medium whitespace-nowrap">{row.marks}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${row.color}`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-700 font-semibold">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
