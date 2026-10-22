const express = require('express');
const router = express.Router();
const uploadResumeFile = require('../config/multerConfig');
const auth = require('../middleware/authMiddleware');
const { uploadResume } = require('../controllers/resumeController');

router.post('/upload', auth, uploadResumeFile, uploadResume);

module.exports = router;
