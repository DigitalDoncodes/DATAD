const mongoose = require('mongoose');

// A single, admin-maintained set of market indicators shown across the app.
const marketSnapshotSchema = new mongoose.Schema(
  {
    indicators: [
      {
        label: { type: String, required: true, maxlength: 40 },
        value: { type: String, required: true, maxlength: 40 },
        change: { type: String, maxlength: 40 }, // e.g. "+0.8%" or "-120"
      },
    ],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MarketSnapshot', marketSnapshotSchema);
