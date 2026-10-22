const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { startInterview, submitAnswer, getResult } = require('../controllers/interviewController');

router.use(auth);

router.post('/start', startInterview);
router.post('/answer', submitAnswer);
router.get('/:sessionId/result', getResult);

module.exports = router;
