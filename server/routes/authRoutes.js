const router = require('express').Router();
const {
  register,
  login,
  getMe,
  changePassword,
  deleteAccount,
} = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.put('/password', verifyToken, changePassword);
router.delete('/me', verifyToken, deleteAccount);

module.exports = router;
