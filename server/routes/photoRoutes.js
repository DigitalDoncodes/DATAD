const router = require('express').Router();
const { uploadPhoto, deletePhoto, listRecentPhotos } = require('../controllers/photoController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');
const { heavyLimiter } = require('../middleware/rateLimiters');

router.use(verifyToken);
router.get('/recent', listRecentPhotos);
router.post('/', heavyLimiter, upload.single('image'), uploadPhoto);
router.delete('/:id', deletePhoto);

module.exports = router;
