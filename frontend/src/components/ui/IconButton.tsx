import { memo, type ButtonHTMLAttributes, type ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
}

export default memo(function IconButton({ icon, label, className = '', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm text-text-secondary transition-colors hover:bg-surface-hover cursor-pointer ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
});
