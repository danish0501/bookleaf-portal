import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'brand' | 'emerald' | 'amber' | 'purple' | 'slate' | 'rose';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  color = 'brand',
  className,
}: StatCardProps) {
  const colorStyles = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className={cn('p-2.5 rounded-lg border', colorStyles[color])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  );
}
