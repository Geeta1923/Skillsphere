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

module.exports = {
  getMatchedFreelancers,
  getRecommendedGigs,
  getTrending,
  getMatchScoreForFreelancer
};