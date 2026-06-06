const axios = require('axios');

const HF_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

// Get text embeddings from HuggingFace
const getEmbeddings = async (texts) => {
  try {
    const response = await axios.post(
      `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
      { inputs: texts },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('HuggingFace API error:', error.message);
    return null;
  }
};

// Calculate cosine similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB) return 0;

  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

// Calculate skill match score between gig and freelancer
const calculateMatchScore = async (gigSkills, freelancerSkills) => {
  if (!gigSkills.length || !freelancerSkills.length) return 0;

  // Convert skill arrays to text
  const gigText = gigSkills.join(', ');
  const freelancerText = freelancerSkills.join(', ');

  try {
    const embeddings = await getEmbeddings([gigText, freelancerText]);

    if (!embeddings || embeddings.length < 2) {
      // Fallback to keyword matching if API fails
      return keywordMatchScore(gigSkills, freelancerSkills);
    }

    const similarity = cosineSimilarity(embeddings[0], embeddings[1]);
    return Math.round(similarity * 100);
  } catch (error) {
    // Fallback to keyword matching
    return keywordMatchScore(gigSkills, freelancerSkills);
  }
};

// Fallback — simple keyword matching if HuggingFace is down
const keywordMatchScore = (gigSkills, freelancerSkills) => {
  const gigSet = new Set(gigSkills.map(s => s.toLowerCase()));
  const freelancerSet = new Set(freelancerSkills.map(s => s.toLowerCase()));

  let matches = 0;
  freelancerSet.forEach(skill => {
    if (gigSet.has(skill)) matches++;
    // Partial match e.g. "react" matches "react native"
    gigSet.forEach(gigSkill => {
      if (gigSkill.includes(skill) || skill.includes(gigSkill)) matches += 0.5;
    });
  });

  return Math.min(Math.round((matches / gigSet.size) * 100), 100);
};

// Get trending skills from recent gigs
const getTrendingSkills = async (Gig) => {
  const recentGigs = await Gig.find({ status: 'open' })
    .sort({ createdAt: -1 })
    .limit(50)
    .select('skillsRequired');

  const skillCount = {};
  recentGigs.forEach(gig => {
    gig.skillsRequired.forEach(skill => {
      skillCount[skill] = (skillCount[skill] || 0) + 1;
    });
  });

  return Object.entries(skillCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([skill, count]) => ({ skill, count }));
};

// Generate text based on prompt using direct Axios call to Gemini
const generateText = async (prompt) => {
  try {
    const key = (process.env.GEMINI_API_KEY || "").trim();
    // Debug: Print start of key to verify which one is being used
    console.log(`DEBUG: Using Gemini Key starting with: ${key.substring(0, 5)}...`);

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${key}`,
      { contents: [{ parts: [{ text: prompt }] }] },
      { headers: { 'Content-Type': 'application/json' } }
    );

    if (response.data && response.data.candidates && response.data.candidates[0]) {
      return response.data.candidates[0].content.parts[0].text;
    }
    return null;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    return null;
  }
};

module.exports = { calculateMatchScore, getTrendingSkills, keywordMatchScore, generateText };