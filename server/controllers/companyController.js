const Company = require('../models/Company');
const CompanyRead = require('../models/CompanyRead');

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ---- Read (any authenticated member) ----

exports.listCompanies = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.sector) filter.sector = req.query.sector;
    if (req.query.q) filter.name = { $regex: req.query.q.trim(), $options: 'i' };
    const companies = await Company.find(filter)
      .select('name slug sector logoUrl salaryRange roles views')
      .sort({ views: -1, name: 1 })
      .limit(100)
      .lean();
    res.json(companies);
  } catch (err) {
    next(err);
  }
};

exports.getCompanyBySlug = async (req, res, next) => {
  try {
    const company = await Company.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    ).lean();
    if (!company) return res.status(404).json({ message: 'Company not found' });
    // Mark this card as studied by the viewer (feeds the readiness score).
    CompanyRead.updateOne(
      { user: req.user.userId, company: company._id },
      { $setOnInsert: { user: req.user.userId, company: company._id } },
      { upsert: true }
    ).catch(() => {});
    res.json(company);
  } catch (err) {
    next(err);
  }
};

// ---- Admin CRUD ----

exports.createCompany = async (req, res, next) => {
  try {
    const data = { ...req.body, createdBy: req.user.userId };
    if (!data.slug && data.name) data.slug = slugify(data.name);
    const existing = await Company.findOne({ slug: data.slug });
    if (existing) return res.status(409).json({ message: 'A company with this name already exists' });
    const company = await Company.create(data);
    res.status(201).json(company);
  } catch (err) {
    next(err);
  }
};

exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (err) {
    next(err);
  }
};

exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ message: 'Company deleted' });
  } catch (err) {
    next(err);
  }
};
