import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Button from './Button';

export default function EmptyState({ icon: Icon, title, description, subtitle, cta, action }) {
  const desc = description || subtitle;
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      {Icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/20">
          <Icon className="h-8 w-8 text-primary-300 dark:text-primary-600" />
        </div>
      )}
      <div className="max-w-xs">
        <p className="font-semibold text-gray-700 dark:text-gray-200">{title}</p>
        {desc && (
          <p className="mt-1.5 text-sm leading-relaxed text-gray-400 dark:text-gray-500 text-balance">
            {desc}
          </p>
        )}
      </div>
      {cta && (
        cta.onClick ? (
          <Button onClick={cta.onClick} iconRight={ArrowRight}>
            {cta.label}
          </Button>
        ) : (
          <Link
            to={cta.to}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 hover:shadow-md active:scale-95 transition-all"
          >
            {cta.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )
      )}
      {action && (
        <Button onClick={action.onClick} icon={action.icon} iconRight={action.icon ? undefined : ArrowRight}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
