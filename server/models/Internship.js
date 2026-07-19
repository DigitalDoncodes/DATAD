const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    remote: { type: Boolean, default: false },
    stipend: { type: String, trim: true },
    duration: { type: String, trim: true },
    applyLink: { type: String, required: true, trim: true },
    deadline: { type: Date },
    eligibility: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
    // Precomputed from title/tags via utils/domainClassifier so listings can
    // be ranked by relevance to a student's field without reclassifying on
    // every request.
    domainTags: [{ type: String, index: true }],
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Internship', internshipSchema);
