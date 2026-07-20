import { useSearchParams } from 'react-router-dom';

/**
 * Pill toggle for merged pages (e.g. Work = Assignments | Projects).
 * Syncs to ?view= so merged views stay linkable and back-button friendly.
 * Returns { active, switcher } — render `switcher` above the active view.
 */
export default function useViewSwitch(views, defaultView) {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('view') || defaultView;

  const switcher = (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4">
      <div className="inline-flex rounded-full border border-gray-200 p-1 dark:border-gray-800">
        {views.map((v) => (
          <button
            key={v.key}
            onClick={() => setSearchParams(v.key === defaultView ? {} : { view: v.key }, { replace: true })}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              active === v.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );

  return { active, switcher };
}
