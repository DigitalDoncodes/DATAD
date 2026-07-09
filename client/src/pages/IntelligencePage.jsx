import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Newspaper, Plus, Sparkles, LineChart, Bookmark, SlidersHorizontal, Star } from 'lucide-react';
import {
  listArticles,
  listBookmarked,
  toggleBookmark as toggleBookmarkApi,
  getMarket,
  setInterests as setInterestsApi,
} from '../api/intelligence';
import { getMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES, TOPICS, categoriesForInterests } from '../utils/intelligence';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import IntelligenceCard from '../components/intelligence/IntelligenceCard';
import MarketStrip from '../components/intelligence/MarketStrip';
import ArticleForm from '../components/intelligence/ArticleForm';
import MarketEditor from '../components/intelligence/MarketEditor';

const chip = (active) =>
  `shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
    active
      ? 'bg-indigo-600 text-white'
      : 'bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'
  }`;

export default function IntelligencePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [articles, setArticles] = useState(null);
  const [market, setMarketState] = useState([]);
  const [interests, setInterests] = useState([]);
  const [view, setView] = useState('all'); // 'all' | 'foryou' | 'saved'
  const [category, setCategory] = useState('');

  const [articleForm, setArticleForm] = useState({ open: false, editing: null });
  const [marketOpen, setMarketOpen] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);

  const loadArticles = useCallback(() => {
    const fetcher = view === 'saved' ? listBookmarked() : listArticles(category || undefined);
    fetcher.then((res) => setArticles(res.data));
  }, [view, category]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    getMarket().then((res) => setMarketState(res.data.indicators || []));
    getMe().then((res) => setInterests(res.data.interests || []));
  }, []);

  const onToggleBookmark = async (article) => {
    try {
      await toggleBookmarkApi(article._id);
      loadArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to bookmark');
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this article?')) return;
    const { deleteArticle } = await import('../api/intelligence');
    await deleteArticle(id);
    toast.success('Article deleted');
    loadArticles();
  };

  const saveInterests = async (next) => {
    try {
      const res = await setInterestsApi(next);
      setInterests(res.data.interests);
    } catch {
      toast.error('Failed to save topics');
    }
  };

  // Client-side "For you" filter using followed topics → categories.
  const forYouCats = categoriesForInterests(interests);
  let shown = articles || [];
  if (view === 'foryou') {
    shown = forYouCats.size ? shown.filter((a) => forYouCats.has(a.category)) : shown;
  }
  const newsOfDay = view === 'all' && !category ? shown.find((a) => a.newsOfTheDay) : null;
  const rest = newsOfDay ? shown.filter((a) => a._id !== newsOfDay._id) : shown;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Newspaper className="h-5 w-5 text-indigo-500" /> Intelligence Center
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTopicsOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <SlidersHorizontal className="h-4 w-4" /> Topics
          </button>
          {isAdmin && (
            <button
              onClick={() => setArticleForm({ open: true, editing: null })}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Article
            </button>
          )}
        </div>
      </div>
      <p className="mb-4 text-xs text-gray-400">
        Business news, explained for MBA students — what happened, why it matters, and how to use it.
      </p>

      {/* Market snapshot */}
      {(market.length > 0 || isAdmin) && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <LineChart className="h-3.5 w-3.5" /> Market snapshot
            </p>
            {isAdmin && (
              <button onClick={() => setMarketOpen(true)} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Update
              </button>
            )}
          </div>
          {market.length > 0 ? (
            <MarketStrip indicators={market} />
          ) : (
            <p className="text-sm text-gray-400">No market data yet — add today's figures.</p>
          )}
        </div>
      )}

      {/* View + category filters */}
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <button className={chip(view === 'all')} onClick={() => { setView('all'); }}>All</button>
        <button className={chip(view === 'foryou')} onClick={() => { setView('foryou'); }}>
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5" /> For you</span>
        </button>
        <button className={chip(view === 'saved')} onClick={() => { setView('saved'); }}>
          <span className="flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" /> Saved</span>
        </button>
      </div>
      {view !== 'saved' && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button className={chip(!category)} onClick={() => setCategory('')}>All topics</button>
          {CATEGORIES.map((c) => (
            <button key={c.value} className={chip(category === c.value)} onClick={() => setCategory(c.value)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Feed */}
      {!articles ? (
        <Loader />
      ) : shown.length === 0 ? (
        <EmptyState
          icon={view === 'saved' ? Bookmark : Newspaper}
          title={view === 'saved' ? 'No saved articles yet' : 'No articles yet'}
          subtitle={
            view === 'saved'
              ? 'Bookmark articles to build your prep reading list'
              : isAdmin
                ? 'Publish your first intelligence article'
                : 'Check back soon — fresh business intelligence is on the way'
          }
        />
      ) : (
        <div className="space-y-4">
          {newsOfDay && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
                <Sparkles className="h-3.5 w-3.5" /> News of the day
              </p>
              <div className="rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 p-0.5">
                <IntelligenceCard
                  article={newsOfDay}
                  onToggleBookmark={onToggleBookmark}
                  isAdmin={isAdmin}
                  onEdit={(a) => setArticleForm({ open: true, editing: a })}
                  onDelete={onDelete}
                />
              </div>
            </div>
          )}
          {rest.map((a) => (
            <IntelligenceCard
              key={a._id}
              article={a}
              onToggleBookmark={onToggleBookmark}
              isAdmin={isAdmin}
              onEdit={(art) => setArticleForm({ open: true, editing: art })}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <ArticleForm
        open={articleForm.open}
        editing={articleForm.editing}
        onClose={() => setArticleForm({ open: false, editing: null })}
        onSaved={loadArticles}
      />
      <MarketEditor open={marketOpen} current={market} onClose={() => setMarketOpen(false)} onSaved={() => getMarket().then((r) => setMarketState(r.data.indicators || []))} />

      <Modal open={topicsOpen} onClose={() => setTopicsOpen(false)} title="Follow topics">
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Pick what you care about — the “For you” feed adapts to your choices.
        </p>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => {
            const on = interests.includes(t.value);
            return (
              <button
                key={t.value}
                onClick={() => saveInterests(on ? interests.filter((i) => i !== t.value) : [...interests, t.value])}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  on ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {t.value}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
