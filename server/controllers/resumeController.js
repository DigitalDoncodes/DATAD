const Resume = require('../models/Resume');

exports.getMyResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ user: req.user.userId });
    res.json(resume);
  } catch (err) {
    next(err);
  }
};

exports.saveResume = async (req, res, next) => {
  try {
    const {
      personal,
      summary,
      education,
      experience,
      projects,
      skills,
      certifications,
      achievements,
      leadership,
    } = req.body;
    const resume = await Resume.findOneAndUpdate(
      { user: req.user.userId },
      { personal, summary, education, experience, projects, skills, certifications, achievements, leadership },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(resume);
  } catch (err) {
    next(err);
  }
};
