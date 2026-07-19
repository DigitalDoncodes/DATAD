const mongoose = require('mongoose');

const LEARNING_STYLE_MAP = {
  Videos: 'Visual',
  Reading: 'Reading/Writing',
  Practice: 'Kinesthetic',
  Discussion: 'Auditory',
  AI: 'Other',
  Mixed: 'Multimodal',
};

const VALID_LEARNING_STYLES = [
  'Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Multimodal', 'Other',
];

const GOAL_MAP = [
  { key: 'placement', label: 'Placement / Internship' },
  { key: 'higherStudies', label: 'Higher Studies' },
  { key: 'entrepreneurship', label: 'Entrepreneurship' },
  { key: 'financialLiteracy', label: 'Financial Literacy' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'communication', label: 'Communication' },
  { key: 'research', label: 'Research' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'skillBuilding', label: 'Skill Building' },
  { key: 'networking', label: 'Networking' },
  { key: 'interviewPrep', label: 'Interview Preparation' },
  { key: 'resumeBuilding', label: 'Resume Building' },
];

const studentIdentitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

  // ── Basics ──────────────────────────────────────────────────────────────
  name: { type: String, trim: true, maxlength: 80 },
  email: { type: String, lowercase: true, trim: true, maxlength: 120 },
  rollNumber: { type: String, trim: true, default: '' },
  avatarUrl: { type: String, maxlength: 500, default: '' },
  bio: { type: String, maxlength: 300, default: '' },
  linkedin: { type: String, maxlength: 200, default: '' },
  github: { type: String, maxlength: 200, default: '' },
  portfolio: { type: String, maxlength: 200, default: '' },

  // ── Academic ────────────────────────────────────────────────────────────
  college: { type: String, trim: true, default: '' },
  course: { type: String, trim: true, default: '' },
  department: { type: String, trim: true, default: '' },
  semester: { type: String, trim: true, default: '' },
  batch: { type: String, trim: true, default: '' },
  graduationYear: { type: Number, min: 1900, max: 2100, default: null },
  specialization: { type: String, trim: true, default: '' },

  // ── Personalization ─────────────────────────────────────────────────────
  // Precomputed by utils/domainClassifier so news/opportunities/briefing can
  // filter/rank cheaply without reclassifying free text on every request.
  domainPrimary: { type: String, default: 'general', index: true },
  domainTags: [{ type: String, index: true }],

  // ── Professional ────────────────────────────────────────────────────────
  studentType: { type: String, enum: ['fresher', 'experienced'], default: 'fresher' },
  workExYears: { type: Number, min: 0, max: 40, default: null },
  pastDomain: { type: String, trim: true, default: '' },
  priorDomain: { type: String, trim: true, maxlength: 80, default: '' },
  lookingFor: { type: String, trim: true, default: '' },

  // ── Preferences & Interests ─────────────────────────────────────────────
  interests: [{ type: String, trim: true }],
  skills: [{ type: String, trim: true }],
  clubs: [{ type: String, trim: true }],
  languages: [{ type: String, trim: true }],
  careerInterests: [{ type: String, trim: true }],
  favouriteSubjects: [{ type: String, trim: true }],
  difficultSubjects: [{ type: String, trim: true }],
  preferredIndustries: [{ type: String, trim: true }],
  dreamRole: { type: String, trim: true, default: '' },
  targetCompanies: [{ type: String, trim: true }],
  targetRoles: [{ type: String, trim: true }],
  learningStyle: {
    type: String,
    enum: [...VALID_LEARNING_STYLES, ''],
    default: '',
  },
  timeAvailable: { type: String, trim: true, default: '' },

  // ── Goals (stored as array of goal keys for simplicity) ─────────────────
  goals: [{ type: String, trim: true }],

  // ── Challenges ──────────────────────────────────────────────────────────
  challenges: [{ type: String, trim: true }],
}, { timestamps: true });

function normalizeLearningStyle(value) {
  if (!value) return '';
  if (VALID_LEARNING_STYLES.includes(value)) return value;
  return LEARNING_STYLE_MAP[value] || 'Other';
}

function goalsArrayToSubdoc(goals) {
  if (!goals || !Array.isArray(goals)) return {};
  const subdoc = {};
  for (const entry of GOAL_MAP) {
    subdoc[entry.key] = goals.some((g) =>
      g.toLowerCase().replace(/[\s/-]/g, '') === entry.key.toLowerCase() ||
      g.toLowerCase().includes(entry.label.split('/')[0].toLowerCase().trim())
    );
  }
  return subdoc;
}

function goalsSubdocToArray(subdoc) {
  if (!subdoc || typeof subdoc !== 'object') return [];
  return GOAL_MAP.filter((entry) => subdoc[entry.key]).map((entry) => entry.label);
}

studentIdentitySchema.statics.normalizeLearningStyle = normalizeLearningStyle;
studentIdentitySchema.statics.goalsArrayToSubdoc = goalsArrayToSubdoc;
studentIdentitySchema.statics.goalsSubdocToArray = goalsSubdocToArray;
studentIdentitySchema.statics.GOAL_MAP = GOAL_MAP;
studentIdentitySchema.statics.VALID_LEARNING_STYLES = VALID_LEARNING_STYLES;

module.exports = mongoose.model('StudentIdentity', studentIdentitySchema);
