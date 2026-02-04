import { type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`
          w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary
          placeholder:text-text-muted outline-none transition-colors
          ${error ? 'border-status-delayed' : 'border-border focus:border-accent'}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-status-delayed">{error}</p>
      )}
    </div>
  );
}
