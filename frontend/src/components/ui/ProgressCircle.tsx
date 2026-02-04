interface ProgressCircleProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
}

function getColor(percent: number): string {
  if (percent >= 75) return 'var(--color-status-completed)';
  if (percent >= 50) return 'var(--color-status-ongoing)';
  if (percent >= 25) return 'var(--color-status-at-risk)';
  return 'var(--color-status-delayed)';
}

export default function ProgressCircle({ percent, size = 40, strokeWidth = 3 }: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border-light)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percent)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold text-text-primary">{percent}%</span>
    </div>
  );
}
