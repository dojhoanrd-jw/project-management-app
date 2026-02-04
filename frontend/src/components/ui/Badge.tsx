type BadgeVariant = 'completed' | 'ongoing' | 'at_risk' | 'delayed' | 'review' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  completed: 'bg-status-completed-bg text-status-completed',
  ongoing: 'bg-status-ongoing-bg text-status-ongoing',
  at_risk: 'bg-status-at-risk-bg text-status-at-risk',
  delayed: 'bg-status-delayed-bg text-status-delayed',
  review: 'bg-status-review-bg text-status-review',
  default: 'bg-border-light text-text-secondary',
};

export default function Badge({ variant = 'default', className = '', children }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
