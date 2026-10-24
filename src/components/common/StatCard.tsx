import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  icon: LucideIcon;
  badge?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  badge,
  className
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-shadow hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tabular-nums tracking-tight">
              {value}
            </span>
            {badge && (
              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200/60 rounded px-1.5 py-0.5">
                {badge}
              </span>
            )}
          </div>

          {(subtitle || trend) && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              {trend && (
                <span
                  className={cn(
                    'font-medium',
                    trend.isPositive === true && 'text-emerald-600',
                    trend.isPositive === false && 'text-rose-600',
                    trend.isPositive === undefined && 'text-slate-600'
                  )}
                >
                  {trend.value}
                </span>
              )}
              {trend && subtitle && <span aria-hidden="true">·</span>}
              {subtitle && <span>{subtitle}</span>}
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-slate-700 shrink-0">
          <Icon className="w-5 h-5 text-blue-900" />
        </div>
      </div>
    </div>
  );
}
