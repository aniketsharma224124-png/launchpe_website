import Groq from "groq-sdk";
export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const M = "llama-3.1-8b-instant";

function clean(s: string) {
  let t = s.replace(/```json\n?|\n?```/g, "").trim();

  // Extract only the JSON part from potential conversational wrapper
  const firstBrace = t.indexOf('{');
  const firstBracket = t.indexOf('[');
  let startIdx = firstBrace !== -1 && firstBracket !== -1 ? Math.min(firstBrace, firstBracket) : Math.max(firstBrace, firstBracket);

  const lastBrace = t.lastIndexOf('}');
  const lastBracket = t.lastIndexOf(']');
  let endIdx = lastBrace !== -1 && lastBracket !== -1 ? Math.max(lastBrace, lastBracket) : Math.max(lastBrace, lastBracket);

  if (startIdx !== -1 && endIdx !== -1 && endIdx >= startIdx) {
    t = t.substring(startIdx, endIdx + 1);
  }

  try { JSON.parse(t); return t; } catch { /* needs fixing */ }
  // Only escape control chars inside JSON string values (between quotes)
  let out = "";
  let inStr = false;
  let esc = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (esc) { out += ch; esc = false; continue; }
    if (ch === '\\' && inStr) { out += ch; esc = true; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && ch === '\n') { out += '\\n'; continue; }
    if (inStr && ch === '\r') { out += '\\r'; continue; }
    if (inStr && ch === '\t') { out += '\\t'; continue; }
    out += ch;
  }
  return out;
}

export async function analyzeProduct(url: string, websiteContent?: string | { title: string, description: string, textContext: string } | null) {
  let contextText = "";
  if (typeof websiteContent === 'string') {
    contextText = websiteContent;
  } else if (websiteContent) {
    contextText = `Title: ${websiteContent.title}\nDescription: ${websiteContent.description}\nPage Text (truncated): ${websiteContent.textContext}`;
  }

  const contextStr = contextText
    ? `\n\n--- ACTUAL WEBSITE CONTENT ---\n${contextText}\n------------------------------`
    : "";

  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 3000,
    messages: [{
      role: "system", content: "You are a viral launch strategist. Return ONLY valid JSON, no markdown, no explanation."
    }, {
      role: "user", content: `Analyze this product URL: ${url}${contextStr}

Return this exact JSON (fill with REAL plausible data based on the website content provided).
IMPORTANT: For communities, you MUST use REAL, existing subreddits, REAL LinkedIn groups, and REAL working WhatsApp/Telegram links. Do not hallucinate.
Platform priority: Reddit > LinkedIn > Twitter > Telegram > WhatsApp. Find 20+ real, active communities total.
{
  "productName": "inferred product name",
  "productDescription": "one clear sentence what it does based on the actual website text",
  "categories": ["tag1","tag2","tag3"],
  "launchReadiness": {
    "overallScore": 75,
    "landingPage": { "score": 7, "reason": "Clear value prop, but lacks strong social proof." },
    "communityFit": { "score": 9, "reason": "High relevance to Indian SaaS founders." },
    "contentStrategy": { "score": 5, "reason": "Needs more educational content before pitching." },
    "distribution": { "score": 6, "reason": "Good Reddit potential, but missing newsletter outreach." }
  },
  "uniqueAngles": ["angle 1","angle 2","angle 3"],
  "communities": {
    "reddit": {
      "subreddits": [
        {"name":"r/indianstartups","members":"120K","match":95},
        {"name":"r/india","members":"800K","match":88},
        {"name":"r/startups","members":"1.2M","match":82},
        {"name":"r/SideProject","members":"180K","match":78},
        {"name":"r/entrepreneur","members":"950K","match":74},
        {"name":"r/SaaS","members":"60K","match":90},
        {"name":"r/indiebiz","members":"45K","match":72},
        {"name":"r/smallbusiness","members":"1.5M","match":68}
      ],
      "postAngles": 3,
      "preview": {
        "subreddit": "r/indianstartups",
        "upvotes": "200+",
        "title": "I built [Product Name] — solving [specific problem] for Indian founders",
        "body": "Been working on this for a few months and finally shipping it.\\n\\nThe problem: [specific pain point based on the product]\\n\\nBuilt it with an India-first approach — [key differentiator].\\n\\nWould love honest feedback from this community!"
      }
    },
    "linkedin": {
      "formats": 3,
      "bestTime": "9 AM Tue/Thu",
      "preview": {
        "author": "You",
        "role": "Founder at [Product Name]",
        "content": "Just shipped [Product Name].\\n\\nNo VC funding. No big team. Just a clear problem and code.\\n\\nBuilt for India. Priced for India.\\n\\n[One specific insight about the problem]\\n\\nCheck it out: ${url}",
        "reactions": 500,
        "comments": 80,
        "reposts": 45
      },
      "groups": [
        {"name": "Indian Startup Founders", "members": "50K+", "match": 92},
        {"name": "SaaS Growth Hacks", "members": "30K+", "match": 85},
        {"name": "Product Management Network", "members": "120K+", "match": 78}
      ]
    },
    "twitter": {
      "threads": 1,
      "replyHooks": 5,
      "preview": "Thread: I just launched [Product Name] 🧵\\n\\n1/ The problem nobody talks about...\\n\\n2/ How I built it differently...\\n\\n3/ What I learned...",
      "accounts": [
        {"handle": "@IndieHackers", "followers": "200K+", "match": 90},
        {"handle": "@buildinpublic", "followers": "50K+", "match": 88}
      ]
    },
    "whatsapp": {
      "groupTypes": 8,
      "tone": "Human",
      "preview": "Hey! Built something I think will genuinely help founders here. [Product Name] — [one line value prop]. Honest feedback welcome 🙏",
      "groups": [
        {"name": "Indian Startups & Founders", "platform": "WhatsApp", "url": "https://chat.whatsapp.com/relevant-group", "members": "~500"},
        {"name": "SaaS India Founders", "platform": "Telegram", "url": "https://t.me/saasindiafounder", "members": "~2K"},
        {"name": "Indie Hackers India", "platform": "WhatsApp", "url": "https://chat.whatsapp.com/indiehackers", "members": "~300"},
        {"name": "Startup India Community", "platform": "Telegram", "url": "https://t.me/startupindia", "members": "~5K"},
        {"name": "Product Builders", "platform": "Telegram", "url": "https://t.me/productbuilders", "members": "~1.5K"},
        {"name": "Growth Hackers India", "platform": "WhatsApp", "url": "https://chat.whatsapp.com/growthhackers", "members": "~400"}
      ]
    }
  }
}

Replace ALL placeholders like [Product Name] with the actual inferred product name from URL: ${url}`
    }]
  });
  const data = JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
  const name = data.productName || url;
  // Personalize previews
  const r = data.communities?.reddit?.preview;
  if (r) { r.title = r.title?.replace(/\[Product Name\]/gi, name); r.body = r.body?.replace(/\[Product Name\]/gi, name); }
  const li = data.communities?.linkedin?.preview;
  if (li) { li.content = li.content?.replace(/\[Product Name\]/gi, name); li.role = `Founder at ${name}`; }
  const tw = data.communities?.twitter;
  if (tw) tw.preview = tw.preview?.replace(/\[Product Name\]/gi, name);
  const wa = data.communities?.whatsapp;
  if (wa) wa.preview = wa.preview?.replace(/\[Product Name\]/gi, name);
  return data;
}

