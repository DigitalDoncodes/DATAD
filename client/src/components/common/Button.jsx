import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const SIZE_CLASS = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-1.5',
  lg: 'px-5 py-2.5 text-sm gap-1.5',
};

const ICON_SIZE = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-4 w-4',
};

const VARIANTS = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:scale-[0.97]',
  secondary:
    'border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-700 dark:hover:bg-gray-800',
  ghost:
    'border-transparent bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
  success:
    'bg-success-600 text-white shadow-sm hover:bg-success-700 hover:shadow-md active:scale-[0.97]',
  danger:
    'bg-danger-600 text-white shadow-sm hover:bg-danger-700 hover:shadow-md active:scale-[0.97]',
};

const Button = forwardRef(function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  children,
  className = '',
}, ref) {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${SIZE_CLASS[size]} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading ? (
        <Loader2 className={`${ICON_SIZE[size]} animate-spin shrink-0`} />
      ) : Icon ? (
        <Icon className={`${ICON_SIZE[size]} shrink-0`} />
      ) : null}
      {children}
      {IconRight && !loading && (
        <IconRight className={`${ICON_SIZE[size]} shrink-0`} />
      )}
    </button>
  );
});

export default Button;
