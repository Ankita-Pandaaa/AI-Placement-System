const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  skill: { type: String },
  topic: { type: String },
  question: { type: String },
  answer: { type: String, default: '' },
  score: { type: Number, default: 0 },
});

const interviewSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  questions: [questionSchema],
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  totalScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);