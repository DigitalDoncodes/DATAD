import { Lightbulb, Target, Sparkles, Brain, ChevronRight } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: Lightbulb,
    label: 'Refine your resume summary',
    desc: 'Your opening statement could be more impact-driven.',
    action: 'Review resume',
    color: 'var(--dax-accent)',
  },
  {
    icon: Target,
    label: 'Interview prep check-in',
    desc: '3 questions practiced this week. Keep going.',
    action: 'Continue practice',
    color: '#6BCB8A',
  },
  {
    icon: Brain,
    label: 'New insight available',
    desc: 'Dax found a connection between your notes and recent research.',
    action: 'View insight',
    color: '#F0C060',
  },
];

export default function AIPresencePanel({ onAction, compact = false }) {
  const items = compact ? SUGGESTIONS.slice(0, 2) : SUGGESTIONS;

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--dax-text-faint)]">
        <Sparkles className="h-3 w-3" /> Dax suggests
      </p>
      {items.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onAction?.(s.action)}
          className="flex items-start gap-3 rounded-[var(--dax-radius-lg)] border border-[var(--dax-border)] bg-[var(--dax-surface)] p-3.5 w-full text-left cursor-pointer transition-all hover:border-[rgb(var(--dax-accent-rgb)/0.3)] group"
        >
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5"
            style={{ background: `${s.color}18`, color: s.color }}
          >
            <s.icon className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-[var(--dax-text)]">{s.label}</span>
            <span className="block text-xs text-[var(--dax-text-muted)] mt-0.5">{s.desc}</span>
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--dax-text-faint)] opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
        </button>
      ))}
    </div>
  );
}
