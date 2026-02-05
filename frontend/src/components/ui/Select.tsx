import { type SelectHTMLAttributes, type ReactNode } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectBaseProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  placeholder?: string;
}

interface SelectWithOptions extends SelectBaseProps {
  options: SelectOption[];
  children?: never;
}

interface SelectWithChildren extends SelectBaseProps {
  options?: never;
  children: ReactNode;
}

type SelectProps = SelectWithOptions | SelectWithChildren;

export default function Select({ label, error, id, options, placeholder, className = '', children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`
          w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary
          outline-none transition-colors focus:border-accent cursor-pointer
          ${error ? 'border-status-delayed' : 'border-border'}
          ${className}
        `}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && (
        <p className="text-xs text-status-delayed">{error}</p>
      )}
    </div>
  );
}
