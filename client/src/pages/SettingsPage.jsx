import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { KeyRound, Moon, ShieldAlert, Sun, Trash2 } from 'lucide-react';
import { changePassword, deleteAccount } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Modal from '../components/common/Modal';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700';

function Card({ title, icon: Icon, danger, children }) {
  return (
    <section
      className={`rounded-xl border p-5 ${
        danger
          ? 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'
          : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
      }`}
    >
      <h2 className={`mb-4 flex items-center gap-2 font-semibold ${danger ? 'text-red-600 dark:text-red-400' : ''}`}>
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const pwForm = useForm();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const onChangePassword = async (data) => {
    try {
      await changePassword(data);
      toast.success('Password updated');
      pwForm.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    }
  };

  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(deletePassword);
      toast.success('Account deleted');
      logout();
      navigate('/register');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-1 text-xl font-bold">Settings</h1>
      <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
        {user?.name} · {user?.email}
      </p>

      <div className="space-y-4">
        <Card title="Appearance" icon={dark ? Moon : Sun}>
          <button
            onClick={toggle}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {dark ? 'light' : 'dark'} mode
          </button>
        </Card>

        <Card title="Change password" icon={KeyRound}>
          <form onSubmit={pwForm.handleSubmit(onChangePassword)} className="space-y-3">
            <input
              type="password"
              placeholder="Current password"
              aria-label="Current password"
              {...pwForm.register('currentPassword', { required: true })}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="New password (8+ chars, letter & number)"
              aria-label="New password"
              {...pwForm.register('newPassword', { required: true, minLength: 8 })}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={pwForm.formState.isSubmitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Update password
            </button>
          </form>
        </Card>

        <Card title="Delete account" icon={ShieldAlert} danger>
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
            This permanently deletes your account and everything you've created — notes,
            photos, tasks, finances and resume. This cannot be undone.
          </p>
          <button
            onClick={() => {
              setDeletePassword('');
              setDeleteOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" /> Delete my account
          </button>
        </Card>
      </div>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account?">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Enter your password to confirm. This will erase all your data immediately and
            cannot be undone.
          </p>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Your password"
            aria-label="Confirm password"
            className={inputClass}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={onDeleteAccount}
              disabled={deleting || !deletePassword}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Permanently delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
