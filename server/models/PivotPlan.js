const mongoose = require('mongoose');

const pivotPlanSchema = new mongoose.Schema({
  user:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fromDomain:       { type: String, trim: true, maxlength: 80 },
  fromRole:         { type: String, trim: true, maxlength: 120 },
  fromYears:        { type: Number, min: 0, max: 40 },
  toDomain:         { type: String, trim: true, maxlength: 80 },
  toRole:           { type: String, trim: true, maxlength: 120 },
  motivation:       { type: String, trim: true, maxlength: 2000 },
  skillGaps: [{
    skill:  { type: String, trim: true, maxlength: 100 },
    status: { type: String, enum: ['not-started', 'in-progress', 'done'], default: 'not-started' },
  }],
  targetCompanies: [{ type: String, trim: true, maxlength: 100 }],
}, { timestamps: true });

module.exports = mongoose.model('PivotPlan', pivotPlanSchema);
