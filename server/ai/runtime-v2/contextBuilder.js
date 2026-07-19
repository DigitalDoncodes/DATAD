const User = require('../../models/User');
const UserProfile = require('../../models/UserProfile');
const StudentIdentity = require('../../models/StudentIdentity');
const UserMemory = require('../../models/UserMemory');
const Resume = require('../../models/Resume');
const Task = require('../../models/Task');
const Note = require('../../models/Note');
const ChatMessage = require('../../models/ChatMessage');
const SiteMeta = require('../../models/SiteMeta');
const Expense = require('../../models/Expense');
const Company = require('../../models/Company');
const { computeDailyCaseStreak } = require('../../utils/streak');

const MAX_RECENT_CONVERSATIONS = 6;
const MAX_RECENT_NOTES = 3;

const CONTEXT_KEY_LOADERS = {
  user: (userId) =>
    User.findById(userId).select('name email tier tierExpiresAt batch program college semester interests bio').lean(),
  profile: async (userId) => {
    const [profile, identity] = await Promise.all([
      UserProfile.findOne({ user: userId }).select('specialization careerInterests college course priorDomain learningStyle goals').lean(),
      StudentIdentity.findOne({ user: userId }).select('domainPrimary domainTags').lean(),
    ]);
    if (!profile) return identity ? { domainPrimary: identity.domainPrimary, domainTags: identity.domainTags } : null;
    return { ...profile, domainPrimary: identity?.domainPrimary, domainTags: identity?.domainTags };
  },
  memory: (userId) =>
    UserMemory.findOne({ user: userId }).lean(),
  resume: (userId) =>
    Resume.findOne({ user: userId }).select('personal.fullName summary skills experience education projects achievements certifications').lean(),
  placement: (userId, ctx) => {
    if (ctx.siteMeta) return Promise.resolve(ctx.siteMeta);
    return SiteMeta.findOne({ key: 'main' }).select('placementDate batchName').lean();
  },
  planner: async (userId) => {
    const tasks = await Task.find({
      $or: [{ createdBy: userId }, { assignee: userId }],
      status: { $ne: 'done' },
    }).sort({ dueDate: 1 }).limit(5).select('title dueDate type status priority').lean();
    return tasks;
  },
  study: async (userId) => {
    const notes = await Note.find({ author: userId })
      .sort({ updatedAt: -1 }).limit(MAX_RECENT_NOTES)
      .select('title subject updatedAt').lean();
    return notes;
  },
  note: async (userId, ctx) => {
    if (!ctx.noteIds || ctx.noteIds.length === 0) return [];
    return Note.find({ _id: { $in: ctx.noteIds }, author: userId })
      .limit(5).select('title subject content updatedAt').lean();
  },
  finance: async (userId) => {
    const month = new Date().toISOString().slice(0, 7);
    const expenses = await Expense.find({ user: userId, month })
      .sort({ date: -1 }).limit(50).lean();
    const summary = await Expense.aggregate([
      { $match: { user: userId, month } },
      {
        $group: {
          _id: '$kind',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    return { expenses, summary };
  },
  career: (userId) =>
    UserMemory.findOne({ user: userId }).select('specialization careerInterests targetCompanies targetRoles readinessScore').lean(),
  company: async (userId, ctx) => {
    if (!ctx.companyIds || ctx.companyIds.length === 0) return null;
    return Company.find({ _id: { $in: ctx.companyIds } }).limit(2).lean();
  },
  companies: async (userId, ctx) => {
    if (!ctx.companySlugs || ctx.companySlugs.length !== 2) return null;
    return Company.find({ slug: { $in: ctx.companySlugs } }).limit(2).lean();
  },
  conversations: async (userId) => {
    return ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 }).limit(MAX_RECENT_CONVERSATIONS)
      .select('role content createdAt').lean();
  },
  streak: async (userId) => {
    return computeDailyCaseStreak(userId).catch(() => 0);
  },
};

async function buildContext(userId, options = {}) {
  const {
    contextKeys = ['user', 'profile', 'memory', 'placement', 'planner', 'study'],
    noteIds = [],
    companyIds = [],
    companySlugs = [],
  } = options;

  const ctx = { userId, noteIds, companyIds, companySlugs };
  const today = new Date().toISOString().slice(0, 10);

  const resolvedKeys = contextKeys.includes('all')
    ? Object.keys(CONTEXT_KEY_LOADERS)
    : contextKeys;

  const deduped = [...new Set(resolvedKeys)];
  const results = {};

  for (const key of deduped) {
    const loader = CONTEXT_KEY_LOADERS[key];
    if (!loader) continue;
    try {
      results[key] = await loader(userId, ctx);
    } catch {
      results[key] = key === 'study' ? [] : key === 'planner' ? [] : key === 'note' ? [] : key === 'finance' ? { expenses: [], summary: [] } : null;
    }
  }

  const user = results.user;
  const profile = results.profile;
  const userMemory = results.memory;
  const resume = results.resume;
  const placementMeta = results.placement;
  const pendingTasks = results.planner || [];
  const recentNotes = results.study || [];
  const notes = results.note || [];
  const finance = results.finance || { expenses: [], summary: [] };
  const careerMem = results.career;
  const companyData = results.company;
  const companiesData = results.companies;
  const conversations = results.conversations || [];
  const streak = results.streak || 0;

  const placementDate = placementMeta?.placementDate
    ? Math.ceil((new Date(placementMeta.placementDate) - new Date()) / 86400000)
    : null;

  const effectiveTier = (() => {
    if (!user) return 'free';
    if (user.tierExpiresAt && new Date() > new Date(user.tierExpiresAt)) return 'free';
    return user.tier || 'free';
  })();

  const context = {};
  if (contextKeys.includes('all') || contextKeys.includes('user')) {
    context.user = {
      id: userId, name: user?.name || '', email: user?.email || '',
      tier: effectiveTier, batch: user?.batch || placementMeta?.batchName || '',
      college: user?.college || profile?.college || '',
      semester: user?.semester || '', program: user?.program || profile?.course || '',
      interests: user?.interests || [], bio: user?.bio || '',
    };
  }
  if (contextKeys.includes('all') || contextKeys.includes('career')) {
    context.career = {
      specialization: profile?.specialization || careerMem?.specialization || null,
      domainPrimary: profile?.domainPrimary || null,
      domainTags: profile?.domainTags || [],
      careerInterests: profile?.careerInterests || careerMem?.careerInterests || [],
      targetCompanies: careerMem?.targetCompanies || [],
      targetRoles: careerMem?.targetRoles || [],
      readinessScore: careerMem?.readinessScore ?? null,
      learningStyle: profile?.learningStyle || 'concise',
      goals: profile?.goals || [],
    };
  }
  if (contextKeys.includes('all') || contextKeys.includes('resume')) {
    context.resume = resume ? {
      hasResume: true,
      fullName: resume.personal?.fullName || '',
      summary: resume.summary || '',
      skills: resume.skills || [],
      experienceCount: resume.experience?.length || 0,
      educationCount: resume.education?.length || 0,
      projectCount: resume.projects?.length || 0,
      achievementCount: resume.achievements?.length || 0,
      completionPct: userMemory?.resumeCompletionPct || 0,
    } : { hasResume: false };
  }
  if (contextKeys.includes('all') || contextKeys.includes('memory')) {
    context.memory = userMemory ? {
      recentTopics: userMemory.recentTopics || [],
      strengths: userMemory.strengths || [],
      weaknesses: userMemory.weaknesses || [],
      preferredExplanationStyle: userMemory.preferredExplanationStyle || 'concise',
      contextSummary: userMemory.contextSummary || '',
      notesCount: userMemory.notesCount || 0,
      tasksCompletedCount: userMemory.tasksCompletedCount || 0,
      savedCompanies: userMemory.savedCompanies || [],
    } : null;
  }
  if (contextKeys.includes('all') || contextKeys.includes('planner')) {
    context.planner = {
      pendingTasks: pendingTasks.map((t) => ({
        title: t.title, dueDate: t.dueDate,
        type: t.type, status: t.status, priority: t.priority,
      })),
      streak,
    };
  }
  if (contextKeys.includes('all') || contextKeys.includes('study')) {
    context.study = {
      recentNotes: recentNotes.map((n) => ({
        title: n.title, subject: n.subject, updatedAt: n.updatedAt,
      })),
    };
  }
  if (contextKeys.includes('all') || contextKeys.includes('note')) {
    context.notes = notes.map((n) => ({
      title: n.title, subject: n.subject,
      content: (n.content || '').slice(0, 4000),
      updatedAt: n.updatedAt,
    }));
  }
  if (contextKeys.includes('all') || contextKeys.includes('finance')) {
    const income = (finance.summary || []).find((s) => s._id === 'income');
    const expense = (finance.summary || []).find((s) => s._id === 'expense');
    context.finance = {
      totalIncome: income?.total || 0,
      totalExpenses: expense?.total || 0,
      transactionCount: finance.expenses?.length || 0,
    };
  }
  if (contextKeys.includes('all') || contextKeys.includes('placement')) {
    context.placement = {
      daysToPlacement: placementDate,
      batchName: placementMeta?.batchName || '',
    };
  }
  if (contextKeys.includes('company')) {
    context.company = companyData ? companyData.map((c) => ({
      name: c.name, industry: c.industry, description: (c.description || '').slice(0, 1000),
    })) : [];
  }
  if (contextKeys.includes('companies')) {
    context.companies = companiesData ? companiesData.map((c) => ({
      name: c.name, slug: c.slug, industry: c.industry,
    })) : [];
  }
  if (contextKeys.includes('all') || contextKeys.includes('conversations')) {
    context.conversations = conversations.map((m) => ({
      role: m.role, content: (m.content || '').slice(0, 200),
    }));
  }

  context.system = { today };
  context.summary = buildSummary(context);
  context.text = formatContextAsText(context);
  return context;
}

function buildSummary(ctx) {
  const parts = [];
  if (ctx.user?.name) parts.push(`Student: ${ctx.user.name}`);
  if (ctx.user?.batch) parts.push(`Batch: ${ctx.user.batch}`);
  if (ctx.career?.specialization) parts.push(`Specialization: ${ctx.career.specialization}`);
  if (ctx.career?.domainPrimary) parts.push(`Field of study (domain): ${ctx.career.domainPrimary}`);
  if (ctx.placement?.daysToPlacement !== null && ctx.placement?.daysToPlacement !== undefined) parts.push(`Days to placement: ${ctx.placement.daysToPlacement}`);
  if (ctx.resume?.hasResume) parts.push(`Resume: ${ctx.resume.skills.length} skills, ${ctx.resume.experienceCount} experiences`);
  if (ctx.planner?.streak > 0) parts.push(`Case streak: ${ctx.planner.streak} days`);
  if (ctx.planner?.pendingTasks?.length) parts.push(`Pending tasks: ${ctx.planner.pendingTasks.length}`);
  if (ctx.memory?.recentTopics?.length) parts.push(`Recent topics: ${ctx.memory.recentTopics.slice(-3).join(', ')}`);
  if (ctx.memory?.strengths?.length) parts.push(`Strengths: ${ctx.memory.strengths.join(', ')}`);
  if (ctx.memory?.weaknesses?.length) parts.push(`Areas to improve: ${ctx.memory.weaknesses.join(', ')}`);
  if (ctx.finance) parts.push(`Finance: ₹${(ctx.finance.totalIncome || 0).toLocaleString('en-IN')} income, ₹${(ctx.finance.totalExpenses || 0).toLocaleString('en-IN')} expenses`);
  return parts;
}

function formatContextAsText(ctx) {
  if (!ctx) return '';
  return `[Student Context]\n${ctx.summary.join('\n')}\n`;
}

module.exports = { buildContext, formatContextAsText, CONTEXT_KEY_LOADERS };
