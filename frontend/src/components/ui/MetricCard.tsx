import type { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: number;
  total: number;
  unit?: string;
  growth: number;
}

export default function MetricCard({ icon, iconBg, label, value, total, unit, growth }: MetricCardProps) {
  const isPositive = growth >= 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface p-5 shadow-sm">
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>

      <p className="text-sm text-text-secondary">{label}</p>

      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold text-text-primary">{value}</span>
        <span className="text-base text-text-secondary">
          /{total} {unit || ''}
        </span>
      </div>

      <div className="flex items-center gap-1 text-xs">
        <svg
          className={`h-3.5 w-3.5 ${isPositive ? 'text-status-completed' : 'text-status-delayed'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={isPositive ? 'M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25' : 'M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25'}
          />
        </svg>
        <span className="text-text-primary">
          {Math.abs(growth)}% {isPositive ? 'increase' : 'decrease'} from last month
        </span>
      </div>
    </div>
  );
}
