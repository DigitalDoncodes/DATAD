const router = require('express').Router();
const verifyToken = require('../middleware/verifyToken');
const { getReadiness } = require('../controllers/readinessController');

router.get('/', verifyToken, getReadiness);

module.exports = router;
