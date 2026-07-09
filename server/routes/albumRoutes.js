const router = require('express').Router();
const { listAlbums, createAlbum, deleteAlbum } = require('../controllers/albumController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.get('/', listAlbums);
router.post('/', createAlbum);
router.delete('/:id', deleteAlbum);

module.exports = router;
