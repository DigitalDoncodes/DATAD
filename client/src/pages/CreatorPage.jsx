import { Link } from 'react-router-dom';
import { ExternalLink, GraduationCap, Heart, Mail, Phone, Sparkles, Brain, Code2 } from 'lucide-react';
import Logo, { DSquareMark } from '../components/common/Logo';

// Public page — reachable without an account.
const PILLARS = [
  {
    icon: Code2,
    title: 'Technology',
    desc: 'Self-taught builder shipping real products — this platform is designed, built and run end to end.',
  },
  {
    icon: Brain,
    title: 'Psychology',
    desc: 'Rooted in a psychology background from KCLAS — building tools that understand how students actually think and work.',
  },
  {
    icon: Sparkles,
    title: 'Impact',
    desc: 'Everything here exists to make campus life measurably better: notes, placements, memories, money and more.',
  },
];

export default function CreatorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-baseline gap-1.5 font-semibold">
            <DSquareMark />
            <span className="text-indigo-500 dark:text-indigo-400">Labs</span>
          </Link>
          <Link
            to="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 py-14 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 text-4xl font-extrabold text-white shadow-lg">
            DM
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-500">
            Founder & Creator
          </p>
          <h1 className="mt-2 text-4xl font-bold">Dhatchina Moorthi</h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-500 dark:text-gray-400">
            MBA student, psychology graduate and independent builder. Created{' '}
            <span className="font-semibold text-gray-700 dark:text-gray-200">D² Labs</span> — a
            Student Operating System that gives his batch one place for notes, memories,
            planning, personal finance, resumes and placements.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:digitaldoncodes@gmail.com"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Mail className="h-4 w-4 text-indigo-500" /> digitaldoncodes@gmail.com
            </a>
            <a
              href="tel:+919363632214"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <Phone className="h-4 w-4 text-indigo-500" /> +91 93636 32214
            </a>
            <a
              href="https://instagram.com/technerdalert"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              <ExternalLink className="h-4 w-4 text-indigo-500" /> Instagram
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 pb-14">
          <div className="grid gap-4 sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-5 text-center dark:border-gray-800 dark:bg-gray-900"
              >
                <Icon className="mx-auto mb-2 h-6 w-6 text-indigo-500" />
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
            <GraduationCap className="mx-auto mb-2 h-6 w-6 text-indigo-500" />
            <h2 className="font-semibold">Want in?</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              D² Labs is free for the batch. Create an account to explore, or chip in to keep it
              running.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Join the platform
              </Link>
              <Link
                to="/support"
                className="flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                <Heart className="h-4 w-4 text-rose-500" /> Support
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-5 text-center text-xs text-gray-400 dark:border-gray-800">
        <Logo showTagline />
      </footer>
    </div>
  );
}
