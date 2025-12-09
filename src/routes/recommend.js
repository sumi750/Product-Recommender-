// routes/recommend.js
const express = require('express');
const router = express.Router();
const { recommendForUser } = require('../services/recommender');
const { generateExplanation } = require('../services/openaiClient'); // <- ensure this exports generateExplanation
const User = require('../models/User');

// Helper: small delay
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { recommended, metadata } = await recommendForUser(userId, 6);

    // Choose parallel or sequential via query param ?parallel=true
    const parallel = req.query.parallel === 'true';
    const sentences = req.query.sentences ? Number(req.query.sentences) : undefined;
    const options = sentences ? { sentences } : { type: 'medium' };

    if (parallel) {
      // Run in parallel with Promise.allSettled, but still safe if any fail.
      // NOTE: for large lists this may hit rate limits - prefer batching.
      const promises = recommended.map(async (p) => {
        try {
          const explanation = await generateExplanation(metadata || {}, p, options);
          return { product: p, explanation };
        } catch (e) {
          console.error('generateExplanation failed for product', p._id, e);
          return { product: p, explanation: 'Explanation unavailable' };
        }
      });

      const settled = await Promise.allSettled(promises);
      const out = settled.map(s => s.status === 'fulfilled' ? s.value : s.reason);
      return res.json({ user: { id: user._id, name: user.name }, recommendations: out });
    } else {
      // Sequential with a small delay to avoid throttling
      const out = [];
      for (const p of recommended) {
        try {
          const explanation = await generateExplanation(metadata || {}, p, options);
          out.push({ product: p, explanation });
        } catch (e) {
          console.error('OpenAI error:', e);
          out.push({ product: p, explanation: 'Explanation unavailable' });
        }
        // small pause between requests (adjust as needed)
        await sleep(200);
      }
      return res.json({ user: { id: user._id, name: user.name }, recommendations: out });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
