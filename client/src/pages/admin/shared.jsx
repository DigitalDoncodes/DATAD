import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const inputClass =
  'w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700';

// Common frame for every admin subpage: back link + title + icon.
export function AdminShell({ title, icon: Icon, subtitle, children }) {
  return (
    <div className="animate-in mx-auto max-w-4xl px-4 py-6">
      <Link
        to="/admin"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
      >
        <ArrowLeft className="h-4 w-4" /> Admin console
      </Link>
      <h1 className="mb-1 flex items-center gap-2 text-xl font-bold">
        <Icon className="h-5 w-5 text-indigo-500" /> {title}
      </h1>
      {subtitle && <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      {children}
    </div>
  );
}
