import { TrendingUp, TrendingDown } from 'lucide-react';

const isDown = (change) => typeof change === 'string' && change.trim().startsWith('-');

// Horizontal row of market indicators (Nifty, Sensex, …).
export default function MarketStrip({ indicators }) {
  if (!indicators?.length) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {indicators.map((ind, i) => {
        const down = isDown(ind.change);
        return (
          <div
            key={i}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200/80 bg-white px-3 py-2 dark:border-gray-800/80 dark:bg-gray-900"
          >
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-400">{ind.label}</p>
              <p className="text-sm font-bold tabular-nums">{ind.value}</p>
            </div>
            {ind.change && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  down ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                }`}
              >
                {down ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                {ind.change}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
