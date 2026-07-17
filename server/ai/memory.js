/**
 * Phase 3 — AI Memory Layer
 * Read/write helpers for UserMemory. Every AI route should call
 * getUserMemory() and pass the result as context to the prompt.
 */

const UserMemory = require('../models/UserMemory');
const User       = require('../models/User');
const UserProfile = require('../models/UserProfile');
const StudentIdentity = require('../models/StudentIdentity');
const Resume     = require('../models/Resume');
const Task       = require('../models/Task');
const Note       = require('../models/Note');

// ── Read ───────────────────────────────────────────────────────────────────

async function getUserMemory(userId) {
  let mem = await UserMemory.findOne({ user: userId }).lean();
  if (!mem) {
    // Bootstrap from existing user data on first access
    mem = await bootstrapMemory(userId);
  }
  return mem;
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

async function bootstrapMemory(userId) {
  const [identity, resume, taskCount, noteCount] = await Promise.all([
    StudentIdentity.findOne({ user: userId }).lean(),
    Resume.findOne({ user: userId }).select('skills summary').lean(),
    Task.countDocuments({ $or: [{ createdBy: userId }, { assignee: userId }], status: 'done' }),
    // Note is authored, not owned — the field is `author`. This filtered on a
    // non-existent `user` field, so notesCount was always 0 for every student.
    Note.countDocuments({ author: userId }),
  ]);

  // Fallback: read from legacy models if StudentIdentity not yet created
  let specialization = identity?.specialization || null;
  let careerInterests = identity?.careerInterests || [];
  let bio = identity?.bio || '';
  let college = identity?.college || '';
  let course = identity?.course || '';
  let learningStyle = identity?.learningStyle || '';
  let workExYears = identity?.workExYears || null;
  let pastDomain = identity?.pastDomain || '';
  let goals = identity?.goals || [];
  let timeAvailable = identity?.timeAvailable || '';

  if (!identity) {
    const [user, profile] = await Promise.all([
      User.findById(userId).select('interests bio name').lean(),
      UserProfile.findOne({ user: userId }).select('specialization careerInterests college course priorDomain learningStyle goals experience').lean(),
    ]);
    careerInterests = profile?.careerInterests || user?.interests || [];
    bio = user?.bio || '';
    college = profile?.college || '';
    course = profile?.course || '';
    learningStyle = profile?.learningStyle || '';
    workExYears = user?.workExYears || profile?.experience?.years || null;
    pastDomain = profile?.experience?.pastDomain || profile?.priorDomain || '';
    if (profile?.goals) {
      goals = StudentIdentity.goalsSubdocToArray ? StudentIdentity.goalsSubdocToArray(profile.goals) : [];
    }
    if (!specialization) specialization = profile?.specialization || null;
    timeAvailable = '';
  }

  // Use stored specialization; infer from keywords as fallback
  const skills = resume?.skills || identity?.skills || [];
  if (!specialization) {
    const specMap = {
      Finance:    ['finance', 'banking', 'equity', 'investment', 'cfa', 'valuation'],
      Marketing:  ['marketing', 'brand', 'consumer', 'campaign', 'digital'],
      Operations: ['operations', 'supply chain', 'logistics', 'scm', 'lean'],
      HR:         ['hr', 'human resources', 'people', 'talent', 'opm'],
      Consulting: ['consulting', 'strategy', 'mckinsey', 'bcg', 'bain'],
    };

    const pool = [...careerInterests, ...skills].map((s) => s.toLowerCase());
    let maxScore = 0;
    for (const [spec, keywords] of Object.entries(specMap)) {
      const score = keywords.filter((k) => pool.some((p) => p.includes(k))).length;
      if (score > maxScore) { maxScore = score; specialization = spec; }
    }
  }

  const data = {
    user: userId,
    specialization,
    careerInterests,
    timeAvailable: timeAvailable || undefined,
    contextSummary: [specialization, bio, college, course, pastDomain, learningStyle, timeAvailable, ...(goals || [])]
      .filter(Boolean)
      .join(' | ') || undefined,
    resumeCompletionPct: _resumeCompletionPct(resume),
    tasksCompletedCount: taskCount,
    notesCount: noteCount,
    lastFullRefresh: new Date(),
  };

  return UserMemory.findOneAndUpdate(
    { user: userId },
    { $set: data },
    { upsert: true, new: true, lean: true }
  );
}

function _resumeCompletionPct(resume) {
  if (!resume) return 0;
  const fields = ['summary', 'education', 'experience', 'skills', 'projects', 'achievements'];
  const filled = fields.filter((f) => {
    const v = resume[f];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  });
  return Math.round((filled.length / fields.length) * 100);
}

// ── Update individual facts ────────────────────────────────────────────────

async function updateMemory(userId, patch) {
  return UserMemory.findOneAndUpdate(
    { user: userId },
    { $set: patch },
    { upsert: true, new: true, lean: true }
  );
}

async function appendTopic(userId, topic) {
  // Rolling window of 10 topics
  return UserMemory.findOneAndUpdate(
    { user: userId },
    {
      $push: { recentTopics: { $each: [topic], $slice: -10 } },
    },
    { upsert: true, new: true }
  );
}

// ── Format memory as context string for prompt injection ──────────────────

function formatMemoryContext(mem) {
  if (!mem) return '';
  const lines = [];
  if (mem.specialization)       lines.push(`Specialization: ${mem.specialization}`);
  if (mem.careerInterests?.length)  lines.push(`Career Interests: ${mem.careerInterests.join(', ')}`);
  if (mem.targetCompanies?.length)  lines.push(`Target Companies: ${mem.targetCompanies.join(', ')}`);
  if (mem.readinessScore != null)   lines.push(`Placement Readiness Score: ${mem.readinessScore}/100`);
  if (mem.resumeCompletionPct != null) lines.push(`Resume Completion: ${mem.resumeCompletionPct}%`);
  if (mem.strengths?.length)        lines.push(`Strengths: ${mem.strengths.join(', ')}`);
  if (mem.weaknesses?.length)       lines.push(`Areas to improve: ${mem.weaknesses.join(', ')}`);
  if (mem.recentTopics?.length)     lines.push(`Recently discussed with you: ${mem.recentTopics.slice(-5).join(', ')}`);
  if (mem.timeAvailable)            lines.push(`Study Time Available: ${mem.timeAvailable}`);
  if (mem.contextSummary)           lines.push(`Context: ${mem.contextSummary}`);
  if (!lines.length) return '';
  return `[Dax Memory — what you remember about this student]\n${lines.join('\n')}\n`;
}

module.exports = { getUserMemory, bootstrapMemory, updateMemory, appendTopic, formatMemoryContext };
