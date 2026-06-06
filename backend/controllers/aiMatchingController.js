const asyncHandler = require('express-async-handler');
const FreelancerProfile = require('../models/FreelancerProfile');
const Gig = require('../models/Gig');
const User = require('../models/User');
const { calculateMatchScore, getTrendingSkills } = require('../services/aiMatchingService');

// GET /api/ai/match/:gigId  ← get matched freelancers for a gig
const getMatchedFreelancers = asyncHandler(async (req, res) => {
  const gig = await Gig.findById(req.params.gigId);
  if (!gig) {
    res.status(404);
    throw new Error('Gig not found');
  }

  // Get all freelancer profiles with skills
  const profiles = await FreelancerProfile.find({
    'skills.0': { $exists: true }  // has at least one skill
  }).populate('user', 'name avatar email isVerified');

  // Calculate match scores for each freelancer
  const matchedFreelancers = await Promise.all(
    profiles.map(async (profile) => {
      const freelancerSkills = profile.skills.map(s => s.name);
      let score = await calculateMatchScore(
        gig.skillsRequired,
        freelancerSkills
      );

      // Hyperlocal Bonus: +15% if locations match (and not remote)
      const gigLocation = gig.location?.toLowerCase();
      const userLocation = profile.location?.toLowerCase();
      if (gigLocation !== 'remote' && gigLocation === userLocation) {
        score = Math.min(100, score + 15);
      }

      return {
        freelancer: {
          _id: profile.user._id,
          name: profile.user.name,
          avatar: profile.user.avatar,
          isVerified: profile.user.isVerified
        },
        profile: {
          title: profile.title,
          skills: profile.skills,
          hourlyRate: profile.hourlyRate,
          reputationScore: profile.reputationScore,
          completedGigs: profile.completedGigs,
          availability: profile.availability,
          location: profile.location
        },
        matchScore: score,
        matchedSkills: profile.skills
          .map(s => s.name)
          .filter(s => gig.skillsRequired
            .map(g => g.toLowerCase())
            .includes(s.toLowerCase())
          )
      };
    })
  );

  // Sort by match score descending
  const sorted = matchedFreelancers
    .filter(f => f.matchScore > 0)
    .sort((a, b) => {
      // Primary: match score
      // Secondary: reputation score
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return b.profile.reputationScore - a.profile.reputationScore;
    })
    .slice(0, 10);  // Top 10

  res.json({ success: true, matches: sorted, gigSkills: gig.skillsRequired });
});

// GET /api/ai/recommendations  ← personalized gig recommendations for freelancer
const getRecommendedGigs = asyncHandler(async (req, res) => {
  // Get freelancer's skills
  const profile = await FreelancerProfile.findOne({ user: req.user._id });

  if (!profile || !profile.skills.length) {
    // Return latest gigs if no profile
    const gigs = await Gig.find({ status: 'open' })
      .populate('client', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(6);
    return res.json({ success: true, recommendations: gigs, isPersonalized: false });
  }

  const freelancerSkills = profile.skills.map(s => s.name);

  // Get all open gigs
  const allGigs = await Gig.find({ status: 'open' })
    .populate('client', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(30);

  // Score each gig
  const scoredGigs = await Promise.all(
    allGigs.map(async (gig) => {
      let score = await calculateMatchScore(
        gig.skillsRequired,
        freelancerSkills
      );

      // Proximity Bonus: +15 if location matches
      if (gig.location?.toLowerCase() !== 'remote' && 
          gig.location?.toLowerCase() === profile.location?.toLowerCase()) {
        score = Math.min(100, score + 15);
      }

      return { ...gig.toObject(), matchScore: score };
    })
  );

  // Sort by match score
  const recommendations = scoredGigs
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  res.json({ success: true, recommendations, isPersonalized: true });
});

// GET /api/ai/trending  ← trending skills
const getTrending = asyncHandler(async (req, res) => {
  const trending = await getTrendingSkills(Gig);
  res.json({ success: true, trending });
});

// GET /api/ai/score  ← get match score between freelancer and specific gig
const getMatchScoreForFreelancer = asyncHandler(async (req, res) => {
  const { gigId } = req.query;

  const [profile, gig] = await Promise.all([
    FreelancerProfile.findOne({ user: req.user._id }),
    Gig.findById(gigId)
  ]);

  if (!profile || !gig) {
    return res.json({ success: true, score: 0 });
  }

  const freelancerSkills = profile.skills.map(s => s.name);
  const score = await calculateMatchScore(gig.skillsRequired, freelancerSkills);

  const matchedSkills = freelancerSkills.filter(s =>
    gig.skillsRequired.map(g => g.toLowerCase()).includes(s.toLowerCase())
  );

  res.json({ success: true, score, matchedSkills });
});

// POST /api/ai/generate-proposal  ← generate AI cover letter
const generateProposal = asyncHandler(async (req, res) => {
  const { gigId } = req.body;

  const [profile, gig] = await Promise.all([
    FreelancerProfile.findOne({ user: req.user._id }),
    Gig.findById(gigId)
  ]);

  if (!profile || !gig) {
    res.status(404);
    throw new Error('Required data not found');
  }

  const prompt = `Write a professional, persuasive freelance proposal for the following project:
    Project Title: ${gig.title}
    Description: ${gig.description}
    Requirements: ${gig.skillsRequired.join(', ')}
    Budget: ${gig.budget}

    The freelancer has the following profile:
    Title: ${profile.title}
    Skills: ${profile.skills.map(s => s.name).join(', ')}
    Bio: ${profile.bio}

    Structure the proposal with:
    1. A strong opening tailored to the project.
    2. How the freelancer's skills solve the client's problem.
    3. A brief mention of relevant experience.
    4. A call to action.
    Keep it concise and professional. Do not use placeholders like [Insert Name].`;

  const { generateText } = require('../services/aiMatchingService');
  const proposal = await generateText(prompt);

  if (!proposal) {
    res.status(500);
    throw new Error('AI generation failed');
  }

  res.json({ success: true, proposal });
});

// GET /api/ai/skill-gap  ← Analyze readiness for a target company/role
const getSkillGapAnalysis = asyncHandler(async (req, res) => {
  const { targetCompany = 'Google', targetRole = 'Software Engineer' } = req.query;
  
  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Freelancer profile not found');
  }

  const prompt = `Act as a Senior Technical Recruiter at ${targetCompany}. 
    Analyze this freelancer's readiness for a ${targetRole} role.
    
    Current Skills: ${profile.skills.map(s => s.name).join(', ')}
    Professional Summary: ${profile.bio}
    
    Provide a detailed analysis in strictly VALID JSON format (no other text).
    {
      "currentLevel": 65,
      "missingSkills": ["System Design", "Advanced DSA", "Node.js Performance Tuning"],
      "estimatedPrepTime": "3-4 Months",
      "roadmap": "Step 1: Master Leetcode Medium. Step 2: Learn System Design patterns.",
      "placementReadinessScore": 6.5,
      "marketDemand": "High"
    }`;

  const { generateText } = require('../services/aiMatchingService');
  const responseText = await generateText(prompt);
  
  try {
    // Clean JSON if the AI included markdown wrappers
    const jsonStr = responseText.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonStr);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Parsing error:', responseText);
    res.status(500);
    throw new Error('AI analysis produced invalid data format');
  }
});

