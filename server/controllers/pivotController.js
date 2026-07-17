const PivotPlan = require('../models/PivotPlan');

exports.get = async (req, res, next) => {
  try {
    let plan = await PivotPlan.findOne({ user: req.user.userId });
    if (!plan) plan = await PivotPlan.create({ user: req.user.userId });
    res.json(plan);
  } catch (err) { next(err); }
};

exports.upsert = async (req, res, next) => {
  try {
    const allowed = ['fromDomain', 'fromRole', 'fromYears', 'toDomain', 'toRole', 'motivation', 'skillGaps', 'targetCompanies'];
    const update = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const plan = await PivotPlan.findOneAndUpdate(
      { user: req.user.userId },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(plan);
  } catch (err) { next(err); }
};

exports.updateGap = async (req, res, next) => {
  try {
    const { status } = req.body;
    const plan = await PivotPlan.findOne({ user: req.user.userId });
    if (!plan) return res.status(404).json({ message: 'No pivot plan found' });
    const gap = plan.skillGaps.id(req.params.gapId);
    if (!gap) return res.status(404).json({ message: 'Skill gap not found' });
    gap.status = status;
    await plan.save();
    res.json(plan);
  } catch (err) { next(err); }
};
