const Product = require('../models/Product');
const Interaction = require('../models/Interaction');

// compute Jaccard similarity between two string arrays
function jaccard(a = [], b = []){
const setA = new Set(a);
const setB = new Set(b);
const inter = new Set([...setA].filter(x => setB.has(x)));
const uni = new Set([...setA, ...setB]);
if (uni.size === 0) return 0;
return inter.size / uni.size;
}


async function recommendForUser(userId, limit = 5){
// 1. fetch user's recent interactions
const interactions = await Interaction.find({ userId }).sort({ timestamp: -1 }).limit(50).lean();

// collect categories and tags
const viewedProductIds = interactions.map(i => i.productId);

const viewedProducts = await Product.find({ _id: { $in: viewedProductIds } }).lean();


const categoryCounts = {};
const tagCounts = {};
viewedProducts.forEach(p => {
if (!p) return;
categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1; 
(p.tags || []).forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1);
});

// 1.create weighted preference vector
const preferredCategories = Object.keys(categoryCounts).sort((a,b) => categoryCounts[b]-categoryCounts[a]);
const preferredTags = Object.keys(tagCounts).sort((a,b) => tagCounts[b]-tagCounts[a]);

// 2. fetch candidate products
const candidates = await Product.find({}).limit(100).lean();


// 3. score candidates: category match (high), tag similarity, popularity
const scored = candidates.map(p => {
let score = 0;

// category match
if (preferredCategories.includes(p.category)) score += 3;
// tag overlap
score += 2 * jaccard(preferredTags, p.tags);
// popularity normalized
score += Math.log((p.popularity || 1) + 1);
return { product: p, score };
});


scored.sort((a,b) => b.score - a.score);


const top = scored.slice(0, limit).map(s => s.product);
return { recommended: top, metadata: { preferredCategories, preferredTags } };
}


module.exports = { recommendForUser };