const axios = require('axios');
const Resume = require('../models/Resume');
const InterviewSession = require('../models/InterviewSession');

exports.startInterview = async (req, res) => {
  try {
    const { resumeId, count } = req.body;
    const studentId = req.studentId;

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    if (resume.studentId.toString() !== studentId) {
      return res.status(403).json({ message: 'Not allowed' });
    }
    if (resume.skills.length === 0) {
      return res.status(400).json({ message: 'No skills found in this resume' });
    }

    const mlResponse = await axios.post('http://localhost:6001/generate-questions', {
      skills: resume.skills,
      count: count || 5,
    });

    const session = new InterviewSession({
      studentId,
      resumeId,
      questions: mlResponse.data.questions,
    });
    await session.save();

    res.status(201).json({ message: 'Interview started', session });
  } catch (error) {
    res.status(500).json({ message: 'Error starting interview', error: error.message });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, answer } = req.body;

    if (!answer || answer.trim() === '') {
      return res.status(400).json({ message: 'Answer cannot be empty' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }
    if (session.studentId.toString() !== req.studentId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const question = session.questions.id(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found in this session' });
    }

    const mlResponse = await axios.post('http://localhost:6001/evaluate-answer', {
      topic: question.topic,
      answer,
    });
    const { score, feedback, matched_keywords, missing_keywords } = mlResponse.data;

    question.answer = answer;
    question.score = score;

    const allAnswered = session.questions.every((q) => q.answer !== '');
    if (allAnswered) {
      const sum = session.questions.reduce((total, q) => total + q.score, 0);
      session.totalScore = Math.round((sum / (session.questions.length * 10)) * 100);
      session.status = 'completed';
    }

    await session.save();

    res.status(200).json({
      message: 'Answer evaluated',
      score,
      feedback,
      matched_keywords,
      missing_keywords,
      sessionStatus: session.status,
      totalScore: session.totalScore,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting answer', error: error.message });
  }
};

exports.getResult = async (req, res) => {
  try {
    const session = await InterviewSession.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Interview session not found' });
    }
    if (session.studentId.toString() !== req.studentId) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const answered = session.questions.filter((q) => q.answer !== '');

    const bySkill = {};
    answered.forEach((q) => {
      if (!bySkill[q.skill]) bySkill[q.skill] = { total: 0, count: 0 };
      bySkill[q.skill].total += q.score;
      bySkill[q.skill].count += 1;
    });
    const skillSummary = Object.entries(bySkill).map(([skill, v]) => ({
      skill,
      averageScore: Math.round((v.total / v.count) * 10) / 10,
    }));

    const strongTopics = answered
      .filter((q) => q.score >= 7)
      .map((q) => ({ skill: q.skill, topic: q.topic, score: q.score }));
    const weakTopics = answered
      .filter((q) => q.score < 5)
      .map((q) => ({ skill: q.skill, topic: q.topic, score: q.score }));

    const recommendations =
      weakTopics.length > 0
        ? weakTopics.map((t) => `Revise "${t.topic}" in ${t.skill} and practice explaining it with an example.`)
        : ['Great performance! Try another interview with more skills added to your resume.'];

    res.status(200).json({
      sessionId: session._id,
      status: session.status,
      totalScore: session.totalScore,
      answeredCount: answered.length,
      totalQuestions: session.questions.length,
      skillSummary,
      strongTopics,
      weakTopics,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching result', error: error.message });
  }
};
