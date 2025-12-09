const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || null,
});

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
      instruction = 'Write 3-4 short sentences (or 3 bullet points) explaining why this product is recommended to the user.';
    } else {
      // for very long text
      maxOutputTokens = Math.min(512, 50 * s); // conservative upper bound
      instruction = `Write ${s} sentences explaining why this product is recommended to the user. Be clear and user-friendly.`;
    }
  } else if (lengthHint && lengthHint.type) {
    if (lengthHint.type === 'short') { maxOutputTokens = 40; instruction = 'Write 1 concise sentence.'; }
    if (lengthHint.type === 'medium') { maxOutputTokens = 80; instruction = 'Write 2 concise sentences.'; }
    if (lengthHint.type === 'long') { maxOutputTokens = 160; instruction = 'Write 3-4 short sentences or 3 bullet points.'; }
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

    const text = (res && (res.text || res.outputText || res.output)) ? (res.text || res.outputText || res.output) : '';
    return (typeof text === 'string') ? text.trim() : '';
  } catch (err) {
    console.error('generateExplanation error:', err);
    return `Recommended based on your recent activity (category: ${preferredCategories}).`;
  }
}

module.exports = { generateExplanation};
