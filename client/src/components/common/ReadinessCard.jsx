import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gauge, ArrowRight } from 'lucide-react';
import { getReadiness } from '../../api/readiness';

// Where each component's "fix it" action lives.
const COMPONENT_LINKS = {
  resume: '/resume',
  companies: '/companies',
  market: '/news',
  planner: '/planner',
};

const ringColor = (score) => {
  if (score >= 75) return 'stroke-emerald-500';
  if (score >= 45) return 'stroke-amber-500';
  return 'stroke-rose-500';
};

const barColor = (frac) => {
  if (frac >= 0.75) return 'bg-emerald-500';
  if (frac >= 0.4) return 'bg-amber-500';
  return 'bg-rose-500';
};

function Ring({ score }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const [offset, setOffset] = useState(C);

  useEffect(() => {
    // Animate the ring in after mount.
    const t = requestAnimationFrame(() =>
      setOffset(C - (Math.min(score, 100) / 100) * C)
    );
    return () => cancelAnimationFrame(t);
  }, [score, C]);

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" strokeWidth="9" className="stroke-gray-100 dark:stroke-gray-800" />
        <circle
          cx="50"
          cy="50"
          r={R}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          className={`${ringColor(score)} transition-[stroke-dashoffset] duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] text-gray-400">/ 100</span>
      </div>
    </div>
  );
}

export default function ReadinessCard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    getReadiness()
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const weakest = [...data.components]
    .filter((c) => c.hint)
    .sort((a, b) => a.points / a.max - b.points / b.max)[0];

  return (
    <div className="card-hover mb-4 rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <Gauge className="h-4 w-4 text-indigo-500" /> Placement readiness
      </h2>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Ring score={data.score} />

        <div className="min-w-0 flex-1 space-y-2.5">
          {data.components.map((c) => {
            const frac = c.max ? c.points / c.max : 0;
            return (
              <Link key={c.key} to={COMPONENT_LINKS[c.key] || '/'} className="group block">
                <div className="mb-0.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-600 group-hover:text-indigo-600 dark:text-gray-300 dark:group-hover:text-indigo-400">
                    {c.label}
                  </span>
                  <span className="tabular-nums text-gray-400">
                    {c.points}/{c.max}
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor(frac)}`}
                    style={{ width: `${Math.max(frac * 100, 2)}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Link
        to={weakest ? COMPONENT_LINKS[weakest.key] : '/companies'}
        className="mt-4 flex items-center justify-between rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
      >
        <span>👉 {data.nextAction}</span>
        <ArrowRight className="h-4 w-4 shrink-0" />
      </Link>
    </div>
  );
}
