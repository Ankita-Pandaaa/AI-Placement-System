const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  extractedText: { type: String },
  skills: { type: [String], default: [] },
  score: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);