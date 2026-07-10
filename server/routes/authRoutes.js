const router = require('express').Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  deleteAccount,
} = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/password', verifyToken, changePassword);
router.delete('/me', verifyToken, deleteAccount);

module.exports = router;
