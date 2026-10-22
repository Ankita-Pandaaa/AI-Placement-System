const pdfParse = require('pdf-parse');
const fs = require('fs');
const axios = require('axios');
const Resume = require('../models/Resume');

exports.uploadResume = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const filePath = req.file.path;

  try {
    const fileBuffer = fs.readFileSync(filePath);

    if (fileBuffer.slice(0, 5).toString() !== '%PDF-') {
      return res.status(400).json({ message: 'The uploaded file is not a valid PDF' });
    }

    let extractedText;
    try {
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } catch (parseError) {
      return res.status(400).json({
        message: 'Could not read this PDF. Please re-export it from Word or Google Docs and try again',
      });
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return res.status(400).json({
        message: 'No readable text found in this PDF. Scanned or image-only PDFs are not supported',
      });
    }

    let mlResponse;
    try {
      mlResponse = await axios.post('http://localhost:6001/extract-skills', {
        text: extractedText,
      });
    } catch (mlError) {
      return res.status(503).json({ message: 'Resume analysis service is unavailable. Please try again later' });
    }

    const { skills, score } = mlResponse.data;

    const newResume = new Resume({
      studentId: req.studentId,
      extractedText,
      skills,
      score,
    });
    await newResume.save();

    res.status(201).json({
      message: 'Resume uploaded and analyzed successfully',
      resume: newResume,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing resume', error: error.message });
  } finally {
    fs.unlink(filePath, () => {});
  }
};
