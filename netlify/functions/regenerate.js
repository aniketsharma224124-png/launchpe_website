/* ─────────────────────────────────────────
   netlify/functions/regenerate.js
   - Short, punchy responses (not essays)
   - Returns cached slot for Basic plan (frontend handles 15-limit)
   - Premium: always fresh unlimited content
─────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Platform-specific short-form instructions
const INSTRUCTIONS = {
  reddit: {
    prompt: `Write a Reddit post body (NO title). Max 3 short paragraphs. Each paragraph max 2 sentences. Authentic founder voice. Genuine value. No marketing. End with one soft URL mention. KEEP IT SHORT.`,
    maxTokens: 280
  },
  linkedin: {
    prompt: `Write a LinkedIn post. Format: 1 strong hook line, then 5-7 SHORT lines (1 sentence each), end with URL. Line breaks between each. Max 150 words total. 1 emoji max. Professional but personal.`,
    maxTokens: 250
  },
  twitter: {
    prompt: `Write a 4-tweet thread. Separate tweets with "|||". Each tweet max 200 characters. Tweet 1: punchy hook. Tweet 2: key insight. Tweet 3: proof/result. Tweet 4: CTA + URL. Ultra-concise.`,
    maxTokens: 220
  },
  whatsapp: {
    prompt: `Write a WhatsApp message. Max 2 sentences. Friend-to-friend tone. Include product URL. No marketing speak. Very short.`,
    maxTokens: 120
  }
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'API key not configured' }) };

  let platform, productName, productUrl, productDesc, customDescription;
  try {
    const body = JSON.parse(event.body || '{}');
    platform = (body.platform || '').toLowerCase();
    productName = body.productName || 'Product';
    productUrl = body.productUrl || '';
    productDesc = body.productDesc || '';
    customDescription = (body.customDescription || '').trim();
    if (!INSTRUCTIONS[platform]) throw new Error('Invalid platform: ' + platform);
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }

  const inst = INSTRUCTIONS[platform];
  const angleNote = customDescription
    ? `\n\nUSER REQUESTED ANGLE: "${customDescription}" — build the post specifically around this.`
    : '\n\nCreate a completely fresh variation with a different hook and angle.';

  const systemMsg = `You are a professional Indian startup content writer. You write SHORT, punchy, platform-native posts. Output ONLY the post text. No labels, no "Here's your post:", no preamble, no markdown. Just the post.`;

  const userMsg = `Product: ${productName}
URL: ${productUrl}
What it does: ${productDesc}
Platform: ${platform.toUpperCase()}
${angleNote}

INSTRUCTIONS: ${inst.prompt}

Write it now. Output only the post text, nothing else.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg }
        ],
        temperature: 0.9,
        max_tokens: inst.maxTokens
      })
    });

    if (!res.ok) {
      const status = res.status;
      if (status === 429) return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Rate limit. Wait a moment.' }) };
      const t = await res.text();
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'AI error: ' + t.substring(0, 100) }) };
    }

    const data = await res.json();
    let content = (data.choices?.[0]?.message?.content || '').trim();
    // Strip any accidental preamble like "Here's your post:"
    content = content.replace(/^(here('s| is) (your |a )?(post|content|tweet|message)[:\s]*)/i, '').trim();

    if (!content) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Empty AI response' }) };

    if (platform === 'twitter') {
      const tweets = content.split('|||').map(t => t.trim()).filter(Boolean);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ content, tweets }) };
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ content }) };

  } catch (e) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
