import { FileStack } from 'lucide-react';

// Generic "rich card" surface — reused by any future capability that
// returns structured content (a framework, a comparison, a plan) rather
// than being purpose-built for one task type.
export default function ArtifactCard({ artifact }) {
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-[var(--dax-border)] bg-[var(--dax-surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--dax-border)] px-4 py-2.5">
        <FileStack size={14} className="text-[var(--dax-accent)]" />
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--dax-text-muted)]">
          {artifact.kind}
        </span>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--dax-text)]">{artifact.title}</p>
        {artifact.summary && (
          <p className="mt-1 text-sm text-[var(--dax-text-muted)]">{artifact.summary}</p>
        )}
      </div>
      {artifact.actions?.length > 0 && (
        <div className="flex gap-2 border-t border-[var(--dax-border)] px-4 py-2">
          {artifact.actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className="rounded-lg px-2 py-1 text-xs font-medium text-[var(--dax-accent)] hover:bg-[var(--dax-accent-soft)]"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
