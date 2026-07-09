import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Logo from '../components/common/Logo';
import { login as loginApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

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
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo size="lg" showTagline />
          <p className="mt-2 text-sm text-gray-500">Log in to your space</p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl bg-white p-6 shadow dark:bg-gray-900"
        >
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              {...register('email', { required: true })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              {...register('password', { required: true })}
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700"
            />
          </div>
          <button
            type="submit"
            disabled={formState.isSubmitting}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {formState.isSubmitting ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-center text-sm text-gray-500">
            New here?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
