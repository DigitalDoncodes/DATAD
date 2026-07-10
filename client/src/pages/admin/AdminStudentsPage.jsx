import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { listStudents, approveStudent, rejectStudent } from '../../api/admin';
import { formatDate } from '../../utils/dateUtils';
import Loader from '../../components/common/Loader';
import { AdminShell } from './shared';

export default function AdminStudentsPage() {
  const [students, setStudents] = useState(null);

  const load = () => listStudents().then((res) => setStudents(res.data));
  useEffect(() => {
    load();
  }, []);

  const onApprove = async (s) => {
    try {
      await approveStudent(s._id);
      toast.success(`${s.name} approved — they've been emailed`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed');
    }
  };

  const onReject = async (s) => {
    if (!window.confirm(`Reject and remove ${s.name}'s pending account?`)) return;
    try {
      await rejectStudent(s._id);
      toast.success('Pending account removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    }
  };

  if (!students) return <Loader />;

  const pending = students.filter((s) => s.status === 'pending').length;

  return (
    <AdminShell
      title={`Students (${students.length})`}
      icon={Users}
      subtitle={pending ? `${pending} signup${pending === 1 ? '' : 's'} waiting for your approval` : 'Everyone is approved'}
    >
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {students.map((s) => (
            <li key={s._id} className="flex items-center justify-between py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {s.name}
                  {s.role === 'admin' && (
                    <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                      admin
                    </span>
                  )}
                  {s.status === 'pending' && (
                    <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                      pending
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-gray-400">{s.email}</p>
              </div>
              {s.status === 'pending' ? (
                <div className="ml-2 flex shrink-0 items-center gap-1.5">
                  <button
                    onClick={() => onApprove(s)}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onReject(s)}
                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500 dark:border-gray-700"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="ml-2 shrink-0 text-xs text-gray-400">{formatDate(s.createdAt)}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
