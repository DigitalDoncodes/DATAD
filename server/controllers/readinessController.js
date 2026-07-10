const Resume = require('../models/Resume');
const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const CompanyRead = require('../models/CompanyRead');
const Task = require('../models/Task');

// Placement readiness: one 0-100 number computed from what the student has
// actually done on the platform, with a per-component breakdown and the
// concrete next action for whatever is dragging the score down.

const scoreResume = (resume) => {
  let pts = 0;
  const missing = [];
  if (!resume) {
    return { pts: 0, hint: 'Start your resume — it is the single biggest gap' };
  }
  const p = resume.personal || {};
  if (p.fullName && p.email && p.phone) pts += 5;
  else missing.push('contact details');
  if (resume.summary && resume.summary.length >= 50) pts += 5;
  else missing.push('a professional summary');
  if (resume.education?.length) pts += 5;
  else missing.push('education');
  if (resume.experience?.length || resume.projects?.length) pts += 10;
  else missing.push('experience or projects');
  if ((resume.skills?.length || 0) >= 5) pts += 5;
  else missing.push('at least 5 skills');
  if (resume.certifications?.length || resume.achievements?.length) pts += 5;
  else missing.push('certifications or achievements');
  const hint = missing.length ? `Resume: add ${missing[0]}` : null;
  return { pts, hint };
};

exports.getReadiness = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [resume, user, bookmarks, companiesStudied, tasksDone, upcoming] = await Promise.all([
      Resume.findOne({ user: userId }).lean(),
      User.findById(userId).select('bio linkedin github interests').lean(),
      Bookmark.countDocuments({ user: userId }),
      CompanyRead.countDocuments({ user: userId }),
      Task.countDocuments({
        status: 'done',
        $or: [{ createdBy: userId }, { assignee: userId }],
      }),
      Task.countDocuments({
        status: { $ne: 'done' },
        dueDate: { $gte: new Date() },
        $or: [{ createdBy: userId }, { assignee: userId }],
      }),
    ]);

    // --- Resume strength (max 35) ---
    const resumeScore = scoreResume(resume);

    // --- Company research (max 25): 5 pts per card studied, cap 5 ---
    const companyPts = Math.min(companiesStudied, 5) * 5;
    const companyHint =
      companiesStudied < 5
        ? `Study ${5 - companiesStudied} more company prep card${5 - companiesStudied === 1 ? '' : 's'}`
        : null;

    // --- Market awareness (max 20): bookmarks (15) + interests set (5) ---
    const bookmarkPts = Math.min(bookmarks, 5) * 3;
    const interestPts = user?.interests?.length ? 5 : 0;
    const marketPts = bookmarkPts + interestPts;
    const marketHint = !interestPts
      ? 'Pick your news interests on the News page'
      : bookmarks < 5
        ? 'Bookmark news articles you could discuss in an interview'
        : null;

    // --- Planner discipline (max 20): done tasks (15) + something scheduled (5) ---
    const taskPts = Math.min(tasksDone, 3) * 5 + (upcoming > 0 ? 5 : 0);
    const plannerHint =
      upcoming === 0
        ? 'Add your next deadline or prep goal to the Planner'
        : tasksDone < 3
          ? 'Complete tasks in the Planner to build momentum'
          : null;

    // --- Profile (implicit in resume; profile links are a small booster elsewhere) ---
    const components = [
      { key: 'resume', label: 'Resume strength', points: resumeScore.pts, max: 35, hint: resumeScore.hint },
      { key: 'companies', label: 'Company research', points: companyPts, max: 25, hint: companyHint },
      { key: 'market', label: 'Market awareness', points: marketPts, max: 20, hint: marketHint },
      { key: 'planner', label: 'Planner discipline', points: taskPts, max: 20, hint: plannerHint },
    ];

    const score = components.reduce((s, c) => s + c.points, 0);
    // The next action = the hint from the weakest component (by % complete).
    const weakest = [...components]
      .filter((c) => c.hint)
      .sort((a, b) => a.points / a.max - b.points / b.max)[0];

    res.json({
      score,
      components,
      nextAction: weakest ? weakest.hint : 'You are placement-ready — keep the streak going!',
    });
  } catch (err) {
    next(err);
  }
};
