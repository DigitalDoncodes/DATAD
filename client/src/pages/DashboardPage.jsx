import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CalendarDays, Camera, ArrowRight, Megaphone, Pin, Image, ExternalLink } from 'lucide-react';
import { listNotes } from '../api/notes';
import { listTasks } from '../api/tasks';
import { listAlbums } from '../api/albums';
import { listAnnouncements } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { formatDate, daysUntil } from '../utils/dateUtils';
import Loader from '../components/common/Loader';
import { Page, Stagger, StaggerItem, AnimatedNumber } from '../components/common/motion';

function SectionCard({ title, icon: Icon, to, children }) {
  return (
    <div className="card-hover rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-indigo-500" /> {title}
        </h2>
        <Link to={to} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:gap-1.5 hover:underline dark:text-indigo-400">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="card-hover rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-800/80 dark:bg-gray-900"
    >
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon className="h-4 w-4 text-indigo-500" /> {label}
      </div>
      <AnimatedNumber value={value} className="mt-1 block text-2xl font-bold tabular-nums" />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([listNotes(), listTasks(), listAlbums(), listAnnouncements()]).then(
      ([notes, tasks, albums, announcements]) => {
        const upcoming = tasks.data.filter((t) => t.status !== 'done' && daysUntil(t.dueDate) >= -7);
        setData({
          notes: notes.data.slice(0, 4),
          tasks: upcoming.slice(0, 5),
          albums: albums.data.slice(0, 4),
          announcements: announcements.data.slice(0, 3),
          counts: { notes: notes.data.length, tasks: upcoming.length, albums: albums.data.length },
        });
      }
    );
  }, []);

  if (!data) return <Loader />;

  return (
    <Page className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold">
        Hey, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Here's what's happening in your batch
      </p>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <StatTile icon={BookOpen} label="Notes" value={data.counts.notes} to="/notes" />
        <StatTile icon={CalendarDays} label="Upcoming" value={data.counts.tasks} to="/planner" />
        <StatTile icon={Camera} label="Albums" value={data.counts.albums} to="/albums" />
      </div>

      {data.announcements.length > 0 && (
        <div className="mb-4 space-y-2">
          {data.announcements.map((a) => (
            <div
              key={a._id}
              className={`flex items-start gap-2 rounded-2xl border p-3 text-sm ${
                a.priority === 'important'
                  ? 'border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-900/20'
                  : 'border-gray-200/80 bg-white dark:border-gray-800/80 dark:bg-gray-900'
              }`}
            >
              <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
              <div>
                <p className="font-medium">
                  {a.pinned && <Pin className="mr-1 inline h-3 w-3 text-amber-500" />}
                  {a.title}
                </p>
                <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{a.body}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {a.createdBy?.name} · {formatDate(a.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Stagger className="grid gap-4 lg:grid-cols-2">
        <StaggerItem>
          <SectionCard title="Upcoming deadlines" icon={CalendarDays} to="/planner">
            {data.tasks.length === 0 ? (
              <p className="text-sm text-gray-400">Nothing due — enjoy the break!</p>
            ) : (
              <ul className="space-y-2">
                {data.tasks.map((task) => {
                  const days = daysUntil(task.dueDate);
                  return (
                    <li key={task._id} className="flex items-center justify-between text-sm">
                      <span className="truncate">{task.title}</span>
                      <span
                        className={`ml-2 shrink-0 text-xs ${days < 0 ? 'text-red-500' : days <= 1 ? 'text-amber-500' : 'text-gray-400'}`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>
        </StaggerItem>

        <StaggerItem>
          <SectionCard title="Recent notes" icon={BookOpen} to="/notes">
            {data.notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes yet — share the first one!</p>
            ) : (
              <ul className="space-y-2">
                {data.notes.map((note) => (
                  <li key={note._id}>
                    <Link to={`/notes/${note._id}`} className="flex items-center justify-between text-sm hover:text-indigo-600">
                      <span className="truncate">{note.title}</span>
                      <span className="ml-2 shrink-0 text-xs text-gray-400">{note.subject}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </StaggerItem>

        <StaggerItem className="lg:col-span-2">
          <SectionCard title="Recent albums" icon={Camera} to="/albums">
            {data.albums.length === 0 ? (
              <p className="text-sm text-gray-400">No albums yet — add a Google Photos link!</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {data.albums.map((album) => (
                  <a
                    key={album._id}
                    href={album.link}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-lg border border-gray-200/80 dark:border-gray-800/80"
                  >
                    <div className="flex h-20 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 to-blue-500">
                      {album.cover ? (
                        <img src={album.cover} alt={album.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <Image className="h-6 w-6 text-white/80" />
                      )}
                    </div>
                    <p className="flex items-center justify-between gap-1 truncate p-2 text-xs font-medium">
                      <span className="truncate">{album.title}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" />
                    </p>
                  </a>
                ))}
              </div>
            )}
          </SectionCard>
        </StaggerItem>
      </Stagger>
    </Page>
  );
}
