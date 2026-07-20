export default function Kbd({ children }) {
  return (
    <kbd
      className="
        inline-flex items-center justify-center rounded border
        border-[var(--dax-border)] bg-[var(--dax-surface)] px-1.5 py-0.5
        text-[10px] font-medium text-[var(--dax-text-muted)]
      "
    >
      {children}
    </kbd>
  );
}