export async function generatePosts(url: string, platform: string, tone: string, analysis: Record<string, unknown>) {
  const guides: Record<string, string> = {
    reddit: "Reddit: conversational, value-first, NO marketing speak. Start with subreddit name. Format with clear paragraphs.",
    linkedin: "LinkedIn: founder storytelling, 150-250 words. Format clearly for easy copy-pasting with double line breaks between short sentences to build momentum.",
    twitter: "Twitter/X: max 280 chars each. If thread, separate tweets with --- so they can be easily copied individually.",
    whatsapp: "WhatsApp: casual, personal, short, like a message to a friend.",
  };
  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.9, max_tokens: 2000,
    messages: [{ role: "system", content: "Return ONLY valid JSON, no markdown. IMPORTANT: Inside JSON string values, use \\\\n for newlines, never use actual line breaks inside strings. This is critical for LinkedIn posts which have many line breaks." }, {
      role: "user", content: `Create 3 ${platform} posts for: ${url}
Context: ${JSON.stringify({ productName: (analysis as { productName: string }).productName, description: (analysis as { productDescription: string }).productDescription, angles: (analysis as { uniqueAngles: string[] }).uniqueAngles })}
Guide: ${guides[platform] || ""}
Tone: ${tone}
JSON: {"posts":[{"content":"full text","hook":"attention hook","community":"specific community name"}]}`
    }]
  });
  return JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
}

export async function generateCalendar(url: string, plan: string, days: number) {
  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 4000,
    messages: [{ role: "system", content: "Return ONLY valid JSON." }, {
      role: "user", content: `Create a ${days}-day launch calendar for: ${url} (${plan} plan)
Include pre-launch (days 1-5), launch week, growth phase.
JSON: {"days":[{"day":1,"theme":"Theme name","tasks":[{"title":"task","description":"detail","platform":"platform","priority":"high|medium|low"}]}]}`
    }]
  });
  return JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
}

