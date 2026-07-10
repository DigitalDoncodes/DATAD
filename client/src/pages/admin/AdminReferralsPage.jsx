import { useEffect, useState } from 'react';
import { Gift, ArrowRight } from 'lucide-react';
import { getReferralMap } from '../../api/admin';
import Loader from '../../components/common/Loader';
import { AdminShell } from './shared';

export default function AdminReferralsPage() {
  const [referrals, setReferrals] = useState(null);

  useEffect(() => {
    getReferralMap().then((res) => setReferrals(res.data));
  }, []);

  if (!referrals) return <Loader />;

  const used = referrals.filter((u) => u.referralUsedBy).length;

  return (
    <AdminShell
      title="Referral network"
      icon={Gift}
      subtitle={`Who vouched for whom — ${used} of ${referrals.length} one-time codes used`}
    >
      <div className="rounded-2xl border border-gray-200/80 bg-white p-5 dark:border-gray-800/80 dark:bg-gray-900">
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {referrals.map((u) => (
            <li key={u._id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {u.name}
                  {u.status === 'pending' && (
                    <span className="ml-1.5 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                      pending
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400">
                  {u.referredBy ? (
                    <>
                      invited by{' '}
                      <span className="font-medium text-gray-500 dark:text-gray-300">{u.referredBy.name}</span>
                    </>
                  ) : (
                    'joined directly (admin approved or founder)'
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <code
                  className={`rounded-md px-2 py-1 font-mono text-[11px] font-bold tracking-wide ${
                    u.referralUsedBy
                      ? 'bg-gray-100 text-gray-400 line-through dark:bg-gray-800'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300'
                  }`}
                >
                  {u.referralCode || '—'}
                </code>
                {u.referralUsedBy ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <ArrowRight className="h-3.5 w-3.5" /> {u.referralUsedBy.name}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">unused</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AdminShell>
  );
}