// POST /api/ai/interview  ← Simulate a conversation with an AI Interviewer
const handleInterviewSession = asyncHandler(async (req, res) => {
  const { messages = [], targetCompany = 'Google', targetRole = 'Software Engineer' } = req.body;

  // Construct context from previous messages
  const conversationHistory = messages.map(m => 
    `${m.isUser ? 'Candidate' : 'Interviewer'}: ${m.text}`
  ).join('\n');

  const prompt = `You are a professional, slightly tough Interviewer at ${targetCompany}. 
    You are interviewing a candidate for a ${targetRole} position.
    
    CONVERSATION HISTORY:
    ${conversationHistory}
    
    YOUR TASK:
    1. If the history is empty, introduce yourself and ask a standard "Tell me about yourself" or initial technical question.
    2. If the candidate answered, briefly evaluate their answer (be critical but fair) and ask a relevant follow-up question.
    3. If there are more than 6 messages in the history, end the interview, provide a summary of their performance (Technical Skill, Communication, Confidence), and give a FINAL SCORE (1-10).
    
    Keep responses concise and interview-like. Do not break character.`;

  const { generateText } = require('../services/aiMatchingService');
  const responseText = await generateText(prompt);

  if (!responseText) {
    res.status(500);
    throw new Error('AI failed to respond');
  }

  res.json({ success: true, text: responseText });
});

// GET /api/ai/portfolio-architect  ← Analyze portfolio and suggest "Resume-Worthy" projects
const getPortfolioAnalysis = asyncHandler(async (req, res) => {
  const profile = await FreelancerProfile.findOne({ user: req.user._id });
  if (!profile) {
    res.status(404);
    throw new Error('Freelancer profile not found');
  }

  const prompt = `Act as a Technical CTO and Career Coach. 
    Analyze this freelancer's current profile:
    Title: ${profile.title}
    Current Skills: ${profile.skills.map(s => s.name).join(', ')}
    Bio: ${profile.bio}
    
    TASK:
    1. Give a "Portfolio Strength Score" (0-100).
    2. Identify 3 critical technical gaps in their current portfolio.
    3. Generate 3 unique "Resume-Worthy" project ideas that will make them stand out to Top Tech Companies.
    
    Respond STRICTLY in VALID JSON format (no other text):
    {
      "portfolioScore": 65,
      "strengths": ["Clean bio", "Core frontend skills"],
      "weaknesses": ["Lack of backend scale", "No cloud experience"],
      "suggestedProjects": [
        {
          "title": "Real-time Distributed Chat Engine",
          "difficulty": "Advanced",
          "techStack": ["Node.js", "Socket.io", "Redis", "Docker"],
          "whyItHelps": "Demonstrates capability to handle real-time state and infrastructure scaling.",
          "roadmap": "Week 1: Setup basic socket server. Week 2: Add Redis pub/sub. Week 3: Dockerize and scale."
        }
      ]
    }`;

  const { generateText } = require('../services/aiMatchingService');
  const responseText = await generateText(prompt);

  try {
    const jsonStr = responseText.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(jsonStr);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('AI JSON Error:', responseText);
    res.status(500);
    throw new Error('AI produced invalid project data');
  }
});

module.exports = {
  getMatchedFreelancers,
  getRecommendedGigs,
  getTrending,
  getMatchScoreForFreelancer,
  generateProposal,
  getSkillGapAnalysis,
  handleInterviewSession,
  getPortfolioAnalysis
};