export async function generateDistribution(analysis: Record<string, unknown>) {
  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 3500,
    messages: [{ role: "system", content: "Return ONLY valid JSON. For communities, newsletters, and founderGroups — you MUST include real, working URLs that someone can actually click to join or visit. Use real WhatsApp group invite links (chat.whatsapp.com), Telegram group links (t.me), Slack invite links, Discord invite links, newsletter subscribe pages, etc. Match them to the product's niche." }, {
      role: "user", content: `Map distribution channels for: ${JSON.stringify({ name: (analysis as { productName: string }).productName, desc: (analysis as { productDescription: string }).productDescription, cats: (analysis as { categories: string[] }).categories, url: (analysis as { url: string }).url })}
Return 8+ items per category. ALL URLs must be real, working links someone can actually click.
JSON: {
  "reddit":[{"name":"r/sub","members":"100K","type":"subreddit","relevance":"why relevant"},{"name":"r/sub2","members":"50K","type":"subreddit","relevance":"why"},{"name":"r/sub3","members":"200K","type":"subreddit","relevance":"why"},{"name":"r/sub4","members":"80K","type":"subreddit","relevance":"why"},{"name":"r/sub5","members":"150K","type":"subreddit","relevance":"why"},{"name":"r/sub6","members":"30K","type":"subreddit","relevance":"why"},{"name":"r/sub7","members":"90K","type":"subreddit","relevance":"why"},{"name":"r/sub8","members":"60K","type":"subreddit","relevance":"why"}],
  "communities":[{"name":"community","platform":"WhatsApp|Telegram|Discord|Slack|LinkedIn","type":"group type","relevance":"why","url":"https://real-join-link"}],
  "directories":[{"name":"Product Hunt","type":"directory","url":"https://producthunt.com"},{"name":"BetaList","type":"directory","url":"https://betalist.com"},{"name":"IndieHackers","type":"community","url":"https://indiehackers.com"},{"name":"MicroLaunch","type":"directory","url":"https://microlaunch.net"},{"name":"Launching Next","type":"directory","url":"https://launchingnext.com"},{"name":"AlternativeTo","type":"directory","url":"https://alternativeto.net"},{"name":"SaaSHub","type":"directory","url":"https://saashub.com"},{"name":"There's An AI For That","type":"directory","url":"https://theresanaiforthat.com"}],
  "newsletters":[{"name":"newsletter name","audience":"target audience","type":"paid|free","url":"https://newsletter-subscribe-link"}],
  "founderGroups":[{"name":"group name","platform":"WhatsApp|Telegram|Slack","members":"~50-500","url":"https://real-join-link"}]
}`
    }]
  });
  return JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
}

export async function generateOutreach(url: string, analysis: Record<string, unknown>) {
  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.8, max_tokens: 3000,
    messages: [{ role: "system", content: "Return ONLY valid JSON." }, {
      role: "user", content: `Write 4 outreach email templates for: ${url}
Product: ${JSON.stringify({ name: (analysis as { productName: string }).productName, desc: (analysis as { productDescription: string }).productDescription })}
JSON: {"emails":[
  {"type":"early_adopter","subject":"subject","body":"full email with [Name] placeholder"},
  {"type":"beta_invite","subject":"subject","body":"full email"},
  {"type":"influencer","subject":"subject","body":"full email"},
  {"type":"investor","subject":"subject","body":"full email"}
]}`
    }]
  });
  return JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
}

export async function generateKit(analysis: Record<string, unknown>) {
  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 2000,
    messages: [{ role: "system", content: "Return ONLY valid JSON." }, {
      role: "user", content: `Product Hunt launch kit for: ${JSON.stringify({ name: (analysis as { productName: string }).productName, desc: (analysis as { productDescription: string }).productDescription })}
JSON: {"productHuntTitle":"max 30 chars","productHuntTagline":"max 60 chars","productHuntDescription":"2-3 paragraphs","productHuntTopics":["t1","t2","t3"],"launchChecklist":[{"title":"Step title","description":"Detailed actionable explanation of what to do, why it matters, and how to execute it. 2-3 sentences minimum."}],"badges":["badge1","badge2"]}
IMPORTANT: launchChecklist must have exactly 10 items. Each item must have a 'title' (short action) and 'description' (detailed 2-3 sentence explanation of how to execute the step, specific tips, and why it matters).`
    }]
  });
  return JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
}

export async function generateImprovements(analysis: Record<string, unknown>) {
  const c = await groq.chat.completions.create({
    model: M, response_format: { type: "json_object" }, temperature: 0.7, max_tokens: 3000,
    messages: [{ role: "system", content: "Return ONLY valid JSON." }, {
      role: "user", content: `Landing page CRO improvements for: ${JSON.stringify({ name: (analysis as { productName: string }).productName, desc: (analysis as { productDescription: string }).productDescription, url: (analysis as { url: string }).url })}
JSON: {"improvements":[{"section":"Hero|CTA|Social Proof|etc","issue":"specific problem","suggestion":"actionable fix","priority":"critical|high|medium","example":"example copy"}],"quickWins":["win1","win2","win3","win4","win5"],"abTests":[{"element":"what","variant":"try this"}]}`
    }]
  });
  return JSON.parse(clean(c.choices[0]?.message?.content || "{}"));
}
