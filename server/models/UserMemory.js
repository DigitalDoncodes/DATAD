/**
 * Phase 3 — AI Memory
 * One document per user. Stores long-term AI-relevant context so every
 * request understands the user without asking repeatedly.
 */
const mongoose = require('mongoose');

const userMemorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },

    // Career profile
    specialization: { type: String, maxlength: 80 },        // e.g., Finance, Marketing, Operations, HR, etc.
    careerInterests:   { type: [String], default: [] },        // ['consulting', 'investment banking']
    targetCompanies:   { type: [String], default: [] },
    targetRoles:       { type: [String], default: [] },

    // Readiness snapshot (refreshed from ReadinessScore)
    readinessScore:    { type: Number, min: 0, max: 100 },
    readinessUpdatedAt: { type: Date },

    // Engagement signals
    resumeCompletionPct: { type: Number, min: 0, max: 100 },
    tasksCompletedCount: { type: Number, default: 0 },
    notesCount:          { type: Number, default: 0 },
    savedCompanies:      { type: [String], default: [] },      // company slugs

    // Finance behaviour
    financeTracking: { type: Boolean, default: false },

    // AI interaction history — last N summaries, not raw transcripts
    recentTopics: { type: [String], default: [] },             // rolling last-10 topics discussed
    preferredExplanationStyle: {
      type: String,
      enum: ['concise', 'detailed', 'framework-heavy', 'example-heavy'],
      default: 'concise',
    },

    // Personalization hints updated by AI interactions
    strengths:   { type: [String], default: [] },
    weaknesses:  { type: [String], default: [] },

    // Free-form context blob (updated by memory.js utilities)
    contextSummary: { type: String, maxlength: 2000 },

    // When was this memory last rebuilt from scratch
    lastFullRefresh: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserMemory', userMemorySchema);
