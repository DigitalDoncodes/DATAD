const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { heavyLimiter } = require('../middleware/rateLimiters');
const {
  getStats,
  listStudents,
  listJournal,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  createAnnouncement,
  deleteAnnouncement,
} = require('../controllers/adminController');

router.use(verifyToken, checkRole('admin'));

router.get('/stats', getStats);
router.get('/students', listStudents);

router.get('/journal', listJournal);
router.post('/journal', createJournalEntry);
router.put('/journal/:id', updateJournalEntry);
router.delete('/journal/:id', deleteJournalEntry);

router.post('/announcements', heavyLimiter, createAnnouncement);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
