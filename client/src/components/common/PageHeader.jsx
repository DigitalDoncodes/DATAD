// Shared page header used by every module page.
// Keeps title, subtitle, and primary action visually consistent
// so the product feels designed together rather than assembled.
import { Sparkles } from 'lucide-react';
import Button from './Button';

export default function PageHeader({
  icon: Icon,
  title,
  subtitle,
  action,         // { label, onClick | href, icon: ActionIcon } or JSX
  insight,        // string — a one-line insight from Dax, shown as a soft pill
  className = '',
}) {
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight text-balance">
            {Icon && <Icon className="h-6 w-6 shrink-0 text-primary-500" />}
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-base text-gray-500 dark:text-gray-400 text-balance">
              {subtitle}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0">
            {typeof action === 'object' && action.label ? (
              <Button onClick={action.onClick} icon={action.icon}>
                {action.label}
              </Button>
            ) : action}
          </div>
        )}
      </div>
      {insight && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-800/60 dark:bg-primary-900/30 dark:text-primary-300">
          <Sparkles className="h-3 w-3 shrink-0" />
          {insight}
        </div>
      )}
    </div>
  );
}
