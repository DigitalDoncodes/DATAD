import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, Briefcase, GraduationCap } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white/50 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50';

const DOMAINS = [
  'IT / Software', 'Banking / Finance', 'Consulting', 'Manufacturing / Ops',
  'Healthcare', 'FMCG / Retail', 'Govt / PSU', 'Media / Content', 'Startup', 'Other',
];

export default function RegisterPage() {
  const { register, handleSubmit, formState } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [basicData, setBasicData] = useState(null);
  const [studentType, setStudentType] = useState('');
  const [workExYears, setWorkExYears] = useState('');
  const [preMbaDomain, setPreMbaDomain] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onStep1 = (data) => {
    setBasicData(data);
    setStep(2);
  };

  const onSubmitBackground = async () => {
    if (!studentType) { toast.error('Please select your background'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...basicData,
        studentType,
        workExYears: studentType === 'experienced' ? workExYears : undefined,
        preMbaDomain: studentType === 'experienced' ? preMbaDomain : undefined,
      };
      const res = await registerApi(payload);
      if (res.data.pending) { setPending(true); return; }
      login(res.data.token);
      toast.success('Welcome aboard!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
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

  if (step === 2) {
    return (
      <AuthShell subtitle="One last thing — your background">
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This helps us personalise your dashboard and surface the right tools for you.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStudentType('fresher')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                studentType === 'fresher'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'
              }`}
            >
              <GraduationCap className={`h-8 w-8 ${studentType === 'fresher' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="text-sm font-semibold">Fresher</p>
              <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
                Straight from undergrad — no full-time work experience
              </p>
            </button>

            <button
              type="button"
              onClick={() => setStudentType('experienced')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                studentType === 'experienced'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
                  : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'
              }`}
            >
              <Briefcase className={`h-8 w-8 ${studentType === 'experienced' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="text-sm font-semibold">Work experience</p>
              <p className="text-center text-[11px] text-gray-500 dark:text-gray-400">
                1+ years of professional experience before MBA
              </p>
            </button>
          </div>

          {studentType === 'experienced' && (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Years of experience
                </label>
                <input
                  type="number" min="0" max="20" step="0.5"
                  value={workExYears}
                  onChange={(e) => setWorkExYears(e.target.value)}
                  placeholder="e.g. 2.5"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Pre-MBA domain <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <select value={preMbaDomain} onChange={(e) => setPreMbaDomain(e.target.value)} className={fieldClass}>
                  <option value="">Select your field…</option>
                  {DOMAINS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700"
            >
              Back
            </button>
            <button
              type="button"
              onClick={onSubmitBackground}
              disabled={submitting || !studentType}
              className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create account'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Log in
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell subtitle="Notes, photos, plans & placements — everything your batch needs">
      <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
          <input id="name" {...register('name', { required: true })} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="rollNumber" className="mb-1 block text-sm font-medium">Roll Number</label>
          <input id="rollNumber" {...register('rollNumber')} className={fieldClass} placeholder="e.g. 2024MBA001" />
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
          className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-indigo-500 disabled:opacity-50"
        >
          Continue →
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
