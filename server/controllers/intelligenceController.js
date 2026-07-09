const Article = require('../models/IntelligenceArticle');
const MarketSnapshot = require('../models/MarketSnapshot');
const Bookmark = require('../models/Bookmark');
const User = require('../models/User');

const { CATEGORIES } = Article;

// ---- Articles (read) ----

exports.listArticles = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && CATEGORIES.includes(req.query.category)) {
      filter.category = req.query.category;
    }
    const articles = await Article.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Mark which ones the caller has bookmarked.
    const bookmarks = await Bookmark.find({ user: req.user.userId }).select('article').lean();
    const saved = new Set(bookmarks.map((b) => b.article.toString()));
    res.json(articles.map((a) => ({ ...a, bookmarked: saved.has(a._id.toString()) })));
  } catch (err) {
    next(err);
  }
};

exports.listBookmarked = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user.userId })
      .populate({ path: 'article', populate: { path: 'createdBy', select: 'name' } })
      .sort({ createdAt: -1 })
      .lean();
    const articles = bookmarks
      .filter((b) => b.article)
      .map((b) => ({ ...b.article, bookmarked: true }));
    res.json(articles);
  } catch (err) {
    next(err);
  }
};

exports.toggleBookmark = async (req, res, next) => {
  try {
    const existing = await Bookmark.findOne({ user: req.user.userId, article: req.params.id });
    if (existing) {
      await existing.deleteOne();
      return res.json({ bookmarked: false });
    }
    await Bookmark.create({ user: req.user.userId, article: req.params.id });
    res.json({ bookmarked: true });
  } catch (err) {
    next(err);
  }
};

// ---- Interests (personalization) ----

exports.setInterests = async (req, res, next) => {
  try {
    const interests = Array.isArray(req.body.interests) ? req.body.interests.slice(0, 12) : [];
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { interests },
      { new: true, runValidators: true }
    ).select('interests');
    res.json({ interests: user.interests });
  } catch (err) {
    next(err);
  }
};

// ---- Market snapshot ----

exports.getMarket = async (req, res, next) => {
  try {
    const snapshot = await MarketSnapshot.findOne().sort({ updatedAt: -1 });
    res.json(snapshot || { indicators: [], updatedAt: null });
  } catch (err) {
    next(err);
  }
};

exports.setMarket = async (req, res, next) => {
  try {
    const indicators = Array.isArray(req.body.indicators) ? req.body.indicators.slice(0, 10) : [];
    // Keep a single snapshot document — replace it each time.
    await MarketSnapshot.deleteMany({});
    const snapshot = await MarketSnapshot.create({ indicators, updatedBy: req.user.userId });
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
};

// ---- Articles (admin write) ----

const ARTICLE_FIELDS = [
  'headline',
  'summary',
  'whyItMatters',
  'category',
  'mbaConcepts',
  'industries',
  'interviewRelevance',
  'keyTakeaways',
  'interviewQuestions',
  'businessTerms',
  'source',
  'sourceUrl',
  'newsOfTheDay',
];

const pickArticle = (body) => {
  const out = {};
  for (const f of ARTICLE_FIELDS) if (body[f] !== undefined) out[f] = body[f];
  return out;
};

exports.createArticle = async (req, res, next) => {
  try {
    const data = pickArticle(req.body);
    if (!data.headline || !data.summary || !data.category) {
      return res.status(400).json({ message: 'Headline, summary and category are required' });
    }
    // Only one "News of the Day" at a time.
    if (data.newsOfTheDay) await Article.updateMany({}, { newsOfTheDay: false });
    const article = await Article.create({ ...data, createdBy: req.user.userId });
    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
};

exports.updateArticle = async (req, res, next) => {
  try {
    const data = pickArticle(req.body);
    if (data.newsOfTheDay) await Article.updateMany({ _id: { $ne: req.params.id } }, { newsOfTheDay: false });
    const article = await Article.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!article) return res.status(404).json({ message: 'Article not found' });
    res.json(article);
  } catch (err) {
    next(err);
  }
};

exports.deleteArticle = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: 'Article not found' });
    await article.deleteOne();
    await Bookmark.deleteMany({ article: article._id });
    res.json({ message: 'Article deleted' });
  } catch (err) {
    next(err);
  }
};
