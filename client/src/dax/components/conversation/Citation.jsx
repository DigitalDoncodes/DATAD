export default function Citation({ citation, index }) {
  const inner = (
    <span
      className="
        inline-flex h-4 min-w-4 items-center justify-center rounded-full
        bg-[var(--dax-accent-soft)] px-1 text-[10px] font-medium text-[var(--dax-accent)]
      "
    >
      {index}
    </span>
  );
  if (citation.url) {
    return (
      <a href={citation.url} target="_blank" rel="noopener noreferrer" title={citation.label} className="mx-0.5 align-super">
        {inner}
      </a>
    );
  }
  return (
    <span title={citation.snippet || citation.label} className="mx-0.5 align-super">
      {inner}
    </span>
  );
}
