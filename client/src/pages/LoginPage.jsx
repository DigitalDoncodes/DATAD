import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white/50 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50';

export default function LoginPage() {
  const { register, handleSubmit, formState } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const res = await loginApi(data);
      login(res.data.token);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.pending) {
        toast(err.response.data.message, { icon: '⏳', duration: 6000 });
        return;
      }
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <AuthShell subtitle="Log in to your space">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" {...register('email', { required: true })} className={fieldClass} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Forgot password?
            </Link>
          </div>
          <input id="password" type="password" {...register('password', { required: true })} className={fieldClass} />
        </div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50"
        >
          {formState.isSubmitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          New here?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
