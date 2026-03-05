/* ─────────────────────────────────────────
   netlify/functions/analyze.js  v9
   KEY FIXES:
   • Fetch timeout 4s (was 9s — was killing Netlify 10s limit)
   • sanitize() keeps double quotes (they're fine in prompt)
   • response_format: json_object for guaranteed JSON
   • Robust fallback if site unreachable
─────────────────────────────────────────── */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Only strip chars that break JS template literals
function sanitize(str) {
  return str
    .replace(/`/g, "'")
    .replace(/\$\{/g, 'S{')
    .replace(/\\/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'GROQ_API_KEY not set in Netlify env vars' }) };

  let url;
  try {
    const b = JSON.parse(event.body || '{}');
    url = (b.url || '').trim().toLowerCase().replace(/^www\./, '').split('/')[0].split('?')[0];
    if (!url) throw new Error('no url');
  } catch (_) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid request' }) };
  }

  // ── Fetch website — 4s timeout so we stay within Netlify 10s limit ──
  let siteText = '';
  let fetchSuccess = false;
  for (const target of [`https://${url}`, `https://www.${url}`]) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);  // 4s max
      const r = await fetch(target, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
      });
      clearTimeout(t);
      if (!r.ok) continue;
      const html = await r.text();

      const get = (rx) => (html.match(rx) || [])[1] || '';
      const all = (rx) => [...html.matchAll(rx)].map(m => m[1]).slice(0, 4).join(' | ');

      const parts = [
        get(/<title[^>]*>([^<]{3,120})<\/title>/i),
        get(/<meta[^>]*name="description"[^>]*content="([^"]{10,300})"/i),
        get(/<meta[^>]*property="og:title"[^>]*content="([^"]{3,120})"/i),
        get(/<meta[^>]*property="og:description"[^>]*content="([^"]{10,300})"/i),
        all(/<h1[^>]*>([^<]{3,100})<\/h1>/gi),
        all(/<h2[^>]*>([^<]{3,100})<\/h2>/gi),
      ].filter(Boolean);

      if (parts.length > 0) {
        // Also grab body text briefly
        const body = html
          .replace(/<script[\s\S]*?<\/script>/gi, '')
          .replace(/<style[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ').trim().slice(0, 1500);
        parts.push(body);
        siteText = parts.join(' | ');
        fetchSuccess = true;
        break;
      }
    } catch (_) { /* timeout or network error — try next */ }
  }

  if (!siteText) siteText = `Domain: ${url}. Site unreachable — infer category from domain name.`;
  const safe = sanitize(siteText).slice(0, 2500);

  // ── Groq prompt ──
  const sys = `You are LaunchPe, an AI that helps Indian startup founders launch their products.
Output ONLY a valid JSON object. No markdown. No explanation. No text outside the JSON.
Use double quotes for all JSON keys and string values.`;

  const usr = `Analyze this product and return a complete launch strategy.

URL: ${url}
SITE DATA: ${safe}

Return this exact JSON (all fields required, specific to THIS product):
{
  "ico": "emoji",
  "name": "product name",
  "url": "${url}",
  "desc": "one sentence describing what this does and who it helps",
  "tags": ["Category", "Market", "Type"],
  "count": "10 communities · 4 platforms",
  "rMeta": "5 subreddits · 3 post angles",
  "rComms": [
    ["r/indianstartups", "120K members", "98%"],
    ["r/india", "800K members", "88%"],
    ["r/startups", "1.2M members", "82%"]
  ],
  "rPost": {
    "title": "Reddit title under 12 words, genuine not clickbait",
    "body": "Paragraph 1: problem/story (2 sentences).\\nParagraph 2: what you built + URL (2 sentences). Max 70 words.",
    "sub": "r/indianstartups",
    "upvotes": "320"
  },
  "liPost": {
    "body": "Hook line.\\nPoint 2.\\nPoint 3.\\nPoint 4.\\nCTA + URL.\\nMax 80 words total.",
    "name": "You",
    "role": "Founder",
    "likes": 480,
    "comments": 72,
    "reposts": 41
  },
  "twPost": {
    "thread": [
      "Tweet 1: hook, max 220 chars",
      "Tweet 2: insight or problem, max 220 chars",
      "Tweet 3: result or proof, max 220 chars",
      "Tweet 4: CTA with URL, max 220 chars"
    ],
    "handle": "@yourhandle"
  },
  "waPost": {
    "en": "2-sentence casual WhatsApp message recommending the product with URL.",
    "hi": "Same in Hinglish."
  },
  "waComms": [
    ["Indian Startup Founders Telegram", "97%"],
    ["SaaS Founders India", "93%"],
    ["Indie Hackers India", "90%"],
    ["IIT Alumni Network", "87%"],
    ["Product Hunt India Telegram", "85%"],
    ["Dev Community India", "83%"],
    ["VC and Angel India", "80%"],
    ["Startup India Telegram", "78%"],
    ["Freelancers India", "76%"],
    ["B2B SaaS India", "74%"]
  ],
  "score": 78,
  "sTitle": "High Viral Potential",
  "sDesc": "2 sentences: why this score and which platform to prioritise first."
}`;

  try {
    const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: sys }, { role: 'user', content: usr }],
        temperature: 0.6,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      })
    });

    if (!gr.ok) {
      const st = gr.status;
      if (st === 429) return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'AI busy — wait 10 seconds and retry' }) };
      const txt = await gr.text().catch(() => '');
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: `Groq error ${st}` }) };
    }

    const gj  = await gr.json();
    const raw = (gj.choices?.[0]?.message?.content || '').trim();
    if (!raw) return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: 'Empty AI response' }) };

    // Extract JSON (strip any accidental markdown)
    const match = raw.match(/\{[\s\S]+\}/);
    const jsonStr = match ? match[0] : raw;

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (_) {
      const fixed = jsonStr.replace(/,(\s*[}\]])/g, '$1');
      parsed = JSON.parse(fixed); // throws if still broken → caught below
    }

    parsed._fetchSuccess = fetchSuccess;
    return { statusCode: 200, headers: CORS, body: JSON.stringify(parsed) };

  } catch (e) {
    console.error('analyze error:', e.message);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: e.message }) };
  }
};
