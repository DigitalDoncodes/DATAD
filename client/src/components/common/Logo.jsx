// Brand wordmark: D² (the "square" rendered as a superscript, per the logo)
// with an indigo→blue gradient matching the D Square Labs identity.
export function DSquareMark({ className = 'text-2xl' }) {
  return (
    <span
      className={`bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text font-extrabold leading-none text-transparent dark:from-indigo-400 dark:to-blue-400 ${className}`}
    >
      D²
    </span>
  );
}

export default function Logo({ size = 'md', showTagline = false }) {
  const mark = size === 'lg' ? 'text-5xl' : 'text-2xl';
  const word = size === 'lg' ? 'text-xl' : 'text-base';
  return (
    <span className="inline-flex flex-col items-center">
      <span className="inline-flex items-baseline gap-2">
        <DSquareMark className={mark} />
        <span className={`font-semibold tracking-wide ${word}`}>
          D Square <span className="text-indigo-500 dark:text-indigo-400">Labs</span>
        </span>
      </span>
      {showTagline && (
        <span className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gray-400">
          Technology · Psychology · Impact
        </span>
      )}
    </span>
  );
}
