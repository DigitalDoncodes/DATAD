import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, CalendarDays, ArrowRight, PenSquare, Quote } from 'lucide-react';
import DailyCaseCard from '../../components/dashboard/DailyCaseCard';
import { listNotes } from '../../api/notes';
import { listTasks } from '../../api/tasks';
import { daysUntil, formatDate } from '../../utils/dateUtils';
import { CardGridSkeleton } from '../../components/common/Skeleton';
import UpcomingGrid from '../../components/common/UpcomingGrid';
import { Page } from '../../components/common/motion';
import useDocumentTitle from '../../hooks/useDocumentTitle';

const ACADEMIC_TYPES = ['case-study', 'exam', 'deadline'];

const QUOTES = [
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
  { text: "Education is not the filling of a pail, but the lighting of a fire.", author: "W.B. Yeats" },
  { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
  { text: "Success is no accident. It is hard work, perseverance, learning, studying…", author: "Pelé" },
  { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
  { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
  { text: "Study while others are sleeping; work while others are loafing.", author: "William A. Ward" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Develop a passion for learning. If you do, you will never cease to grow.", author: "Anthony J. D'Angelo" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
];

// Stable per-session pick — changes every page load / refresh.
function pickDailyQuote() {
  const seed = Math.floor(Date.now() / 1000); // new every second, but feel free to coarsen
  return QUOTES[seed % QUOTES.length];
}

export default function StudyHubPage() {
  useDocumentTitle('Study');
  const { hash } = useLocation();
  const [data, setData] = useState(null);
  const quote = useMemo(() => pickDailyQuote(), []);

  useEffect(() => {
    if (hash === '#daily-case' && data) {
      requestAnimationFrame(() => {
        document.getElementById('daily-case')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [hash, data]);

  useEffect(() => {
    Promise.allSettled([listNotes(), listTasks()]).then(([notesRes, tasksRes]) => {
      const notes = notesRes.status === 'fulfilled' ? notesRes.value.data : [];
      const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value.data : [];
      const subjects = {};
      notes.forEach((n) => {
        const key = n.subject || 'General';
        subjects[key] = (subjects[key] || 0) + 1;
      });
      setData({
        subjects: Object.entries(subjects).sort((a, b) => b[1] - a[1]),
        notes: notes.slice(0, 5),
        assignments: tasks
          .filter((t) => ACADEMIC_TYPES.includes(t.type) && t.status !== 'done' && daysUntil(t.dueDate) >= -7)
          .slice(0, 5),
      });
    });
  }, []);

  if (!data) return <div className="mx-auto max-w-5xl px-4 py-6"><CardGridSkeleton count={4} /></div>;

  return (
    <Page className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Study</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Notes, subjects and assignments in one place</p>
        </div>
        <Link
          to="/study/notes/new"
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <PenSquare className="h-4 w-4" /> New note
        </Link>
      </div>

      {/* Motivational quote — changes every refresh */}
      <div className="mb-5 rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:border-indigo-800/40 dark:from-indigo-950/40 dark:to-purple-950/40">
        <div className="flex items-start gap-3">
          <Quote className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />
          <div>
            <p className="text-sm font-medium italic text-gray-700 dark:text-gray-200">"{quote.text}"</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">— {quote.author}</p>
          </div>
        </div>
      </div>

      {data.subjects.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">Subjects</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {data.subjects.map(([subject, count]) => (
              <Link
                key={subject}
                to={`/study/notes?subject=${encodeURIComponent(subject)}`}
                className="card-hover rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800/80 dark:bg-gray-900"
              >
                <GraduationCap className="mb-2 h-5 w-5 text-indigo-500" />
                <p className="truncate text-sm font-semibold">{subject}</p>
                <p className="text-xs text-gray-400">{count} note{count === 1 ? '' : 's'}</p>
              </Link>
            ))
          }
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card-hover rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><BookOpen className="h-4 w-4 text-indigo-500" /> Recent notes</h2>
            <Link to="/study/notes" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.notes.length === 0 ? (
            <p className="text-sm text-gray-400">No notes yet — share the first one!</p>
          ) : (
            <ul className="space-y-2">
              {data.notes.map((n) => (
                <li key={n._id}>
                  <Link to={`/study/notes/${n._id}`} className="flex items-center justify-between text-sm hover:text-indigo-600">
                    <span className="truncate">{n.title}</span>
                    <span className="ml-2 shrink-0 text-xs text-gray-400">{n.subject}</span>
                  </Link>
                </li>
              ))
            }
            </ul>
          )}
        </div>

        <div className="card-hover rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-indigo-500" /> Assignments due</h2>
            <Link to="/study/assignments" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {data.assignments.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing due — enjoy the break!</p>
          ) : (
            <ul className="space-y-2">
              {data.assignments.map((t) => {
                const days = daysUntil(t.dueDate);
                return (
                  <li key={t._id} className="flex items-center justify-between text-sm">
                    <span className="truncate">{t.title}</span>
                    <span className={`ml-2 shrink-0 text-xs ${days < 0 ? 'text-red-500' : days <= 1 ? 'text-amber-500' : 'text-gray-400'}`}>
                      {formatDate(t.dueDate)}
                    </span>
                  </li>
                );
              })}
            )
            </ul>
          )}
        </div>
      </div>

      {/* Daily Case — enhanced */}
      <div className="mt-8" id="daily-case">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Today's Case</p>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Daily practice
          </span>
        </div>
        <DailyCaseCard />
      </div>

      <UpcomingGrid workspace="study" />
    </Page>
  );
}