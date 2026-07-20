import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Trash2 } from 'lucide-react';
import { listNotifications, markRead, markAllRead, deleteNotification } from '../../api/notifications';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const load = () => {
    listNotifications()
      .then((r) => { setItems(r.data.notifications); setUnread(r.data.unread); })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = async (n) => {
    if (!n.read) {
      await markRead(n._id).catch(() => {});
      setItems((prev) => prev.map((x) => x._id === n._id ? { ...x, read: true } : x));
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.link) { setOpen(false); navigate(n.link); }
  };

  const handleMarkAll = async () => {
    await markAllRead().catch(() => {});
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteNotification(id).catch(() => {});
    setItems((prev) => prev.filter((x) => x._id !== id));
    setUnread((u) => {
      const was = items.find((x) => x._id === id);
      return was && !was.read ? Math.max(0, u - 1) : u;
    });
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-600 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p className="text-sm font-semibold">Notifications</p>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-primary-600 hover:underline dark:text-primary-400">
                <Check className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-gray-400">All caught up!</li>
            )}
            {items.map((n) => (
              <li
                key={n._id}
                onClick={() => handleClick(n)}
                className={`group flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60 ${!n.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
              >
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? 'bg-primary-500' : 'bg-transparent'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{n.body}</p>}
                  <p className="mt-0.5 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n._id)}
                  className="hidden shrink-0 rounded p-1 text-gray-300 hover:text-red-500 group-hover:block dark:text-gray-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
