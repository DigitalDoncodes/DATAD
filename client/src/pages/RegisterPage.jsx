import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import Button from '../components/common/Button';
import AuthShell from '../components/layout/AuthShell';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import {
  WelcomeStep,
  ProgramStep,
  AcademicStep,
  GoalsStep,
  LearningStyleStep,
  ChallengesStep,
  ExperienceStep,
  SummaryStep,
  ProgressBar,
} from '../components/register';

const STEPS = [
  { id: 0, component: WelcomeStep,      label: 'Welcome' },
  { id: 1, component: ProgramStep,      label: 'Account' },
  { id: 2, component: AcademicStep,     label: 'Academic' },
  { id: 3, component: GoalsStep,        label: 'Interests' },
  { id: 4, component: LearningStyleStep, label: 'Skills' },
  { id: 5, component: ChallengesStep,   label: 'Goals' },
  { id: 6, component: ExperienceStep,   label: 'Experience' },
  { id: 7, component: SummaryStep,      label: 'Review' },
];

const DEFAULT_VALUES = {
  name: '', email: '', password: '', rollNumber: '', referralCode: '',
  course: '', specialization: '', college: '', department: '',
  batch: '', semester: '', graduationYear: '',
  careerInterests: [],
  skills: [],
  goals: [],
  learningStyle: '',
  timeAvailable: '',
  challenges: [],
  studentType: 'fresher',
  workExYears: '',
  priorDomain: '',
};

export default function RegisterPage() {
  const methods = useForm({ defaultValues: DEFAULT_VALUES, mode: 'onChange' });
  const { handleSubmit, formState: { isSubmitting, isValid } } = methods;
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async (data) => {
    try {
      const isExp = data.studentType === 'experienced';
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        rollNumber: data.rollNumber || '',
        referralCode: data.referralCode || '',
        studentType: data.studentType || 'fresher',
        course: data.course || '',
        specialization: data.specialization || '',
        college: data.college || '',
        department: data.department || '',
        batch: data.batch || '',
        semester: data.semester || '',
        graduationYear: data.graduationYear || undefined,
        careerInterests: data.careerInterests || [],
        skills: data.skills || [],
        goals: data.goals || {},
        learningStyle: data.learningStyle || '',
        timeAvailable: data.timeAvailable || '',
        challenges: data.challenges || [],
        experience: isExp ? {
          years: Number(data.workExYears) || 0,
          type: 'experienced',
          pastDomain: data.priorDomain || '',
        } : {
          years: 0,
          type: 'fresher',
          pastDomain: '',
        },
      };
      const res = await registerApi(payload);
      if (res.data.pending) { setPending(true); return; }
      login(res.data.token);
      toast.success('Welcome to DATAD!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  if (pending) {
    return (
      <AuthShell subtitle="One last step">
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
            <MailCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold">Account created — pending approval</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            An admin will verify your details and approve your account shortly. You'll receive an
            email the moment you're in. Have a referral code? Register again with it to skip the queue.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  const StepComponent = STEPS[step].component;
  const isWelcome = step === 0;
  const isLast = step === STEPS.length - 1;
  const stepNumber = step + 1;
  const totalSteps = STEPS.length;

  return (
    <AuthShell subtitle={isWelcome ? 'Your student workspace, powered by Dax' : `Step ${stepNumber} of ${totalSteps}`}>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {!isWelcome && <ProgressBar currentStep={step} totalSteps={totalSteps} />}

          <div className="min-h-[260px]">
            <StepComponent />
          </div>

          <div className={`flex gap-3 pt-1 ${step > 0 ? 'justify-between' : ''}`}>
            {step > 0 && (
              <Button variant="secondary" onClick={back}>Back</Button>
            )}
            {isLast ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-500 disabled:opacity-60"
              >
                {isSubmitting ? 'Creating your workspace…' : 'Create My Workspace ✨'}
              </button>
            ) : (
              <Button type="submit" disabled={isSubmitting || !isValid} fullWidth={step === 0} loading={isSubmitting} className={step > 0 ? 'flex-1' : ''}>{step > 0 ? (step < totalSteps ? 'Continue →' : 'Get started →') : 'Get started →'}</Button>
            )}
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Log in
            </Link>
          </p>
        </form>
      </FormProvider>
    </AuthShell>
  );
}
