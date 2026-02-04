const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-status-ongoing-bg', text: 'text-status-ongoing', label: 'On going' },
  on_track: { bg: 'bg-status-ongoing-bg', text: 'text-status-ongoing', label: 'On going' },
  in_progress: { bg: 'bg-status-ongoing-bg', text: 'text-status-ongoing', label: 'On going' },
  completed: { bg: 'bg-status-completed-bg', text: 'text-status-completed', label: 'Completed' },
  approved: { bg: 'bg-status-completed-bg', text: 'text-status-completed', label: 'Approved' },
  at_risk: { bg: 'bg-status-at-risk-bg', text: 'text-status-at-risk', label: 'At risk' },
  delayed: { bg: 'bg-status-delayed-bg', text: 'text-status-delayed', label: 'Delayed' },
  todo: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'To do' },
  paused: { bg: 'bg-status-review-bg', text: 'text-status-review', label: 'Paused' },
  in_review: { bg: 'bg-status-at-risk-bg', text: 'text-status-at-risk', label: 'In review' },
};

const FALLBACK = { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Unknown' };

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] || FALLBACK;

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text} ${className}`}>
      {style.label}
    </span>
  );
}
