function createEmptyProfile(userId) {
  return {
    userId,
    collectedAt: new Date().toISOString(),
    student: null,
    identity: null,
    memory: null,
    knowledge: null,
    planner: null,
    tasks: null,
    notes: null,
    calendar: null,
    workspace: null,
    activity: null,
    career: null,
    learning: null,
    study: null,
    stress: null,
    exams: null,
    placement: null,
    scores: {
      currentFocus: 'general',
      currentChallenges: [],
      recommendedTone: 'neutral',
      recommendedResponseLength: 'moderate',
      recommendedExamples: [],
      urgencyLevel: 0,
      motivationLevel: 50,
      confidence: 50,
      learningVelocity: 50,
      careerReadiness: 0,
      contextQualityScore: 0,
      intelligenceScore: 50,
    },
    enrichedContext: '',
  };
}

function buildProfile(userId, collected, scores) {
  const profile = createEmptyProfile(userId);
  profile.student = collected.student || null;
  profile.identity = collected.identity || null;
  profile.memory = collected.memory || null;
  profile.knowledge = collected.knowledge || null;
  profile.planner = collected.planner || null;
  profile.tasks = collected.tasks || null;
  profile.notes = collected.notes || null;
  profile.calendar = collected.calendar || null;
  profile.workspace = collected.workspace || null;
  profile.activity = collected.activity || null;
  profile.career = collected.career || null;
  profile.learning = collected.learning || null;
  profile.study = collected.study || null;
  profile.stress = collected.stress || null;
  profile.exams = collected.exams || null;
  profile.placement = collected.placement || null;
  profile.scores = scores;
  profile.enrichedContext = buildEnrichedContext(collected, scores);
  return profile;
}

function buildEnrichedContext(collected, scores) {
  const parts = [];

  if (collected.identity) {
    const i = collected.identity;
    parts.push(`Student: ${i.name || 'Unknown'}`);
    if (i.batch) parts.push(`Batch: ${i.batch}`);
    if (i.specialization) parts.push(`Specialization: ${i.specialization}`);
    if (i.daysToPlacement != null) parts.push(`Days to placement: ${i.daysToPlacement}`);
    if (i.tier) parts.push(`Plan: ${i.tier}`);
  }

  if (collected.career) {
    const c = collected.career;
    if (c.readinessScore != null) parts.push(`Placement readiness: ${c.readinessScore}/100`);
    if (c.targetRoles?.length) parts.push(`Target roles: ${c.targetRoles.slice(0, 3).join(', ')}`);
    if (c.targetCompanies?.length) parts.push(`Target companies: ${c.targetCompanies.slice(0, 3).join(', ')}`);
    if (c.appliedCount != null) parts.push(`Applications: ${c.appliedCount}`);
    if (c.skills?.length) parts.push(`Skills: ${c.skills.slice(0, 6).join(', ')}`);
  }

  if (collected.tasks) {
    const t = collected.tasks;
    if (t.pending > 0) parts.push(`Pending tasks: ${t.pending}`);
    if (t.overdue > 0) parts.push(`Overdue: ${t.overdue}`);
    if (t.upcomingDeadlines?.length) {
      parts.push(`Upcoming deadlines: ${t.upcomingDeadlines.map((d) => d.title).join(', ')}`);
    }
  }

  if (collected.learning) {
    const l = collected.learning;
    if (l.streak > 0) parts.push(`Streak: ${l.streak} days`);
    if (l.weakTopics?.length) parts.push(`Weak areas: ${l.weakTopics.slice(0, 3).join(', ')}`);
    if (l.strongTopics?.length) parts.push(`Strong areas: ${l.strongTopics.slice(0, 3).join(', ')}`);
    if (l.studyMinutes != null) parts.push(`Study time: ${l.studyMinutes}min today`);
    if (l.consistency != null) parts.push(`Consistency: ${l.consistency}%`);
  }

  if (collected.memory?.recentTopics?.length) {
    parts.push(`Recent topics: ${collected.memory.recentTopics.slice(0, 4).join(', ')}`);
  }

  if (scores) {
    if (scores.currentFocus) parts.push(`Focus: ${scores.currentFocus}`);
    if (scores.currentChallenges?.length) parts.push(`Challenges: ${scores.currentChallenges.slice(0, 2).join('; ')}`);
    if (scores.urgencyLevel > 60) parts.push(`Urgency: High`);
    if (scores.motivationLevel < 40) parts.push(`Motivation: Low — needs encouragement`);
    if (scores.confidence < 40) parts.push(`Confidence: Low — provide clear guidance`);
  }

  // Delivery directives. scoringEngine computes recommendedTone /
  // recommendedResponseLength / recommendedExamples on every request from
  // stress level, rejection count, explanation-style preference, and the
  // student's own average query length — but until now none of the three
  // were ever emitted here, so they never reached a prompt and personalisation
  // could only change *what* Dax knew, never *how* it spoke. These are
  // phrased as instructions rather than facts because that is what they are;
  // the surrounding lines ("Motivation: Low — needs encouragement") already
  // follow the same convention.
  const directives = buildDeliveryDirectives(scores);
  if (directives) parts.push(directives);

  return parts.join(' | ');
}

const RESPONSE_LENGTH_GUIDANCE = {
  short: 'keep it under ~120 words unless asked for more',
  moderate: 'keep it under ~250 words unless asked for more',
  long: 'a fuller answer is welcome — up to ~500 words',
};

/**
 * Turns the scoringEngine's delivery recommendations into a single explicit
 * instruction clause. Returns '' when there is nothing worth saying, so the
 * caller can skip the segment entirely rather than emit a bare label.
 */
function buildDeliveryDirectives(scores) {
  if (!scores) return '';
  const clauses = [];

  if (scores.recommendedTone && scores.recommendedTone !== 'neutral') {
    clauses.push(`adopt a ${scores.recommendedTone} tone`);
  }

  const lengthGuidance = RESPONSE_LENGTH_GUIDANCE[scores.recommendedResponseLength];
  if (lengthGuidance) clauses.push(lengthGuidance);

  if (scores.recommendedExamples?.length) {
    clauses.push(`where an example helps, draw it from: ${scores.recommendedExamples.join(', ')}`);
  }

  if (!clauses.length) return '';
  return `How to respond: ${clauses.join('; ')}`;
}

module.exports = { createEmptyProfile, buildProfile, buildEnrichedContext };
