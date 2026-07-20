import { useState } from 'react';

export default function Tooltip({ label, children, side = 'top' }) {
  const [open, setOpen] = useState(false);
  if (!label) return children;

  const sideClass = side === 'bottom'
    ? 'top-full mt-1.5'
    : side === 'left'
    ? 'right-full mr-1.5 top-1/2 -translate-y-1/2'
    : 'bottom-full mb-1.5';

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`
            pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap z-50
            rounded-md bg-[var(--dax-text)] px-2 py-1 text-[11px] font-medium text-[var(--dax-bg)]
            shadow-[var(--dax-shadow-lift)] ${sideClass}
          `}
        >
          {label}
        </span>
      )}
    </span>
  );
}
