import { Sparkles } from 'lucide-react';

export default function Avatar({ role, name }) {
  if (role === 'assistant') {
    return (
      <span
        className="
          flex h-7 w-7 shrink-0 items-center justify-center rounded-full
          bg-[var(--dax-accent-soft)] text-[var(--dax-accent)]
        "
      >
        <Sparkles size={14} strokeWidth={2} />
      </span>
    );
  }
  const initial = (name || 'U').trim().charAt(0).toUpperCase();
  return (
    <span
      className="
        flex h-7 w-7 shrink-0 items-center justify-center rounded-full
        bg-[var(--dax-surface)] text-[var(--dax-text-muted)] text-xs font-semibold
        border border-[var(--dax-border)]
      "
    >
      {initial}
    </span>
  );
}
