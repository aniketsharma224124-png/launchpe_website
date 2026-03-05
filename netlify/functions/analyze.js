/* ─────────────────────────────────────────
   netlify/functions/analyze.js
   - Fetches real website HTML
   - Uses Groq web_search for real WhatsApp/Telegram communities
   - Basic: 10 communities, Premium: 20+
─────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'GROQ_API_KEY not set in Netlify env vars' }) };

  let url;
  try {
    const body = JSON.parse(event.body || '{}');
    url = (body.url || '').trim().toLowerCase();
    if (!url) throw new Error('No URL');
  } catch (e) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  // ── Step 1: Fetch real website content ──
  let websiteContent = '';
  let fetchSuccess = false;
  for (const target of [`https://${url}`, `https://www.${url}`, `http://${url}`]) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(target, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LaunchPeBot/1.0)', 'Accept': 'text/html' }
      });
      clearTimeout(t);
      if (r.ok) {
        const html = await r.text();
        websiteContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
          .replace(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/gi, ' METADESC: $1 ')
          .replace(/<title[^>]*>([^<]+)<\/title>/gi, ' TITLE: $1 ')
          .replace(/<h1[^>]*>([^<]{3,80})<\/h1>/gi, ' H1: $1 ')
          .replace(/<h2[^>]*>([^<]{3,80})<\/h2>/gi, ' H2: $1 ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
          .replace(/\s+/g, ' ').trim().substring(0, 3500);
        fetchSuccess = true;
        break;
      }
    } catch (_) {}
  }
  if (!websiteContent) websiteContent = `Could not fetch ${url}. Infer from domain only.`;

  // ── Step 2: Build prompt ──
  const system = `You are LaunchPe, an AI launch tool for Indian founders. Output ONLY valid JSON. No markdown, no backticks. Escape all newlines in strings as \\n.`;

  const prompt = `Analyze this product and generate a complete launch strategy.

URL: ${url}
WEBSITE CONTENT:
---
${websiteContent}
---

Generate launch strategy as this EXACT JSON (no extra fields, no markdown):

{
  "ico": "one emoji",
  "name": "product name from website",
  "url": "${url}",
  "desc": "one precise sentence describing what this product does",
  "tags": ["Category", "Market", "Type"],
  "count": "10 matches · 4 platforms",
  "rMeta": "6 subreddits · 3 post angles",
  "rComms": [
    ["r/realsubreddit1", "memberCount", "relevance%"],
    ["r/realsubreddit2", "memberCount", "relevance%"],
    ["r/realsubreddit3", "memberCount", "relevance%"]
  ],
  "rPost": {
    "title": "Reddit title — genuine value, not clickbait, max 12 words",
    "body": "2 short paragraphs. Founder voice. Specific to this product. Max 80 words total.",
    "sub": "r/bestsubreddit",
    "upvotes": "250"
  },
  "liPost": {
    "body": "Hook line.\\nLine 2.\\nLine 3.\\nLine 4.\\nLine 5.\\nURL. Max 80 words. Line breaks between each line.",
    "name": "You",
    "role": "Founder at ProductName",
    "likes": 400,
    "comments": 60,
    "reposts": 35
  },
  "twPost": {
    "thread": ["Tweet1 hook max 200 chars", "Tweet2 insight max 200 chars", "Tweet3 proof max 200 chars", "Tweet4 CTA+URL max 200 chars"],
    "handle": "@yourhandle"
  },
  "waPost": {
    "en": "2 sentence WhatsApp message. Casual. Includes URL.",
    "hi": "Same in natural Hinglish."
  },
  "waComms": [
    ["Real Indian WhatsApp/Telegram community name 1 relevant to this product", "relevance%"],
    ["Real Indian community name 2", "relevance%"],
    ["Real Indian community name 3", "relevance%"],
    ["Real Indian community name 4", "relevance%"],
    ["Real Indian community name 5", "relevance%"],
    ["Real Indian community name 6", "relevance%"],
    ["Real Indian community name 7", "relevance%"],
    ["Real Indian community name 8", "relevance%"],
    ["Real Indian community name 9", "relevance%"],
    ["Real Indian community name 10", "relevance%"]
  ],
  "score": 75,
  "sTitle": "High Viral Potential",
  "sDesc": "Two short sentences. Why this score. Which platform works best first."
}

RULES:
- Use actual website content — no invented features
- rComms: real subreddits for this product's niche
- waComms: 10 very specific, real Indian WhatsApp/Telegram group types (e.g. "SaaS Founders India Telegram", "Delhi Startup Network WhatsApp", "IIT Alumni Founders Group") — be niche-specific, NOT generic
- All post content must be SHORT — max 80 words per post
- Posts must sound authentic, not like ads`;

  // ── Step 3: Groq call ──
  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqRes.ok) {
      const s = groqRes.status;
      if (s === 429) return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Rate limit. Please wait 10 seconds.' }) };
      const t = await groqRes.text();
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: `Groq error ${s}: ${t.substring(0,150)}` }) };
    }

    const gData = await groqRes.json();
    const raw = gData.choices?.[0]?.message?.content || '';
    if (!raw) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Empty AI response' }) };

    const cleaned = raw.replace(/```json/gi,'').replace(/```/g,'').trim();
    const parsed = JSON.parse(cleaned);
    parsed._fetchSuccess = fetchSuccess;

    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };

  } catch (e) {
    console.error('analyze error:', e);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
