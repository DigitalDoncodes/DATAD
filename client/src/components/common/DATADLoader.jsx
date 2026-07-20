/**
 * DATADLoader — the uiverse "traveling gap" loader, adapted to the wordmark.
 *
 * The letters are always fully drawn. A single gap in each stroke chases
 * around its letterform, with an accent dot riding at the gap. This only
 * works on CLOSED paths, so every letter here is a closed loop:
 *   D  — naturally closed (bowl + stem)
 *   A  — closed triangle; the base doubles as the crossbar
 *   T  — a closed retrace tour: bar out, stem down, stem up, bar back
 * See index.css for the dasharray math that keeps each loop seamless.
 */
export default function DATADLoader({ width = 300, className = '', label = 'Loading' }) {
  return (
    <div className={`flex justify-center py-16 ${className}`} role="status">
      <div className="loader-datad" style={{ width }}>
        <svg viewBox="0 0 435 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path className="ld-d1" d="M 30,20 L 30,80 L 55,80 Q 75,80 75,50 Q 75,20 55,20 Z" />
          <path className="ld-a1" d="M 115,80 L 140,20 L 165,80 Z" />
          <path className="ld-t"  d="M 195,20 L 245,20 L 220,20 L 220,80 L 220,20 Z" />
          <path className="ld-a2" d="M 280,80 L 305,20 L 330,80 Z" />
          <path className="ld-d2" d="M 360,20 L 360,80 L 385,80 Q 405,80 405,50 Q 405,20 385,20 Z" />

          {/* Each dot follows its letter via offset-path; see the @supports guard. */}
          <circle className="ld-dot ld-dot-d1" r="4" />
          <circle className="ld-dot ld-dot-a1" r="4" />
          <circle className="ld-dot ld-dot-t"  r="4" />
          <circle className="ld-dot ld-dot-a2" r="4" />
          <circle className="ld-dot ld-dot-d2" r="4" />
        </svg>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
