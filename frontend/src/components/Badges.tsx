import React from 'react';
import { ShieldAlert, ShieldCheck, ShieldAlert as ShieldWarning } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface GradeBadgeProps {
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  label,
  size = 'md',
}) => {
  const configs: Record<string, { bg: string; dot: string; text: string }> = {
    A: {
      bg: 'bg-emerald-950/80 border-emerald-700 text-emerald-200',
      dot: 'bg-emerald-400',
      text: 'Grade A (54–60)',
    },
    B: {
      bg: 'bg-blue-950/80 border-blue-700 text-blue-200',
      dot: 'bg-blue-400',
      text: 'Grade B (48–<54)',
    },
    C: {
      bg: 'bg-amber-950/80 border-amber-700 text-amber-200',
      dot: 'bg-amber-400',
      text: 'Grade C (36–<48)',
    },
    D: {
      bg: 'bg-orange-950/80 border-orange-700 text-orange-200',
      dot: 'bg-orange-400',
      text: 'Grade D (30–<36)',
    },
    F: {
      bg: 'bg-rose-950/80 border-rose-700 text-rose-200',
      dot: 'bg-rose-400',
      text: 'Grade F (0–<30)',
    },
  };

  const current = configs[grade] || configs.C;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-bold',
    lg: 'px-3.5 py-1.5 text-sm font-extrabold',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border shadow-sm ${current.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <span className="font-extrabold tracking-wide">Grade {grade}</span>
      {label && <span className="opacity-80 font-normal text-[11px]">• {label}</span>}
    </span>
  );
};

interface PerformanceBadgeProps {
  category: string;
  percentage?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PerformanceBadge: React.FC<PerformanceBadgeProps> = ({
  category,
  percentage,
  size = 'md',
}) => {
  const configs: Record<string, { bg: string; dot: string }> = {
    'High Honors': {
      bg: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300',
      dot: 'bg-emerald-400',
    },
    'Very Good': {
      bg: 'bg-blue-950/70 border-blue-800/80 text-blue-300',
      dot: 'bg-blue-400',
    },
    Satisfactory: {
      bg: 'bg-amber-950/70 border-amber-800/80 text-amber-300',
      dot: 'bg-amber-400',
    },
    'Marginal Pass': {
      bg: 'bg-orange-950/70 border-orange-800/80 text-orange-300',
      dot: 'bg-orange-400',
    },
    Failing: {
      bg: 'bg-rose-950/70 border-rose-800/80 text-rose-300',
      dot: 'bg-rose-400',
    },
  };

  const current = configs[category] || configs.Satisfactory;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm font-semibold',
    lg: 'px-4 py-1.5 text-base font-bold',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border ${current.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-2 h-2 rounded-full ${current.dot}`} />
      <span>{category}</span>
      {percentage !== undefined && (
        <span className="opacity-80 font-normal text-xs">({percentage}%)</span>
      )}
    </span>
  );
};

interface RiskBadgeProps {
  level: 'High Risk' | 'Medium Risk' | 'Low Risk';
  flagsCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  flagsCount,
  size = 'md',
}) => {
  const configs = {
    'Low Risk': {
      bg: 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
    },
    'Medium Risk': {
      bg: 'bg-amber-950/70 border-amber-800/80 text-amber-300',
      icon: ShieldWarning,
      iconColor: 'text-amber-400',
    },
    'High Risk': {
      bg: 'bg-rose-950/70 border-rose-800/80 text-rose-300',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
  };

  const current = configs[level] || configs['Low Risk'];
  const Icon = current.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm font-semibold',
    lg: 'px-4 py-2 text-base font-bold',
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 rounded-full border ${current.bg} ${sizeClasses[size]}`}
    >
      <Icon className={`w-4 h-4 ${current.iconColor}`} />
      <span>{level}</span>
      {flagsCount !== undefined && flagsCount > 0 && (
        <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-xs font-bold border border-slate-700">
          {flagsCount} {flagsCount === 1 ? 'flag' : 'flags'}
        </span>
      )}
    </span>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'purple';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeColor = 'blue',
}) => {
  const badgeClasses = {
    blue: 'bg-blue-950 text-blue-300 border border-blue-800/80',
    green: 'bg-emerald-950 text-emerald-300 border border-emerald-800/80',
    amber: 'bg-amber-950 text-amber-300 border border-amber-800/80',
    purple: 'bg-purple-950 text-purple-300 border border-purple-800/80',
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-primary-400">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline space-x-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        {badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClasses[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
