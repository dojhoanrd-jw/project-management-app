'use client';

import { type InputHTMLAttributes, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '../icons';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, id, type, className = '', ...props }: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={isPassword && showPassword ? 'text' : type}
          className={`
            w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text-primary
            placeholder:text-text-muted outline-none transition-colors
            ${error ? 'border-status-delayed' : 'border-border focus:border-accent'}
            ${isPassword ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-status-delayed">{error}</p>
      )}
    </div>
  );
}
