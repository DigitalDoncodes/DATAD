import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const CONTACT = 'podapunakku846@gmail.com';

const mailto = (subject) => `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}`;

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 py-6 print:hidden dark:border-gray-800">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 text-xs text-gray-400">
        <Link
          to="/support"
          className="inline-flex items-center gap-1.5 font-medium text-gray-500 hover:text-rose-500 dark:text-gray-400"
        >
          <Heart className="h-3.5 w-3.5 text-rose-500" /> Enjoying the platform? Support development
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          <a href={mailto('D Square Labs — Feedback')} className="hover:text-gray-600 dark:hover:text-gray-300">Feedback</a>
          <a href={mailto('D Square Labs — Bug report')} className="hover:text-gray-600 dark:hover:text-gray-300">Report a bug</a>
          <a href={mailto('D Square Labs — Feature suggestion')} className="hover:text-gray-600 dark:hover:text-gray-300">Suggest a feature</a>
          <a href="https://github.com/DigitalDoncodes" target="_blank" rel="noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300">GitHub</a>
        </nav>
        <p>
          D² Labs · Built by Dhatchinamoorthi · Technology × Psychology × Impact
        </p>
      </div>
    </footer>
  );
}
