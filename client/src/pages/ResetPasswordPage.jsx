import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import { resetPassword } from '../api/auth';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white/50 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50';

export default function ResetPasswordPage() {
  const { register, handleSubmit, watch, formState } = useForm();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const onSubmit = async ({ password }) => {
    try {
      const res = await resetPassword({ token, password });
      toast.success(res.data.message);
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    }
  };

  if (!token) {
    return (
      <AuthShell subtitle="Reset your password">
        <div className="space-y-3 py-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This reset link is missing its token. Please use the link from your email, or request a
            new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Request new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Choose a new password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">New password</label>
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
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium">Confirm password</label>
          <input
            id="confirm"
            type="password"
            {...register('confirm', {
              required: true,
              validate: (v) => v === watch('password') || 'Passwords do not match',
            })}
            className={fieldClass}
          />
          {formState.errors.confirm && (
            <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
          )}
        </div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50"
        >
          {formState.isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  );
}
