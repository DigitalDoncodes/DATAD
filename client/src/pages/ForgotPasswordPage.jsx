import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { forgotPassword } from '../api/auth';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white/50 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState } = useForm();
  const [sent, setSent] = useState(false);

  const onSubmit = async ({ email }) => {
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      toast.error('Something went wrong — please try again');
    }
  };

  if (sent) {
    return (
      <AuthShell subtitle="Check your inbox">
        <div className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <MailCheck className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">Reset link sent</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If an account exists for that email, you'll receive a password reset link. It's valid
            for 30 minutes — check spam if it doesn't arrive.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="We'll email you a reset link">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" {...register('email', { required: true })} className={fieldClass} />
        </div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50"
        >
          {formState.isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
