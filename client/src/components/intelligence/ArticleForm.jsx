import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { CATEGORIES } from '../../utils/intelligence';
import { createArticle, updateArticle } from '../../api/intelligence';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-700';

const lines = (text) => (text || '').split('\n').map((l) => l.trim()).filter(Boolean);
const joinLines = (arr) => (arr || []).join('\n');

// Fields that arrive/leave as newline-separated lists.
const LIST_FIELDS = ['mbaConcepts', 'industries', 'keyTakeaways', 'interviewQuestions', 'businessTerms'];

export default function ArticleForm({ open, onClose, editing, onSaved }) {
  const { register, handleSubmit, formState, reset } = useForm();

  // Seed form whenever the modal opens or the edited article changes.
  useEffect(() => {
    if (!open) return;
    const e = editing || {};
    reset({
      headline: e.headline || '',
      category: e.category || 'stock-market',
      summary: e.summary || '',
      whyItMatters: e.whyItMatters || '',
      interviewRelevance: e.interviewRelevance || '',
      source: e.source || '',
      sourceUrl: e.sourceUrl || '',
      newsOfTheDay: e.newsOfTheDay || false,
      mbaConcepts: joinLines(e.mbaConcepts),
      industries: joinLines(e.industries),
      keyTakeaways: joinLines(e.keyTakeaways),
      interviewQuestions: joinLines(e.interviewQuestions),
      businessTerms: joinLines(e.businessTerms),
    });
  }, [open, editing, reset]);

  const onSubmit = async (data) => {
    const payload = { ...data };
    LIST_FIELDS.forEach((f) => (payload[f] = lines(data[f])));
    try {
      if (editing) {
        await updateArticle(editing._id, payload);
        toast.success('Article updated');
      } else {
        await createArticle(payload);
        toast.success('Article published');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save article');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Edit article' : 'New intelligence article'}>
      <form onSubmit={handleSubmit(onSubmit)} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
        <input {...register('headline', { required: true })} placeholder="Headline" aria-label="Headline" className={inputClass} />
        <div className="grid grid-cols-2 gap-3">
          <select {...register('category')} aria-label="Category" className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('newsOfTheDay')} className="rounded" /> News of the Day
          </label>
        </div>
        <textarea {...register('summary', { required: true })} rows={2} placeholder="Short summary (2–3 lines)" aria-label="Summary" className={inputClass} />
        <textarea {...register('whyItMatters')} rows={2} placeholder="Why it matters to an MBA student" aria-label="Why it matters" className={inputClass} />
        <textarea {...register('interviewRelevance')} rows={2} placeholder="Interview / case-study relevance" aria-label="Interview relevance" className={inputClass} />

        <p className="pt-1 text-xs font-medium text-gray-400">One item per line:</p>
        <textarea {...register('mbaConcepts')} rows={2} placeholder="MBA concepts (e.g. Porter's Five Forces)" aria-label="MBA concepts" className={inputClass} />
        <textarea {...register('industries')} rows={2} placeholder="Companies / industries affected" aria-label="Industries" className={inputClass} />
        <textarea {...register('keyTakeaways')} rows={2} placeholder="Key takeaways" aria-label="Key takeaways" className={inputClass} />
        <textarea {...register('interviewQuestions')} rows={2} placeholder="Possible interview questions" aria-label="Interview questions" className={inputClass} />
        <textarea {...register('businessTerms')} rows={2} placeholder="Business terms to know" aria-label="Business terms" className={inputClass} />

        <div className="grid grid-cols-2 gap-3">
          <input {...register('source')} placeholder="Source (e.g. Economic Times)" aria-label="Source" className={inputClass} />
          <input {...register('sourceUrl')} placeholder="Source URL (optional)" aria-label="Source URL" className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {editing ? 'Save changes' : 'Publish article'}
        </button>
      </form>
    </Modal>
  );
}
