// install: npm install @google/genai
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null,
});

/**
 * Generate a multi-sentence explanation for one product.
 *
 * lengthHint: { sentences: number } or { type: 'short'|'medium'|'long' }
 */
async function generateExplanation(userBehavior = {}, product = {}, lengthHint = { type: 'medium' }) {
  const preferredCategories = Array.isArray(userBehavior.preferredCategories) ? userBehavior.preferredCategories.join(', ') : 'none';
  const preferredTags = Array.isArray(userBehavior.preferredTags) ? userBehavior.preferredTags.join(', ') : 'none';
  const productTags = Array.isArray(product.tags) ? product.tags.join(', ') : 'none';

  // Map lengthHint to token budget and prompt text
  let maxOutputTokens = 80;
  let instruction = 'Write 2 concise sentences explaining why this product is recommended to the user.';
  if (lengthHint && lengthHint.sentences) {
    const s = Number(lengthHint.sentences);
    if (!Number.isNaN(s) && s <= 1) {
      maxOutputTokens = 40;
      instruction = 'Write 1 concise sentence explaining why this product is recommended to the user.';
    } else if (!Number.isNaN(s) && s <= 2) {
      maxOutputTokens = 80;
      instruction = 'Write 2 concise sentences explaining why this product is recommended to the user.';
    } else if (!Number.isNaN(s) && s <= 4) {
      maxOutputTokens = 160;
      instruction = 'Write 3–4 short sentences (or 3 bullet points) explaining why this product is recommended to the user.';
    } else {
      // for very long text
      maxOutputTokens = Math.min(512, 50 * s); // conservative upper bound
      instruction = `Write ${s} sentences explaining why this product is recommended to the user. Be clear and user-friendly.`;
    }
  } else if (lengthHint && lengthHint.type) {
    if (lengthHint.type === 'short') { maxOutputTokens = 40; instruction = 'Write 1 concise sentence.'; }
    if (lengthHint.type === 'medium') { maxOutputTokens = 80; instruction = 'Write 2 concise sentences.'; }
    if (lengthHint.type === 'long') { maxOutputTokens = 160; instruction = 'Write 3–4 short sentences or 3 bullet points.'; }
  }

  const prompt = `User behavior:
- Viewed categories: ${preferredCategories}
- Frequent tags: ${preferredTags}

Product:
- ${product.title || 'Untitled product'} (category: ${product.category || 'unknown'})
- tags: ${productTags}
- price: ${product.price != null ? product.price : 'unknown'}
- popularity score: ${product.popularity != null ? product.popularity : 'unknown'}

${instruction}
Keep the tone: friendly, plain English. Do NOT include marketing copy like "Buy now".`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens,
        temperature: 0.6,
      }
    });

    // SDK typically returns text in res.text; fallback to other shapes if needed
    const text = (res && (res.text || res.outputText || res.output)) ? (res.text || res.outputText || res.output) : '';
    return (typeof text === 'string') ? text.trim() : '';
  } catch (err) {
    console.error('generateExplanation error:', err);
    // return a clear fallback explanation so UI doesn't break
    return `Recommended based on your recent activity (category: ${preferredCategories}).`;
  }
}

/**
 * Enrich every recommendation in the payload with a longer explanation.
 * - payload: object like the JSON you posted
 * - options: { sentences: number } or { type: 'short'|'medium'|'long' }, batchSize: number
 */


/* Example usage:
(async () => {
  const payload = require('./samplePayload.json'); // your JSON
  const enriched = await enrichRecommendations(payload, { sentences: 3 }, 2);
  console.log(JSON.stringify(enriched, null, 2));
})();
*/

module.exports = { generateExplanation};
