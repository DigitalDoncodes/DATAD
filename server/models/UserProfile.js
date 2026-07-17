const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],
    clubs: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    linkedin: { type: String, trim: true },
    github: { type: String, trim: true },
    portfolio: { type: String, trim: true },
    batch: { type: String, trim: true },
    specialization: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 300 },
    lookingFor: { type: String, trim: true },
    priorDomain: { type: String, trim: true, maxlength: 80 },

    // New fields for the Student/Learning Profile
    college: { type: String, trim: true },
    course: { type: String, trim: true },
    department: { type: String, trim: true },
    semester: { type: String, trim: true }, // e.g., "Semester 3" or "3"
    graduationYear: { type: Number, min: 1900, max: 2100 },
    dreamRole: { type: String, trim: true },
    preferredIndustries: [{ type: String, trim: true }],
    careerInterests: [{ type: String, trim: true }],
    favouriteSubjects: [{ type: String, trim: true }],
    difficultSubjects: [{ type: String, trim: true }],
    learningStyle: {
      type: String,
      enum: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic', 'Multimodal', 'Other'],
      default: 'Other'
    },
    goals: {
      placement: { type: Boolean, default: false },
      higherStudies: { type: Boolean, default: false },
      entrepreneurship: { type: Boolean, default: false },
      financialLiteracy: { type: Boolean, default: false },
      leadership: { type: Boolean, default: false },
      communication: { type: Boolean, default: false },
      research: { type: Boolean, default: false },
      certifications: { type: Boolean, default: false },
      skillBuilding: { type: Boolean, default: false },
      networking: { type: Boolean, default: false },
      interviewPrep: { type: Boolean, default: false },
      resumeBuilding: { type: Boolean, default: false }
    },
    experience: {
      years: { type: Number, min: 0, max: 50, default: 0 },
      type: {
        type: String,
        enum: ['fresher', 'intern', 'entry-level', 'mid-level', 'senior', 'experienced', 'other'],
        default: 'fresher'
      },
      pastDomain: { type: String, trim: true } // e.g., IT, Finance, Marketing
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);