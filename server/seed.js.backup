/**
 * Seed script — populates DATAD with realistic demo data.
 * Usage: node seed.js
 * Requires MONGODB_URI in .env. Seeds using the first admin user found.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const PlacementDrive = require('./models/PlacementDrive');
const Internship = require('./models/Internship');
const SkillListing = require('./models/SkillListing');
const Resource = require('./models/Resource');
const Post = require('./models/Post');
const Event = require('./models/Event');
const MarketListing = require('./models/MarketListing');
const Project = require('./models/Project');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) { console.error('No admin user found. Create one first.'); process.exit(1); }
  const uid = admin._id;
  console.log(`Seeding as admin: ${admin.name}`);

  // ── Placement Drives ──────────────────────────────────────────────────────
  const r = (names) => names.map((name) => ({ name }));
  const drives = [
    { name: 'McKinsey & Company — Management Consultant', company: 'McKinsey & Company', role: 'Management Consultant', package: '₹35 LPA', eligibility: 'MBA 2024-26, min CGPA 3.5', applicationDeadline: new Date('2026-09-01'), rounds: r(['Resume screening', 'Case interview 1', 'Case interview 2', 'Partner round']), status: 'upcoming', notes: 'Focus on problem structuring and communication clarity.' },
    { name: 'Goldman Sachs — Investment Banking Analyst', company: 'Goldman Sachs', role: 'Investment Banking Analyst', package: '₹28 LPA', eligibility: 'Finance specialization preferred', applicationDeadline: new Date('2026-08-15'), rounds: r(['Online test', 'HR round', 'Technical round 1', 'Technical round 2']), status: 'active', notes: 'Technical questions on DCF, LBO, and M&A.' },
    { name: 'Hindustan Unilever — Marketing Manager', company: 'Hindustan Unilever', role: 'Marketing Manager', package: '₹22 LPA', eligibility: 'Open to all specializations', applicationDeadline: new Date('2026-09-15'), rounds: r(['Group discussion', 'Case presentation', 'HR interview']), status: 'upcoming' },
    { name: 'Amazon — Product Manager', company: 'Amazon', role: 'Product Manager', package: '₹32 LPA', eligibility: 'Tech background preferred but not required', applicationDeadline: new Date('2026-10-01'), rounds: r(['Phone screen', 'Writing sample', 'Loop interviews (4)', 'Bar raiser']), status: 'upcoming', notes: 'STAR format answers. Leadership principles are critical.' },
    { name: 'BCG — Associate', company: 'Boston Consulting Group', role: 'Associate', package: '₹34 LPA', eligibility: 'All MBA students', applicationDeadline: new Date('2026-09-20'), rounds: r(['CV screening', 'Case interview 1', 'Case interview 2', 'Partner interview']), status: 'upcoming' },
  ];
  await PlacementDrive.deleteMany({});
  await PlacementDrive.insertMany(drives.map((d) => ({ ...d, createdBy: uid })));
  console.log(`✓ ${drives.length} placement drives`);

  // ── Internships ───────────────────────────────────────────────────────────
  const internships = [
    { title: 'Strategy Intern', company: 'Tata Consultancy Services', location: 'Mumbai', remote: false, stipend: '₹50,000/month', duration: '2 months', applyLink: 'https://careers.tcs.com', deadline: new Date('2026-08-01'), eligibility: 'MBA 1st year, Strategy or Consulting interest', tags: ['consulting', 'strategy', 'operations'] },
    { title: 'Finance Analyst Intern', company: 'ICICI Bank', location: 'Mumbai', remote: false, stipend: '₹35,000/month', duration: '8 weeks', applyLink: 'https://www.icicicareers.com', deadline: new Date('2026-07-25'), eligibility: 'Finance specialization', tags: ['finance', 'banking', 'analysis'] },
    { title: 'Marketing Intern — FMCG', company: 'Nestlé India', location: 'Gurgaon', remote: false, stipend: '₹45,000/month', duration: '2 months', applyLink: 'https://www.nestle.in/careers', deadline: new Date('2026-08-10'), eligibility: 'Marketing specialization', tags: ['marketing', 'fmcg', 'brand'] },
    { title: 'Product Management Intern', company: 'Flipkart', location: 'Bengaluru', remote: true, stipend: '₹60,000/month', duration: '3 months', applyLink: 'https://www.flipkartcareers.com', deadline: new Date('2026-09-01'), eligibility: 'Tech or Operations background preferred', tags: ['product', 'tech', 'ecommerce'] },
  ];
  await Internship.deleteMany({});
  await Internship.insertMany(internships.map((i) => ({ ...i, postedBy: uid, active: true })));
  console.log(`✓ ${internships.length} internships`);

  // ── Skill Listings ────────────────────────────────────────────────────────
  const skills = [
    { skill: 'Excel & Financial Modelling', description: 'DCF, LBO, M&A models from scratch. Experience building models for 10+ companies.', mode: 'online', availability: 'Weekends, 10am-1pm', contact: 'WhatsApp: +91-98XXXXXXXX', tags: ['finance', 'excel', 'modelling'] },
    { skill: 'Case Interview Prep', description: 'Cracked McKinsey and BCG. Happy to do mock cases and give feedback on structuring.', mode: 'in-person', availability: 'Evenings after 7pm', contact: 'Instagram: @username', tags: ['consulting', 'cases', 'prep'] },
    { skill: 'Python for Data Analysis', description: 'Pandas, NumPy, Matplotlib, Seaborn. Can teach from basics to dashboards in 4 sessions.', mode: 'both', availability: 'Flexible', contact: 'Email: student@iima.ac.in', tags: ['python', 'data', 'analytics'] },
  ];
  await SkillListing.deleteMany({});
  await SkillListing.insertMany(skills.map((s) => ({ ...s, user: uid })));
  console.log(`✓ ${skills.length} skill listings`);

  // ── Resources ─────────────────────────────────────────────────────────────
  const resources = [
    { title: 'HBS Case Method — Reading Guide', subject: 'General Management', semester: 'Sem 1', type: 'pdf', url: 'https://www.hbs.edu/mba/academic-experience/Pages/the-hbs-case-method.aspx', tags: ['cases', 'reading', 'hbs'] },
    { title: 'Porter\'s Five Forces — Complete Template', subject: 'Strategy', semester: 'Sem 1', professor: 'Prof. Sharma', type: 'link', url: 'https://www.mindtools.com/pages/article/newTMC_08.htm', tags: ['strategy', 'frameworks', 'porter'] },
    { title: 'DCF Model — Excel Template', subject: 'Finance', semester: 'Sem 2', professor: 'Prof. Mehta', type: 'excel', url: 'https://corporatefinanceinstitute.com/resources/excel/dcf-model-template/', tags: ['finance', 'dcf', 'valuation'] },
    { title: 'Marketing Mix — 4P Framework Notes', subject: 'Marketing', semester: 'Sem 1', type: 'pdf', url: 'https://www.marketing91.com/marketing-mix/', tags: ['marketing', '4p', 'frameworks'] },
    { title: 'Consulting Prep — Complete Guide 2025', subject: 'Consulting', type: 'link', url: 'https://www.caseinterview.com/case_interview_secrets', tags: ['consulting', 'cases', 'prep'] },
    { title: 'HR Management — Lecture Slides Compilation', subject: 'HRM', semester: 'Sem 2', professor: 'Prof. Nair', type: 'ppt', url: 'https://www.slideshare.net/search/slideshow?searchfrom=header&q=hrm+mba', tags: ['hrm', 'slides', 'lectures'] },
  ];
  await Resource.deleteMany({});
  await Resource.insertMany(resources.map((r) => ({ ...r, uploadedBy: uid })));
  console.log(`✓ ${resources.length} resources`);

  // ── Feed Posts ────────────────────────────────────────────────────────────
  const posts = [
    { type: 'achievement', body: 'Just cracked my McKinsey final round! Three months of case prep paid off. AMA if you want tips on structuring.', tags: ['placement', 'consulting'] },
    { type: 'text', body: 'Study group for Finance electives forming for Sem 2. Looking for 4-5 people who are serious about CA/CFA. DM me!', tags: ['study', 'finance'] },
    { type: 'poll', body: 'Which summer internship sector are you targeting?', pollOptions: [{ text: 'Consulting', votes: 12 }, { text: 'Finance / Banking', votes: 18 }, { text: 'Marketing / FMCG', votes: 8 }, { text: 'Tech / Product', votes: 6 }], tags: ['internship', 'poll'] },
  ];
  await Post.deleteMany({ author: uid });
  await Post.insertMany(posts.map((p) => ({ ...p, title: p.body.slice(0, 80), author: uid })));
  console.log(`✓ ${posts.length} feed posts`);

  // ── Events ────────────────────────────────────────────────────────────────
  const now = new Date();
  const d = (days) => new Date(now.getTime() + days * 86400000);
  const events = [
    { title: 'Mock Placement Day — Round 1', description: 'Full-day mock placement with real company partners. Dress code: formal.', date: d(5), location: 'Auditorium, Block A', organizer: 'Placement Committee', category: 'career', registrationOpen: true, maxAttendees: 200 },
    { title: 'Finance & Banking Alumni Panel', description: 'Hear from IB, PE, and VC alumni on career paths, skills they look for, and how to break in.', date: d(10), location: 'Seminar Hall 2', organizer: 'Finance Club', category: 'career', registrationOpen: true, maxAttendees: 80 },
    { title: 'Batch 2024-26 Freshers Night', description: 'Welcome party for the incoming batch. Food, music, and networking.', date: d(3), location: 'Campus Lawn', organizer: 'Student Council', category: 'social', registrationOpen: true },
  ];
  await Event.deleteMany({});
  await Event.insertMany(events.map((e) => ({ ...e, createdBy: uid })));
  console.log(`✓ ${events.length} events`);

  // ── Marketplace Listings ──────────────────────────────────────────────────
  const listings = [
    { title: 'BCG & McKinsey Case Books Bundle (2023 editions)', description: 'All 4 books in excellent condition. Used for one season. Selling as I\'ve cracked my placements!', price: 1500, category: 'books', condition: 'like-new', seller: uid, contact: 'WhatsApp: +91-98XXXXXXXX', tags: ['cases', 'consulting', 'books'] },
    { title: 'HP EliteBook 840 G7 — 16GB RAM, 512GB SSD', description: 'Works perfectly, minor scratch on the lid. Comes with charger. Selling to upgrade.', price: 45000, category: 'electronics', condition: 'good', seller: uid, contact: 'Call: +91-98XXXXXXXX', tags: ['laptop', 'hp', 'electronics'] },
    { title: 'First-year Marketing Notes — All Subjects', description: 'Handwritten notes covering the full first year marketing curriculum. Very organized.', price: 500, category: 'stationery', condition: 'good', seller: uid, contact: 'DM on Instagram: @username', tags: ['notes', 'marketing', 'sem1'] },
    { title: 'Formal Suits — 2 pieces (Size 40)', description: 'Two formal suits for placement interviews. Worn twice each. Dry cleaned.', price: 3000, category: 'clothing', condition: 'like-new', seller: uid, contact: 'WhatsApp: +91-98XXXXXXXX', tags: ['formal', 'placement', 'suits'] },
  ];
  await MarketListing.deleteMany({});
  await MarketListing.insertMany(listings);
  console.log(`✓ ${listings.length} marketplace listings`);

  console.log('\n✅ Seed complete!');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
