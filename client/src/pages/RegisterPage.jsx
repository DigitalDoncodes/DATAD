import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white/50 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50';

export default function RegisterPage() {
  const { register, handleSubmit, formState } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const onSubmit = async (data) => {
    try {
      const res = await registerApi(data);
      if (res.data.pending) {
        setPending(true);
        return;
      }
      login(res.data.token);
      toast.success('Welcome aboard!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  if (pending) {
    return (
      <AuthShell subtitle="One last step">
        <div className="space-y-3 py-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
            <MailCheck className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold">Account created — pending approval</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            An admin will verify your details and approve your account shortly. You'll receive an
            email the moment you're in. Have a referral code from a batchmate? Register again with
            it to skip the queue.
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
    <AuthShell subtitle="Notes, photos, plans & placements — everything your batch needs">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
          <input id="name" {...register('name', { required: true })} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" {...register('email', { required: true })} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            {...register('password', { required: true, minLength: 8 })}
            className={fieldClass}
          />
          {formState.errors.password && (
            <p className="mt-1 text-xs text-red-500">At least 8 characters, with a letter and a number</p>
          )}
        </div>
        <div>
          <label htmlFor="referralCode" className="mb-1 block text-sm font-medium">
            Referral code <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="referralCode"
            placeholder="e.g. DHAT-7K2M"
            {...register('referralCode')}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-gray-400">
            Each code works once. With a batchmate's unused code you're approved instantly;
            without one an admin reviews your signup.
          </p>
        </div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50"
        >
          {formState.isSubmitting ? 'Creating…' : 'Create account'}
        </button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
