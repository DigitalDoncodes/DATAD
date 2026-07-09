const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const {
  listArticles,
  listBookmarked,
  toggleBookmark,
  setInterests,
  getMarket,
  setMarket,
  createArticle,
  updateArticle,
  deleteArticle,
} = require('../controllers/intelligenceController');

router.use(verifyToken);

// Read / personalization (all users)
router.get('/', listArticles);
router.get('/market', getMarket);
router.get('/bookmarks', listBookmarked);
router.post('/:id/bookmark', toggleBookmark);
router.put('/interests', setInterests);

// Admin curation
router.post('/', checkRole('admin'), createArticle);
router.put('/market', checkRole('admin'), setMarket);
router.put('/:id', checkRole('admin'), updateArticle);
router.delete('/:id', checkRole('admin'), deleteArticle);

module.exports = router;
