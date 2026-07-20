import { forwardRef } from 'react';

const SIZE_CLASS = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-10 w-10',
};

const ICON_SIZE = {
  sm: 15,
  md: 17,
  lg: 19,
};

const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, size = 'md', active = false, disabled = false, className = '', onClick, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-full transition-colors
        ${SIZE_CLASS[size]}
        ${active
          ? 'bg-[var(--dax-accent-soft)] text-[var(--dax-accent)]'
          : 'text-[var(--dax-text-muted)] hover:bg-[var(--dax-surface-hover)] hover:text-[var(--dax-text)]'}
        ${disabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
        ${className}
      `}
      {...rest}
    >
      {Icon && <Icon size={ICON_SIZE[size]} strokeWidth={1.9} />}
    </button>
  );
});

export default IconButton;
