import { type TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({ label, error, id, className = '', ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`
          w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary
          placeholder:text-text-muted outline-none transition-colors focus:border-accent resize-none
          ${error ? 'border-status-delayed' : ''}
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
