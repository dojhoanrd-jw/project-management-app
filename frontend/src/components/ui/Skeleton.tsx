interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = 'h-36' }: SkeletonProps) {
  return <div className={`animate-pulse rounded-2xl bg-surface ${className}`} />;
}
