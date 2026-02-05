import Spinner from './Spinner';

interface LoadingSpinnerProps {
  className?: string;
}

export default function LoadingSpinner({ className = 'py-16' }: LoadingSpinnerProps) {
  return (
    <div className={`flex justify-center ${className}`}>
      <Spinner className="h-8 w-8 text-accent" />
    </div>
  );
}
