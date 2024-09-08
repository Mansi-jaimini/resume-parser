const express = require('express');
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const cors=require('cors')
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const port = 5000;
app.use(cors())
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/resume-parser', { useNewUrlParser: true, useUnifiedTopology: true });

const resumeSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  experience: String,
  education: String,
  skills: String,
});

const Resume = mongoose.model('Resume', resumeSchema);

const upload = multer({ dest: 'uploads/' });

const parsePDF = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
};

const parseDOCX = async (filePath) => {
  const data = await mammoth.extractRawText({ path: filePath });
  return data.value;
};

const extractDetails = (text) => {
    console.log(" -- text :- ", text);
  const namePatterns = [
    /([A-Z][a-zA-Z'-]+(?:\s[A-Z][a-zA-Z'-]+){1,10})/i,
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+){1,3}\b/i,
    /\b[A-Z][a-zA-Z'-]+(?:\s[A-Z][a-zA-Z'-]+){1,3}\b/i,
    /^\s*([A-Z][a-zA-Z'-]+(?:\s[A-Z][a-zA-Z'-]+){1,3})/i,
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/i
  ];

  let name = 'N/A';
  for (let pattern of namePatterns) {
    const match = text.match(pattern);
    if (match) {
      name = match[1].trim();
      break;
    }
  }

  const mobilePattern = /\b(?:\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{2,4}[\s-]?\d{2,4}[\s-]?\d{1,9}\b/;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const educationPattern = /(?:EDUCATION|Education)[\s\S]*?(?=(?:EXTRA|Extra|Certifications|Skills|SKILLS|Projects|PROJECTS|Snippets|$))/; 
  const experiencePattern =/(?:EXPERIENCE|Experience|Work\s*Experience|WORK\s*EXPERIENCE|Workexperience|Professional\s*Experience|Career\s*Summary)[\s\S]*?(?=(?:Education|EXTRA|Extra|Skills|SKILLS|Certifications|$))/
  const skillsPattern = /(?:SKILLS|Skills|Technologies)[\s\S]*?(?=(?:responsibilities|Education|EXTRA|Extra|Certifications|Projects|PROJECTS|$))/
  

  return {
    name: name,
    mobile: (text.match(mobilePattern) || [])[0] || 'N/A',
    email: (text.match(emailPattern) || [])[0] || 'N/A',
    experience: (text.match(experiencePattern) || [])[0] || 'N/A',
    education: (text.match(educationPattern) || [])[0] || 'N/A',
    skills: (text.match(skillsPattern) || [])[0] || 'N/A',
  };
};

app.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const { path: filePath, originalname } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    let text;
    if (ext === '.pdf') {
      text = await parsePDF(filePath);
    } else if (ext === '.docx') {
      text = await parseDOCX(filePath);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const details = extractDetails(text);
    
    let resume = await Resume.findOne({ email: details.email });

    if (resume) {
      // If resume exists, update it
      resume.name = details.name;
      resume.mobile = details.mobile;
      resume.experience = details.experience;
      resume.education = details.education;
      resume.skills = details.skills;
      await resume.save();
    } else {
      // If not, create a new resume
      resume = new Resume(details);
      await resume.save();
    }

    res.json({ ...details, id: resume._id }); // Include id in response

    fs.unlinkSync(filePath);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process file' });
  }
});

app.post('/update', async (req, res) => {
  const { id, name, mobile, email, experience, education, skills } = req.body;

  try {
    const result = await Resume.findByIdAndUpdate(id, {
      name,
      mobile,
      email,
      experience,
      education,
      skills
    }, { new: true });

    if (result) {
      res.json({ message: 'Resume details updated successfully!', resume: result });
    } else {
      res.status(404).json({ error: 'Resume with the given ID not found.' });
    }
  } catch (error) {
    console.error('Error updating resume:', error);
    res.status(500).json({ error: 'Failed to update resume details.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
