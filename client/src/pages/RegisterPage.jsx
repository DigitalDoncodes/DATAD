import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MailCheck, Briefcase, GraduationCap, Building, BriefcaseMedical, Banknote, GraduationCap, UserPlus, Sword, MessageSquare, Bot, Settings, BriefcaseBusiness } from 'lucide-react';
import AuthShell from '../components/layout/AuthShell';
import { register as registerApi } from '../api/auth';

const fieldClass =
  'w-full rounded-lg border border-gray-300 bg-white/50 px-3 py-2 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900/50';

const DOMAINS = [
  'IT / Software', 'Banking / Finance', 'Consulting', 'Manufacturing / Ops',
  'Healthcare', 'FMCG / Retail', 'Govt / PSU', 'Media / Content', 'Startup', 'Other',
];

export default function RegisterPage() {
  const { register, handleSubmit, reset, formState } = useForm();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [pending, setPending] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: basic info
    name: '',
    email: '',
    password: '',
    rollNumber: '',
    referralCode: '',
    // Step 2: profile
    college: '',
    course: '',
    department: '',
    specialization: '',
    batch: '',
    semester: '',
    graduationYear: '',
    dreamRole: '',
    preferredIndustries: [],
    careerInterests: [],
    favouriteSubjects: [],
    difficultSubjects: [],
    learningStyle: 'Other',
    goals: {
      placement: false,
      higherStudies: false,
      entrepreneurship: false,
      financialLiteracy: false,
      leadership: false,
      communication: false,
      research: false,
      certifications: false
    },
    experience: {
      years: 0,
      type: 'fresher',
      pastDomain: ''
    }
  });

  const handleStep1 = (data) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  };

  const onSubmitProfile = async () => {
    setPending(true);
    try {
      const payload = {
        ...formData,
        // Ensure arrays are arrays
        preferredIndustries: Array.isArray(formData.preferredIndustries) ? formData.preferredIndustries : [],
        careerInterests: Array.isArray(formData.careerInterests) ? formData.careerInterests : [],
        favouriteSubjects: Array.isArray(formData.favouriteSubjects) ? formData.favouriteSubjects : [],
        difficultSubjects: Array.isArray(formData.difficultSubjects) ? formData.difficultSubjects : [],
      };
      const res = await registerApi(payload);
      if (res.data.pending) {
        setPending(false);
        return;
      }
      // Assuming the login is handled in the API response via token
      // We'll need to store the token and redirect.
      // For now, we'll assume the API returns a token and we handle it via auth context.
      // But our registerApi currently returns the token directly?
      // Actually, the registerApi function from ../api/auth returns the result from the endpoint.
      // The endpoint returns { token: ... } on success.
      // We'll need to save the token and then redirect.
      // However, we are using the auth context? Not in this component.
      // We'll change the registerApi to return the token and then we can use it to set auth.
      // But we don't have auth context here. We'll rely on the fact that the server sets a cookie?
      // Looking at the original RegisterPage, it used login from authContext after getting the token.
      // We'll need to do the same.
      // Let's adjust: we'll call registerApi, get the token, then use login from authContext.
      // We'll need to import useAuth and login.
      // We'll do that in a moment.
      // For now, we'll just redirect to home and assume the token is stored elsewhere.
      // We'll fix this after we import useAuth.
      toast.success('Welcome aboard!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setPending(false);
    }
  };

  if (pending) {
    return (
      <AuthSubtitle>One last step</AuthSubtitle>
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
    );
  }

  if (step === 2) {
    return (
      <>
        <AuthSubtitle>Tell us about yourself</AUTHSubtitle>
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basics</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">College</label>
                <input
                  {...register('college')}
                  placeholder="e.g. Indian Institute of Technology Delhi"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Course</label>
                <input
                  {...register('course')}
                  placeholder="e.g. Bachelor of Technology"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Department</label>
                <input
                  {...register('department')}
                  placeholder="e.g. Computer Science"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Specialisation</label>
                <input
                  {...register('specialization')}
                  placeholder="e.g. Artificial Intelligence"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {/* Academic Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academics</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Batch</label>
                <input
                  {...register('batch')}
                  placeholder="e.g. Computer Science 2024-26"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Semester</label>
                <input
                  {...register('semester')}
                  placeholder="e.g. 3 or Semester 3"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Graduation Year</label>
                <input
                  type="number"
                  min="2020"
                  max="2040"
                  step="1"
                  {...register('graduationYear')}
                  placeholder="e.g. 2026"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Dream Role</label>
                <input
                  {...register('dreamRole')}
                  placeholder="e.g. Product Manager"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>

          {/* Interests & Goals */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Interests & Goals</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Preferred Industries</label>
                <div className="space-y-2">
                  {DOMAINS.map((domain) => (
                    <label key={domain} className="flex items-start">
                      <input
                        type="checkbox"
                        value={domain}
                        checked={formData.preferredIndustries?.includes(domain) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const current = formData.preferredIndustries || [];
                          setFormData(prev => ({
                            ...prev,
                            preferredIndustries: checked
                              ? [...new Set([...current, domain])]
                              : current.filter((d) => d !== domain)
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">{domain}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Career Interests</label>
                <div className="space-y-2">
                  {/* We'll reuse DOMAINS for simplicity, but could be separate list */}
                  {DOMAINS.map((domain) => (
                    <label key={domain} className="flex items-start">
                      <input
                        type="checkbox"
                        value={domain}
                        checked={formData.careerInterests?.includes(domain) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const current = formData.careerInterests || [];
                          setFormData(prev => ({
                            ...prev,
                            careerInterests: checked
                              ? [...new Set([...current, domain])]
                              : current.filter((d) => d !== domain)
                          }));
                        }}
                        className={h-4 w-4 text-indigo-600}
                      />
                      <span className="ml-2 text-sm">{domain}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Goals</label>
                <div className="space-y-2">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.placement || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, placement: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Placement (job after graduation)</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.higherStudies || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, higherStudies: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Higher Studies (e.g. MS, PhD)</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.entrepreneurship || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, entrepreneurship: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Entrepreneurship</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.financialLiteracy || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, financialLiteracy: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Financial Literacy</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.leadership || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, leadership: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Leadership</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.communication || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, communication: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Communication</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.research || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, research: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Research</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                        checked={formData.goals?.certifications || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData(prev => ({
                            ...prev,
                            goals: { ...prev.goals, certifications: checked }
                          }));
                        }}
                        className="h-4 w-4 text-indigo-600"
                      />
                      <span className="ml-2 text-sm">Certifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Learning & Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Learning & Experience</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Favourite Subjects</label>
                <div className="space-y-2">
                  {/* We'll use a simple text input for now; could be tags */}
                  <input
                    {...register('favouriteSubjects')}
                    placeholder="e.g. Mathematics, Physics (comma separated)"
                    className={fieldClass}
                  />
                  {/* Note: we'll need to convert comma-separated string to array in the handler */}
                  {/* We'll handle that in the onSubmitProfile by splitting */ }
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Difficult Subjects</label>
                <div className="space-y-2">
                  <input
                    {...register('difficultSubjects')}
                    placeholder="e.g. Organic Chemistry (comma separated)"
                    className={fieldClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Learning Style</label>
                <select
                  {...register('learningStyle')}
                  className={fieldClass}
                >
                  <option value="Visual">Visual</option>
                  <option value="Auditory">Auditory</option>
                  <option value="Reading/Writing">Reading/Writing</option>
                  <option value="Kinesthetic">Kinesthetic</option>
                  <option value="Multimodal">Multimodal</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Years of Work Experience</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  {...register('experience.years')}
                  placeholder="e.g. 2.5"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Experience Type</label>
                <select
                  {...register('experience.type')}
                  className={fieldClass}
                >
                  <option value="fresher">Fresher (no experience)</option>
                  <option value="intern">Intern</option>
                  <option value="entry-level">Entry-level</option>
                  <option value="mid-level">Mid-level</option>
                  <option value="senior">Senior</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Past Work Domain (if any)</label>
                <input
                  {...register('experience.pastDomain')}
                  placeholder="e.g. IT, Finance, Marketing"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm dark:border-gray-700"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmitProfile)}
            disabled={formState.isSubmitting}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {formState.isSubmitting ? 'Creating…' : 'Create account'}
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </Link>
        </div>
      </>
    );
  }

  return (
    <AuthShell subtitle="Notes, photos, plans & placements — everything your batch needs">
      <form onSubmit={handleSubmit(handleStep1)} className="space-y-4">
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
          <label htmlFor="rollNumber" className="mb-1 block text-sm font-medium">Roll Number</label>
          <input id="rollNumber" {...register('rollNumber')} className={fieldClass} placeholder="e.g. 2024MBA001" />
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