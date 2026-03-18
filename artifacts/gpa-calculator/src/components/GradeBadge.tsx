import React from "react";
import { getGradeInfo } from "@/lib/gpa-utils";
import { Badge } from "@/components/ui/badge";

interface GradeBadgeProps {
  marks: number | '';
  type: 'grade' | 'points';
}

export function GradeBadge({ marks, type }: GradeBadgeProps) {
  const info = getGradeInfo(marks);

  if (type === 'grade') {
    return (
      <div className={`flex items-center justify-center w-10 h-8 rounded-md border text-sm font-semibold transition-colors ${info.colorClass}`}>
        {info.grade}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center w-14 h-8 rounded-md border text-sm font-semibold transition-colors bg-slate-50 text-slate-600 border-slate-200`}>
      {info.points !== null ? info.points.toFixed(2) : '-.--'}
    </div>
  );
}
