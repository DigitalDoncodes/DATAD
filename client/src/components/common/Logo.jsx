// Brand wordmark: "DATAD" with an indigo→blue gradient matching the brand identity.
export function DatadMark({ className = 'text-2xl' }) {
  return (
    <span
      className={`bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text font-extrabold leading-none tracking-tight text-transparent dark:from-indigo-400 dark:to-blue-400 ${className}`}
    >
      DATAD
    </span>
  );
}

export default function Logo({ size = 'md', showTagline = false }) {
  const mark = size === 'lg' ? 'text-4xl' : 'text-2xl';
  return (
    <span className="inline-flex flex-col items-center">
      <DatadMark className={mark} />
      {showTagline && (
        <span className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">
          Technology · Psychology · Impact
        </span>
      )}
    </span>
  );
}
