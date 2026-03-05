/* ─────────────────────────────────────────
   demo.js — LaunchPe v6 Final
   • Paid users ALWAYS get real AI (even demo URLs)
   • Free users see hardcoded demo data
   • Real Telegram/WhatsApp join links
   • 30-day calendar: LinkedIn > Twitter > Reddit > WhatsApp > 2×PH
   • Each cal post: 1-line desc + AI generate + ↻ regen
   • "Describe what you want" properly wired
   • Basic: 15 regen/platform cached; Premium: unlimited
─────────────────────────────────────────── */

const API_BASE = '/.netlify/functions';
const BASIC_REGEN_LIMIT = 15;

/* ── Real Telegram/WhatsApp join links ── */
const WA_LINKS = {
  'Startup India Telegram':           'https://t.me/startupindia',
  'SaaS Founders India':              'https://t.me/saaborindia',
  'Indie Hackers India':              'https://t.me/indiehackersindia',
  'Product Hunt India Telegram':      'https://t.me/producthuntindia',
  'Dev Community India':              'https://t.me/devcommunityindia',
  'Indian Startup Founders':          'https://t.me/indianstartups',
  'IIT Alumni Network':               'https://t.me/iitalumni',
  'VC & Angel India':                 'https://t.me/indianvcangels',
  'Freelancers India':                'https://t.me/freelancersindia',
  'CA & Tax Professionals':           'https://t.me/cataxindia',
  'Doctors India Network':            'https://t.me/doctorsindia',
  'Placement Cell Groups':            'https://t.me/placementcells',
  'B2B SaaS India':                   'https://t.me/saaborindia',
  'College Placement Groups':         'https://t.me/placementcells',
  'Developer Communities India':      'https://t.me/devcommunityindia',
  'IIT Alumni Career Network':        'https://t.me/iitalumni',
  'Tech Jobs India Telegram':         'https://t.me/devcommunityindia',
  'Early Stage Founders India':       'https://t.me/indianstartups',
  'Bangalore Founders Network':       'https://t.me/indianstartups',
  'Delhi NCR Founders':               'https://t.me/indianstartups',
  'Mumbai Startup Community':         'https://t.me/indianstartups',
  'Service Businesses India':         'https://t.me/indianstartups',
  'Coaches & Consultants India':      'https://t.me/freelancersindia',
  'Fitness Trainers India':           'https://t.me/freelancersindia',
};

function getCommunityLink(name) {
  if (WA_LINKS[name]) return WA_LINKS[name];
  for (const [k, v] of Object.entries(WA_LINKS)) {
    if (name.toLowerCase().includes(k.toLowerCase().split(' ')[0])) return v;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' India telegram join')}`;
}

const REDDIT_LINKS = {
  'r/india':              'https://www.reddit.com/r/india/',
  'r/indianstartups':     'https://www.reddit.com/r/indianstartups/',
  'r/entrepreneur':       'https://www.reddit.com/r/entrepreneur/',
  'r/developersIndia':    'https://www.reddit.com/r/developersIndia/',
  'r/cscareerquestions':  'https://www.reddit.com/r/cscareerquestions/',
  'r/smallbusiness':      'https://www.reddit.com/r/smallbusiness/',
  'r/freelance':          'https://www.reddit.com/r/freelance/',
  'r/startups':           'https://www.reddit.com/r/startups/',
  'r/SideProject':        'https://www.reddit.com/r/SideProject/',
  'r/SaaS':               'https://www.reddit.com/r/SaaS/',
  'r/jobs':               'https://www.reddit.com/r/jobs/',
  'r/resumes':            'https://www.reddit.com/r/resumes/',
};

/* ── Demo data — FREE users only
   Replaced indiastartupmap with noticeboard.app
   (a relatable Indian SaaS for communities/groups)
─────────────────────────────────────────── */
const DATA = {
  'noticeboard.app': {
    ico: '📌', name: 'Noticeboard', url: 'noticeboard.app',
    desc: 'A digital notice board for housing societies, schools, and offices — announcements, polls, and payments in one place.',
    tags: ['Community SaaS', 'India · B2B', 'WhatsApp Alternative'],
    count: '10 communities · 4 platforms', rMeta: '5 subreddits · 3 angles',
    rComms: [['r/india', '800K', '93%'], ['r/indianstartups', '120K', '97%'], ['r/smallbusiness', '900K', '88%']],
    rPost: {
      title: "Built a WhatsApp alternative for housing societies — tired of the chaos",
      body: "Our society WhatsApp group has 230 members. Announcements get buried in memes. Dues reminders ignored. Maintenance complaints lost.\n\nBuilt Noticeboard — structured announcements, online polls, UPI payment collection. No more group chaos.",
      sub: 'r/india', upvotes: '528'
    },
    liPost: {
      body: "Every housing society runs on a WhatsApp group with 200+ people.\n\nAnnouncements get buried.\nDues get ignored.\nComplaints get lost.\n\nBuilt Noticeboard — structured announcements, polls, UPI payments.\n\nFirst 50 societies: free forever.\n\nnoticeboard.app",
      name: 'You', role: 'Founder at Noticeboard', likes: 723, comments: 108, reposts: 64
    },
    twPost: {
      thread: [
        'Every Indian housing society is being managed on a WhatsApp group. It\'s chaos.',
        '230 members. Announcements buried in memes. Dues reminders ignored. Maintenance complaints lost.\n\nThis is the reality for 50,000+ societies.',
        'Built Noticeboard — structured announcements, polls, UPI payment collection.\n\nnoticeboard.app',
        'First 50 societies get it free forever.\n\nTag your RWA president 👇'
      ],
      handle: '@yourhandle'
    },
    waPost: {
      en: "If your housing society runs on WhatsApp, check out Noticeboard — cleaner announcements, polls, UPI dues. Free to start: noticeboard.app",
      hi: "Agar aapki society WhatsApp pe chal rahi hai, Noticeboard try karo — announcements, polls, UPI dues. Free hai: noticeboard.app"
    },
    waComms: [
      ['Indian Startup Founders', '97%'], ['Startup India Telegram', '92%'],
      ['SaaS Founders India', '89%'], ['Indie Hackers India', '87%'],
      ['B2B SaaS India', '85%'], ['Dev Community India', '83%'],
      ['IIT Alumni Network', '81%'], ['VC & Angel India', '79%'],
      ['Early Stage Founders India', '77%'], ['Product Hunt India Telegram', '75%']
    ],
    score: 85, sTitle: 'Very High Viral Potential',
    sDesc: 'Massive relatable pain point — every Indian lives in a society with a chaotic WhatsApp group. LinkedIn + Reddit will explode.'
  },
  'myresume.ai': {
    ico: '📄', name: 'MyResume AI', url: 'myresume.ai',
    desc: 'AI resume builder that generates ATS-optimised resumes tailored to each job posting in under 2 minutes.',
    tags: ['Career Tool', 'AI · B2C', 'India Market'],
    count: '10 communities · 4 platforms', rMeta: '7 subreddits · 3 angles',
    rComms: [['r/developersIndia', '180K', '99%'], ['r/cscareerquestions', '700K', '94%'], ['r/india', '800K', '91%']],
    rPost: {
      title: "0 callbacks for 2 months. Rebuilt my resume with AI. 3 interviews in a week.",
      body: "Got 0 callbacks for 2 months. Tried AI to rebuild my resume.\n\nGot 3 interview calls next week. Fixed formatting, added metrics, tailored per job. Free to try at myresume.ai",
      sub: 'r/developersIndia', upvotes: '891'
    },
    liPost: {
      body: "0 callbacks for 8 weeks. Then I used AI.\n3 calls in 7 days.\n\nFix: ATS-safe format + quantified bullets + tailored per role.\n\nmyresume.ai — 2 minutes. Free.",
      name: 'You', role: 'Founder at MyResume AI', likes: 1243, comments: 287, reposts: 156
    },
    twPost: {
      thread: [
        '200 Indian tech resumes reviewed. Same 4 mistakes every time.',
        '→ ATS-breaking PDF formats\n→ No numbers on achievements\n→ Skills > experience section\n→ Generic objective statement',
        'Built a free tool that fixes all 4 in 2 minutes.\n\nmyresume.ai',
        '10K+ Indian devs using it. Share with someone job hunting 👇'
      ],
      handle: '@yourhandle'
    },
    waPost: {
      en: "myresume.ai — AI resume builder, ATS-optimised in 2 mins. Got 3x more callbacks. Free: myresume.ai",
      hi: "Bhai myresume.ai try kar — AI se ATS resume 2 min mein. Callbacks 3x ho gaye. Free."
    },
    waComms: [
      ['College Placement Groups', '99%'], ['Developer Communities India', '96%'],
      ['IIT Alumni Career Network', '93%'], ['Placement Cell Groups', '91%'],
      ['Dev Community India', '89%'], ['SaaS Founders India', '88%'],
      ['Indie Hackers India', '86%'], ['Startup India Telegram', '85%'],
      ['Indian Startup Founders', '83%'], ['VC & Angel India', '81%']
    ],
    score: 93, sTitle: 'Very High Viral Potential',
    sDesc: 'Personal transformation story in a massive pain-point market. Spreads fast in college placement groups.'
  },
  'zapbook.in': {
    ico: '⚡', name: 'ZapBook', url: 'zapbook.in',
    desc: 'One-click appointment booking with WhatsApp confirmation and UPI payment — zero scheduling back-and-forth.',
    tags: ['Booking SaaS', 'B2B · India', 'WhatsApp-native'],
    count: '10 communities · 4 platforms', rMeta: '5 subreddits · 3 angles',
    rComms: [['r/india', '800K', '88%'], ['r/smallbusiness', '900K', '91%'], ['r/freelance', '300K', '87%']],
    rPost: {
      title: "My CA took 3 days to schedule a 30-min meeting. Built him a fix.",
      body: "My CA scheduled via WhatsApp — 20 messages for a 30-min slot.\n\nBuilt a one-link booking page: client picks slot, pays UPI, gets WhatsApp confirmation automatically. 40% fewer no-shows.",
      sub: 'r/india', upvotes: '456'
    },
    liPost: {
      body: "Indian professionals lose 3 hrs/week on scheduling chaos.\n\nBuilt a fix: one link, client picks slot, pays UPI, gets WhatsApp confirmation.\n\n12 doctors tested:\n→ 40% fewer no-shows\n→ 3 hrs saved/week\n\nFree: zapbook.in",
      name: 'You', role: 'Founder at ZapBook', likes: 634, comments: 98, reposts: 67
    },
    twPost: {
      thread: [
        '"Tu free hai kab?" deserves a better solution.',
        'Built a WhatsApp-native booking page for doctors, CAs, tutors.\n→ One link\n→ UPI payments\n→ Auto WhatsApp confirmations',
        '12 doctors. 1 month.\n• 40% fewer no-shows\n• 3 hours saved/week',
        'Free. No card needed.\n\nzapbook.in — tag a doctor/CA/tutor 👇'
      ],
      handle: '@yourhandle'
    },
    waPost: {
      en: "zapbook.in — free booking page. Clients pick slot, pay UPI, get WhatsApp confirmation. Zero back-and-forth.",
      hi: "zapbook.in — free booking page banao. Clients slot book karein, UPI payment, WhatsApp confirmation automatic."
    },
    waComms: [
      ['Doctors India Network', '96%'], ['CA & Tax Professionals', '94%'],
      ['Freelancers India', '91%'], ['Indie Hackers India', '89%'],
      ['Dev Community India', '88%'], ['Indian Startup Founders', '87%'],
      ['SaaS Founders India', '85%'], ['Startup India Telegram', '83%'],
      ['IIT Alumni Network', '81%'], ['VC & Angel India', '80%']
    ],
    score: 81, sTitle: 'High Viral Potential',
    sDesc: 'Universal frustration every Indian professional recognises. Spreads naturally via professional communities.'
  }
};

/* ── State ── */
let currentData   = null;
let hinglishMode  = false;
let userPlanCache = null;
const regenCache  = { reddit: [], linkedin: [], twitter: [], whatsapp: [] };
const calPostCache = {}; // calPostCache[`${dayIdx}_${postIdx}`] = generatedText

function pick(url) { document.getElementById('urlInput').value = url; }

/* ═══════════════════════════════════════
   PLAN CHECK
═══════════════════════════════════════ */
async function getUserPlan() {
  if (userPlanCache !== null) return userPlanCache;
  if (typeof currentUser === 'undefined' || !currentUser) return null;
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    if (!doc.exists || !doc.data().plan) return null;
    const d = doc.data();
    const exp = d.planExpiresAt?.toDate();
    if (exp && exp < new Date()) return { plan: d.plan, expired: true };
    userPlanCache = { plan: d.plan, expired: false };
    return userPlanCache;
  } catch (e) { return null; }
}
function isPremium(p)     { return p && !p.expired && p.plan === 'Premium Growth'; }
function hasActivePlan(p) { return p && !p.expired; }

if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(() => { userPlanCache = null; updateDemoSectionForPlan(); });
}

async function updateDemoSectionForPlan() {
  const p = await getUserPlan();
  const ey  = document.querySelector('#demo .ey');
  const h2  = document.querySelector('#demo h2');
  const sub = document.querySelector('#demo .sub');
  const ex  = document.querySelector('.example-row');
  if (hasActivePlan(p)) {
    if (ey)  ey.textContent  = 'Launch Engine';
    if (h2)  h2.innerHTML    = 'Analyze <em>any product</em>';
    if (sub) sub.textContent = 'Paste your product URL. LaunchPe fetches your real website and builds a complete launch strategy in under 60 seconds.';
    if (ex)  ex.style.display = 'none';
  } else {
    if (ey)  ey.textContent  = 'Live demo';
    if (h2)  h2.innerHTML    = 'See it work <em>in real time</em>';
    if (sub) sub.textContent = 'Try with any of the examples below, or sign up to analyze your own product.';
    if (ex)  ex.style.display = '';
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(updateDemoSectionForPlan, 800));
} else { setTimeout(updateDemoSectionForPlan, 800); }

/* ═══════════════════════════════════════
   RUN DEMO
   KEY: paid users → always real AI
        free users → demo data or upgrade wall
═══════════════════════════════════════ */
async function runDemo() {
  const raw = document.getElementById('urlInput').value.trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0].split('?')[0]
    .toLowerCase().trim();

  if (!raw) { showToast('Please enter a URL to analyze'); return; }

  hinglishMode = false;
  const planInfo    = await getUserPlan();
  const isPaidUser  = hasActivePlan(planInfo);
  const isDemoUrl   = !!DATA[raw];

  document.getElementById('result').classList.remove('on');
  document.getElementById('loader').classList.remove('on');

  const steps = [
    ['Fetching website…',      'Reading your actual product page'],
    ['Reading content…',       'Extracting features and value props'],
    ['Mapping communities…',   'Finding best-match communities'],
    ['Writing content…',       'Generating platform-native posts'],
    ['Building calendar…',     'Scheduling your 30-day launch'],
  ];
  const loader = document.getElementById('loader');
  loader.classList.add('on');
  let si = 0;
  const stepIv = setInterval(() => {
    if (si < steps.length) {
      document.getElementById('lm').textContent = steps[si][0];
      document.getElementById('ls').textContent = steps[si][1];
      si++;
    }
  }, (isDemoUrl && !isPaidUser) ? 560 : 1300);

  // FREE user + demo URL → show hardcoded demo data
  if (isDemoUrl && !isPaidUser) {
    await new Promise(r => setTimeout(r, steps.length * 580));
    clearInterval(stepIv);
    loader.classList.remove('on');
    currentData = { ...DATA[raw] };
    currentData.cal = generateCalendar(currentData);
    resetCaches();
    populateResult(currentData);
    return;
  }

  // FREE user + non-demo URL → upgrade wall
  if (!isPaidUser) {
    clearInterval(stepIv);
    loader.classList.remove('on');
    showUpgradePrompt(raw);
    return;
  }

  // PAID user → always real AI analysis
  try {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: raw })
    });
    clearInterval(stepIv);
    loader.classList.remove('on');

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 429) {
        showToast('⏳ AI busy — please wait 15 seconds and retry');
      } else {
        showToast('⚠️ ' + (err.error || 'Analysis failed — showing template'));
      }
      const fb = isDemoUrl ? { ...DATA[raw] } : generateFallbackData(raw);
      fb.cal = generateCalendar(fb);
      currentData = fb;
      resetCaches();
      populateResult(currentData);
      return;
    }

    const aiData = await res.json();
    aiData.cal = generateCalendar(aiData);
    currentData = aiData;
    resetCaches();
    if (aiData._fetchSuccess === false) showToast('ℹ️ Site blocked crawling — used domain-based analysis');
    populateResult(aiData);

  } catch (e) {
    clearInterval(stepIv);
    loader.classList.remove('on');
    const fb = isDemoUrl ? { ...DATA[raw] } : generateFallbackData(raw);
    fb.cal = generateCalendar(fb);
    currentData = fb;
    resetCaches();
    populateResult(currentData);
    showToast('⚠️ Connection error — showing smart template');
  }
}

function resetCaches() {
  Object.keys(regenCache).forEach(k => regenCache[k] = []);
  Object.keys(calPostCache).forEach(k => delete calPostCache[k]);
}

function showUpgradePrompt(url) {
  const result = document.getElementById('result');
  result.innerHTML = `
  <div class="upgrade-prompt">
    <div class="upgrade-icon">🔒</div>
    <h3 class="upgrade-title">Unlock Real URL Analysis</h3>
    <p class="upgrade-desc">To analyze <strong>${url}</strong>, you need a LaunchPe plan. LaunchPe fetches your actual website and generates content specific to what you built.</p>
    <div class="upgrade-features">
      <div class="upgrade-feature"><span class="fc">✓</span> AI reads your real website</div>
      <div class="upgrade-feature"><span class="fc">✓</span> 10–20+ best-match communities</div>
      <div class="upgrade-feature"><span class="fc">✓</span> 15 ready-to-post content pieces</div>
      <div class="upgrade-feature"><span class="fc">✓</span> 30-day launch calendar with AI posts</div>
      <div class="upgrade-feature"><span class="fc">✓</span> 15 regenerations per platform (Basic)</div>
    </div>
    <div class="upgrade-btns">
      <a href="#pricing" class="btn-solid" onclick="document.getElementById('result').innerHTML=''">Get a Plan — ₹899 →</a>
      <button class="btn-outline btn-sm" onclick="document.getElementById('urlInput').value='noticeboard.app';runDemo();">Try demo instead</button>
    </div>
  </div>`;
  result.classList.add('on');
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ═══════════════════════════════════════
   CALENDAR DEFINITIONS
   Priority: LinkedIn > Twitter > Reddit > WhatsApp > ProductHunt (×2)
   30 days total
═══════════════════════════════════════ */
const CAL_TEMPLATES = {
  LinkedIn: [
    { type: 'Founder Story',     desc: 'Share why you built this — your personal origin story' },
    { type: 'Problem Post',      desc: 'Describe the exact pain point your product solves' },
    { type: 'Data Insight',      desc: 'Share a surprising stat about your market or niche' },
    { type: 'Case Study',        desc: 'Walk through a real user result step by step' },
    { type: 'Hot Take',          desc: 'Post a bold opinion about your industry that sparks debate' },
    { type: 'Milestone Post',    desc: 'Celebrate a launch win — first users, revenue, feedback' },
    { type: 'Behind the Build',  desc: 'Behind-the-scenes of how you built this product' },
    { type: 'Lessons Learned',   desc: '3 things you learned since launching this product' },
    { type: 'Win of the Week',   desc: 'One result that proves people genuinely need this' },
  ],
  Twitter: [
    { type: 'Problem Thread',    desc: 'Tweet thread — the exact problem you solve and who has it' },
    { type: 'How It Works',      desc: 'Tweet thread — walk through your product step by step' },
    { type: 'Hot Take',          desc: 'One bold, contrarian tweet about your niche' },
    { type: 'Stats Thread',      desc: 'Tweet thread with surprising numbers from your market' },
    { type: 'Tips Thread',       desc: '5 actionable tips related to the problem you solve' },
    { type: 'Viral Hook',        desc: 'A single punchy tweet engineered to get retweets' },
    { type: 'Social Proof',      desc: 'Share an early user win or testimonial as a tweet' },
    { type: 'Contrarian Take',   desc: 'Challenge a widely-held belief in your space' },
  ],
  Reddit: [
    { type: 'I Built This',      desc: 'Authentic "I built this" post — story-first, no marketing' },
    { type: 'Ask Community',     desc: 'Ask what tools people currently use for this problem' },
    { type: 'Lesson Learned',    desc: 'Share a hard, honest lesson from building — add real value' },
    { type: 'Data Post',         desc: 'Share a finding or dataset your audience would find useful' },
    { type: 'Progress Update',   desc: 'Transparent weekly/monthly update on traction and learning' },
    { type: 'Tool Comparison',   desc: 'Honest, fair comparison of your tool vs existing alternatives' },
  ],
  WhatsApp: [
    { type: 'Casual Drop',       desc: 'Recommend it naturally in groups you are already active in' },
    { type: 'Results Share',     desc: '"A friend used this and…" — share a result as if recommending' },
    { type: 'Quick Update',      desc: 'Short update in relevant communities — 2 sentences max' },
    { type: 'Value Tip',         desc: 'Share a useful tip, mention the product as the solution' },
  ],
  ProductHunt: [
    { type: 'PH Launch Day',     desc: 'Go live on Product Hunt — post at 12:01 AM PST for top placement' },
    { type: 'PH Pre-Launch',     desc: 'Alert your network — share PH upcoming page for followers/notify' },
  ],
};

// 30-day schedule: LinkedIn highest, then Twitter, Reddit, WhatsApp, PH on day 25 + 30
const CAL_SCHEDULE = [
  { n: 1,  posts: [{ p: 'LinkedIn', t: 0 }, { p: 'Reddit',   t: 0 }, { p: 'WhatsApp', t: 0 }] },
  { n: 2,  posts: [{ p: 'Twitter',  t: 0 }, { p: 'LinkedIn', t: 1 }] },
  { n: 3,  posts: [{ p: 'LinkedIn', t: 2 }, { p: 'Reddit',   t: 1 }] },
  { n: 4,  posts: [{ p: 'Twitter',  t: 1 }, { p: 'WhatsApp', t: 1 }] },
  { n: 5,  posts: [{ p: 'LinkedIn', t: 3 }, { p: 'Twitter',  t: 2 }] },
  { n: 6,  posts: [{ p: 'Reddit',   t: 2 }, { p: 'WhatsApp', t: 2 }] },
  { n: 7,  posts: [{ p: 'LinkedIn', t: 4 }, { p: 'Twitter',  t: 3 }] },
  { n: 8,  posts: [{ p: 'LinkedIn', t: 5 }, { p: 'Reddit',   t: 3 }] },
  { n: 9,  posts: [{ p: 'Twitter',  t: 4 }, { p: 'WhatsApp', t: 3 }] },
  { n: 10, posts: [{ p: 'LinkedIn', t: 6 }, { p: 'Twitter',  t: 5 }] },
  { n: 11, posts: [{ p: 'Reddit',   t: 4 }, { p: 'LinkedIn', t: 7 }] },
  { n: 12, posts: [{ p: 'Twitter',  t: 6 }, { p: 'WhatsApp', t: 0 }] },
  { n: 13, posts: [{ p: 'LinkedIn', t: 8 }, { p: 'Reddit',   t: 5 }] },
  { n: 14, posts: [{ p: 'Twitter',  t: 7 }, { p: 'LinkedIn', t: 0 }] },
  { n: 15, posts: [{ p: 'LinkedIn', t: 1 }, { p: 'Twitter',  t: 0 }] },
  { n: 16, posts: [{ p: 'Reddit',   t: 0 }, { p: 'WhatsApp', t: 1 }] },
  { n: 17, posts: [{ p: 'LinkedIn', t: 2 }, { p: 'Twitter',  t: 1 }] },
  { n: 18, posts: [{ p: 'Twitter',  t: 2 }, { p: 'Reddit',   t: 1 }] },
  { n: 19, posts: [{ p: 'LinkedIn', t: 3 }, { p: 'WhatsApp', t: 2 }] },
  { n: 20, posts: [{ p: 'Twitter',  t: 3 }, { p: 'LinkedIn', t: 4 }] },
  { n: 21, posts: [{ p: 'LinkedIn', t: 5 }, { p: 'Reddit',   t: 2 }] },
  { n: 22, posts: [{ p: 'Twitter',  t: 4 }, { p: 'WhatsApp', t: 3 }] },
  { n: 23, posts: [{ p: 'LinkedIn', t: 6 }, { p: 'Twitter',  t: 5 }] },
  { n: 24, posts: [{ p: 'Reddit',   t: 3 }, { p: 'LinkedIn', t: 7 }] },
  { n: 25, posts: [{ p: 'ProductHunt', t: 1 }, { p: 'LinkedIn', t: 8 }, { p: 'Twitter', t: 6 }] },
  { n: 26, posts: [{ p: 'Twitter',  t: 7 }, { p: 'Reddit',   t: 4 }] },
  { n: 27, posts: [{ p: 'LinkedIn', t: 0 }, { p: 'WhatsApp', t: 0 }] },
  { n: 28, posts: [{ p: 'Twitter',  t: 0 }, { p: 'LinkedIn', t: 1 }] },
  { n: 29, posts: [{ p: 'Reddit',   t: 5 }, { p: 'LinkedIn', t: 2 }] },
  { n: 30, posts: [{ p: 'ProductHunt', t: 0 }, { p: 'LinkedIn', t: 3 }, { p: 'Twitter', t: 1 }, { p: 'WhatsApp', t: 1 }] },
];

const P_COLORS = { LinkedIn: '#0A66C2', Twitter: '#0F1419', Reddit: '#FF4500', WhatsApp: '#25D366', ProductHunt: '#DA552F' };

function generateCalendar(data) {
  const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const rSubs  = data.rComms?.map(r => r[0]) || ['r/india', 'r/indianstartups'];
  return CAL_SCHEDULE.map((s, idx) => {
    const posts = s.posts.map(({ p, t }) => {
      const tmpls = CAL_TEMPLATES[p] || CAL_TEMPLATES.LinkedIn;
      const tmpl  = tmpls[t % tmpls.length];
      let sub = 'Feed post';
      if (p === 'Reddit')       sub = rSubs[Math.floor(Math.random() * rSubs.length)];
      else if (p === 'WhatsApp') sub = `${Math.floor(Math.random() * 4) + 3} groups`;
      else if (p === 'ProductHunt') sub = 'producthunt.com';
      return { platform: p, sub, type: tmpl.type, desc: tmpl.desc, color: P_COLORS[p] || '#666' };
    });
    return {
      n:     s.n,
      d:     s.n === 1 ? 'Today' : days[(s.n - 1) % 7],
      label: days[(s.n - 1) % 7],
      today: s.n === 1,
      dots:  posts.map(p => p.color),
      posts,
      calIdx: idx,
    };
  });
}

/* ── Fallback for unknown URLs ── */
function generateFallbackData(url) {
  const name = url.replace(/\.(com|in|io|app|co|ai|dev|org|net)$/i, '')
    .replace(/[.-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    ico: '🚀', name, url,
    desc: `${name} — built specifically for the Indian market.`,
    tags: ['Startup', 'India', 'Product'],
    count: '10 communities · 4 platforms', rMeta: '5 subreddits · 3 angles',
    rComms: [['r/india', '800K', '90%'], ['r/indianstartups', '120K', '95%'], ['r/startups', '1.2M', '85%']],
    rPost: {
      title: `I built ${name} — solving a real problem for Indian founders`,
      body:  `Been building ${name} and it's finally ready.\n\nBuilt for India — right payments, right audience, right scale. Would love your feedback!`,
      sub: 'r/indianstartups', upvotes: '200+'
    },
    liPost: {
      body:  `Just shipped ${name}.\n\nNo VC. No big team. Clear problem, solid solution.\n\nBuilt for India. Priced for India.\n\n${url}`,
      name: 'You', role: `Founder at ${name}`, likes: 400, comments: 65, reposts: 38
    },
    twPost: {
      thread: [`Just launched ${name} 🚀`, `Built for Indian founders. Not US tools with Indian pricing.`, `${name} is live: ${url}`, `Building for India? Give it a try. RT 🇮🇳`],
      handle: '@yourhandle'
    },
    waPost: {
      en: `Hey, check out ${name} — ${url}. Built for India.`,
      hi: `Yaar ${name} dekh — ${url}. India ke liye banaya hai.`
    },
    waComms: [
      ['Indian Startup Founders', '93%'], ['SaaS Founders India', '89%'],
      ['Indie Hackers India', '87%'],     ['Dev Community India', '85%'],
      ['Startup India Telegram', '83%'],  ['IIT Alumni Network', '81%'],
      ['VC & Angel India', '79%'],        ['Freelancers India', '77%'],
      ['Product Hunt India Telegram', '75%'], ['CA & Tax Professionals', '73%']
    ],
    score: 70, sTitle: 'Good Viral Potential',
    sDesc: `${name} addresses an India-specific need. Reddit and LinkedIn will give the best early traction.`
  };
}

/* ═══════════════════════════════════════
   POPULATE RESULTS
═══════════════════════════════════════ */
async function populateResult(d) {
  const planInfo = await getUserPlan();
  document.getElementById('pIco').textContent  = d.ico;
  document.getElementById('pName').textContent = d.name;
  document.getElementById('pDesc').textContent = d.desc;
  document.getElementById('pTags').innerHTML   = d.tags.map(t => `<span class="ptag">${t}</span>`).join('');

  const cc = isPremium(planInfo) ? '20+ communities · 5 platforms'
           : hasActivePlan(planInfo) ? '10 communities · 4 platforms'
           : d.count;
  document.getElementById('comCount').textContent = cc;
  document.getElementById('rMeta').textContent    = d.rMeta;

  document.getElementById('rComms').innerHTML = d.rComms.slice(0, 3).map(([n, s, p]) => {
    const link = REDDIT_LINKS[n] || `https://www.reddit.com/r/${n.replace('r/', '')}/`;
    return `<div class="c-row c-row-link" onclick="window.open('${link}','_blank')">
      <span class="cn">${n}</span><span class="cs">${s}</span><span class="cp">${p}</span><span class="c-arrow">↗</span>
    </div>`;
  }).join('');

  document.getElementById('redditCard').innerHTML   = renderRedditCard(d.rPost);
  document.getElementById('linkedinCard').innerHTML = renderLinkedInCard(d.liPost);
  document.getElementById('twitterCard').innerHTML  = renderTwitterThread(d.twPost);

  // WhatsApp/Telegram communities with real links
  const waLimit = isPremium(planInfo) ? d.waComms.length : 10;
  document.getElementById('waComms').innerHTML = d.waComms.slice(0, waLimit).map(([n, p]) => {
    const link = getCommunityLink(n);
    return `<div class="c-row c-row-link" onclick="window.open('${link}','_blank')" title="Join ${n}">
      <span class="cn" style="font-family:var(--ff)">${n}</span><span class="cp">${p}</span><span class="c-arrow">↗</span>
    </div>`;
  }).join('');

  document.getElementById('whatsappCard').innerHTML = renderWhatsAppCard(d.waPost);
  updateHinglishToggle();

  renderCalendar(d.cal);

  document.getElementById('vNum').textContent   = d.score;
  document.getElementById('vTitle').textContent = d.sTitle;
  document.getElementById('vDesc').textContent  = d.sDesc;
  document.getElementById('scoreArc').setAttribute('stroke-dashoffset', 163 - (d.score / 100) * 163);

  renderPremiumFeatures(d, planInfo);
  document.getElementById('result').classList.add('on');
  setTimeout(() => document.getElementById('result').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

/* ═══════════════════════════════════════
   PLATFORM CARDS
═══════════════════════════════════════ */
function renderRedditCard(r) {
  return `<div class="reddit-preview">
    <div class="reddit-votes">
      <button class="reddit-arrow reddit-up">▲</button>
      <span class="reddit-score">${r.upvotes}</span>
      <button class="reddit-arrow">▼</button>
    </div>
    <div class="reddit-content">
      <div class="reddit-sub-line">
        <span class="reddit-sub-icon" style="background:#FF4500">r/</span>
        <span class="reddit-sub-name">${r.sub}</span>
        <span class="reddit-dot">·</span>
        <span class="reddit-meta">u/you · just now</span>
      </div>
      <div class="reddit-title" contenteditable="true" data-post-id="reddit-title">${r.title}</div>
      <div class="reddit-body"  contenteditable="true" data-post-id="reddit-body">${r.body.replace(/\n/g, '<br>')}</div>
      <div class="reddit-actions">
        <span class="reddit-action">💬 Comment</span>
        <span class="reddit-action">↗ Share</span>
        <span class="reddit-action">⭐ Save</span>
      </div>
    </div>
    <div class="post-toolbar">
      <button class="tool-btn copy-btn"  onclick="copyPostText('reddit-body')">📋 Copy</button>
      <button class="tool-btn regen-btn" onclick="regeneratePost('reddit')" id="regen-reddit">↻ Regenerate</button>
      <button class="tool-btn post-btn"  onclick="postToPlatform('Reddit','reddit-body')">📤 Post →</button>
    </div>
    <div class="regen-counter" id="rcounter-reddit"></div>
    ${angleBox('reddit')}
  </div>`;
}

function renderLinkedInCard(li) {
  return `<div class="li-preview">
    <div class="li-header">
      <div class="li-avatar">${li.name.charAt(0)}</div>
      <div class="li-author">
        <div class="li-author-name">${li.name} <span class="li-1st">· 1st</span></div>
        <div class="li-author-role">${li.role}</div>
        <div class="li-author-time">Just now · 🌐</div>
      </div>
      <span class="li-follow">+ Follow</span>
    </div>
    <div class="li-body" contenteditable="true" data-post-id="linkedin-body">${li.body.replace(/\n/g, '<br>')}</div>
    <div class="li-engagement">
      <div class="li-reactions"><span class="li-reaction-icons">👍❤️🎉</span><span class="li-reaction-count">${li.likes.toLocaleString()}</span></div>
      <div class="li-comment-count">${li.comments} comments · ${li.reposts} reposts</div>
    </div>
    <div class="li-action-bar">
      <button class="li-action">👍 Like</button>
      <button class="li-action">💬 Comment</button>
      <button class="li-action">↗ Repost</button>
      <button class="li-action">📨 Send</button>
    </div>
    <div class="post-toolbar">
      <button class="tool-btn copy-btn"  onclick="copyPostText('linkedin-body')">📋 Copy</button>
      <button class="tool-btn regen-btn" onclick="regeneratePost('linkedin')" id="regen-linkedin">↻ Regenerate</button>
      <button class="tool-btn post-btn"  onclick="postToPlatform('LinkedIn','linkedin-body')">📤 Post →</button>
    </div>
    <div class="regen-counter" id="rcounter-linkedin"></div>
    ${angleBox('linkedin')}
  </div>`;
}

function renderTwitterThread(tw) {
  const tweets = tw.thread.map((text, i) => `
  <div class="tw-tweet ${i < tw.thread.length - 1 ? 'tw-has-thread' : ''}">
    ${i > 0 ? '<div class="tw-thread-line-top"></div>' : ''}
    ${i < tw.thread.length - 1 ? '<div class="tw-thread-line-bottom"></div>' : ''}
    <div class="tw-avatar">Y</div>
    <div class="tw-tweet-content">
      <div class="tw-tweet-header">
        <span class="tw-name">You</span><span class="tw-handle">${tw.handle}</span>
        <span class="tw-dot">·</span><span class="tw-time">now</span>
        ${i === 0 ? '<span class="tw-thread-label">Thread</span>' : ''}
      </div>
      <div class="tw-tweet-body" contenteditable="true" data-post-id="twitter-${i}">${text.replace(/\n/g, '<br>')}</div>
      <div class="tw-tweet-actions">
        <span class="tw-act">💬 ${Math.floor(Math.random() * 40 + 5)}</span>
        <span class="tw-act">🔁 ${Math.floor(Math.random() * 80 + 20)}</span>
        <span class="tw-act">❤️ ${Math.floor(Math.random() * 300 + 50)}</span>
        <span class="tw-act">📊 ${(Math.random() * 40 + 10).toFixed(1)}K</span>
      </div>
    </div>
  </div>`).join('');
  return `<div class="tw-preview">
    ${tweets}
    <div class="post-toolbar">
      <button class="tool-btn copy-btn"  onclick="copyPostText('twitter-0')">📋 Copy</button>
      <button class="tool-btn regen-btn" onclick="regeneratePost('twitter')" id="regen-twitter">↻ Regenerate</button>
      <button class="tool-btn post-btn"  onclick="postToPlatform('Twitter','twitter-0')">📤 Post →</button>
    </div>
    <div class="regen-counter" id="rcounter-twitter"></div>
    ${angleBox('twitter')}
  </div>`;
}

function renderWhatsAppCard(wa) {
  const text = hinglishMode ? wa.hi : wa.en;
  return `<div class="wa-preview">
    <div class="wa-bubble">
      <div class="wa-text" contenteditable="true" data-post-id="whatsapp-body">${text}</div>
      <div class="wa-time">Just now ✓✓</div>
    </div>
    <div class="post-toolbar">
      <button class="tool-btn copy-btn"  onclick="copyPostText('whatsapp-body')">📋 Copy</button>
      <button class="tool-btn regen-btn" onclick="regeneratePost('whatsapp')" id="regen-whatsapp">↻ Regenerate</button>
      <button class="tool-btn post-btn"  onclick="postToPlatform('WhatsApp','whatsapp-body')">📤 Share →</button>
    </div>
    <div class="regen-counter" id="rcounter-whatsapp"></div>
    ${angleBox('whatsapp')}
  </div>`;
}

/* ── Angle box — unique IDs so they never clash ── */
function angleBox(platform) {
  return `<div class="angle-wrap">
    <button class="angle-toggle" onclick="toggleAngle('ab_${platform}')">✏️ Describe what you want → AI writes it</button>
    <div class="angle-box" id="ab_${platform}" style="display:none">
      <textarea class="angle-input" id="abt_${platform}"
        placeholder="E.g. 'Focus on pricing value', 'Write from a user perspective who saved time', 'Make it funny and casual', 'Target freelancers only', 'Emphasise the India angle'…"
        rows="2"></textarea>
      <button class="tool-btn angle-submit" onclick="regenWithAngle('${platform}')">✨ Generate this angle</button>
    </div>
  </div>`;
}

function toggleAngle(uid) {
  const box = document.getElementById(uid);
  if (!box) return;
  const open = box.style.display !== 'none';
  box.style.display = open ? 'none' : 'block';
  if (!open) setTimeout(() => box.querySelector('textarea')?.focus(), 80);
}

/* ── Regen counter ── */
function updateRegenCounter(platform, planInfo) {
  const el = document.getElementById(`rcounter-${platform}`);
  if (!el) return;
  if (isPremium(planInfo) || !hasActivePlan(planInfo)) { el.innerHTML = ''; return; }
  const left = BASIC_REGEN_LIMIT - regenCache[platform].length;
  el.innerHTML = left > 0
    ? `<span class="regen-count-badge">${left} regeneration${left === 1 ? '' : 's'} left</span>`
    : `<span class="regen-count-badge regen-limit">15/15 used — <a href="#pricing" style="color:var(--moss)">Upgrade for unlimited →</a></span>`;
}

/* ═══════════════════════════════════════
   REGENERATE — main platform cards
   Basic: 15/platform (rotate cache after limit)
   Premium: unlimited new
═══════════════════════════════════════ */
async function regeneratePost(platform, customDescription = '') {
  const planInfo = await getUserPlan();
  if (!hasActivePlan(planInfo)) { showUpgradeModal(); return; }
  if (!currentData) { showToast('Please run an analysis first'); return; }

  const idMap = { reddit: 'reddit-body', linkedin: 'linkedin-body', twitter: 'twitter-0', whatsapp: 'whatsapp-body' };
  const el    = document.querySelector(`[data-post-id="${idMap[platform]}"]`);

  // Basic: rotate cache after limit
  if (!isPremium(planInfo) && regenCache[platform].length >= BASIC_REGEN_LIMIT) {
    const rotIdx = regenCache[platform].length % BASIC_REGEN_LIMIT;
    const cached = regenCache[platform][rotIdx];
    if (cached && el) {
      el.style.opacity = '0.4';
      setTimeout(() => {
        if (platform === 'twitter' && Array.isArray(cached)) {
          cached.forEach((t, i) => {
            const tEl = document.querySelector(`[data-post-id="twitter-${i}"]`);
            if (tEl) tEl.innerHTML = t.replace(/\n/g, '<br>');
          });
        } else {
          el.innerHTML = (typeof cached === 'string' ? cached : '').replace(/\n/g, '<br>');
        }
        el.style.opacity = '';
        updateRegenCounter(platform, planInfo);
        showToast(`↻ Variation ${rotIdx + 1} of ${BASIC_REGEN_LIMIT}`);
      }, 300);
    }
    return;
  }

  if (el) { el.style.opacity = '0.35'; el.style.pointerEvents = 'none'; }
  showToast('↻ Writing new content…');

  try {
    const res = await fetch(`${API_BASE}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform,
        productName: currentData.name,
        productUrl:  currentData.url,
        productDesc: currentData.desc,
        customDescription
      })
    });

    if (!res.ok) {
      showToast(res.status === 429 ? '⏳ AI busy — wait a moment' : '⚠️ Regeneration failed — try again');
      return;
    }

    const data = await res.json();

    if (platform === 'twitter' && data.tweets?.length) {
      data.tweets.forEach((tweet, i) => {
        const tEl = document.querySelector(`[data-post-id="twitter-${i}"]`);
        if (tEl) tEl.innerHTML = tweet.replace(/\n/g, '<br>');
      });
      if (!isPremium(planInfo)) regenCache[platform].push(data.tweets);
    } else if (data.content) {
      if (el) el.innerHTML = data.content.replace(/\n/g, '<br>');
      if (!isPremium(planInfo)) regenCache[platform].push(data.content);
    }

    updateRegenCounter(platform, planInfo);
    showToast('✅ Fresh content generated!');
  } catch (e) {
    console.error('Regen error:', e);
    showToast('⚠️ Connection error — check your internet');
  } finally {
    if (el) { el.style.opacity = ''; el.style.pointerEvents = ''; }
  }
}

async function regenWithAngle(platform) {
  const txtEl = document.getElementById(`abt_${platform}`);
  const desc  = txtEl?.value?.trim() || '';
  if (!desc) { showToast('Describe the angle you want first'); return; }
  // Close the box
  const box = document.getElementById(`ab_${platform}`);
  if (box) box.style.display = 'none';
  await regeneratePost(platform, desc);
}

/* ═══════════════════════════════════════
   POST TO PLATFORM
═══════════════════════════════════════ */
function postToPlatform(platform, postId) {
  requireAuth(async (user) => {
    const p = await getUserPlan();
    if (!hasActivePlan(p)) { showUpgradeModal(); return; }
    const el      = document.querySelector(`[data-post-id="${postId}"]`);
    const content = el ? (el.innerText || el.textContent) : '';
    let url = '';
    switch (platform) {
      case 'Reddit':
        const sub = (currentData?.rPost?.sub || 'r/indianstartups').replace('r/', '');
        url = `https://www.reddit.com/r/${sub}/submit?type=TEXT&title=${encodeURIComponent(currentData?.rPost?.title || '')}&text=${encodeURIComponent(content)}`;
        break;
      case 'LinkedIn':
        navigator.clipboard?.writeText(content);
        url = `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`;
        showToast('📋 Copied — paste with Ctrl+V if needed');
        break;
      case 'Twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.substring(0, 280))}`;
        break;
      case 'WhatsApp':
        url = `https://web.whatsapp.com/send?text=${encodeURIComponent(content)}`;
        break;
    }
    if (url) {
      window.open(url, '_blank');
      setTimeout(() => {
        if (confirm(`Did you post on ${platform}?`))
          saveUserPost(platform, content, currentData?.rPost?.sub || '');
      }, 3000);
    }
  });
}

/* ═══════════════════════════════════════
   PREMIUM FEATURES (PH Kit + Reply Suggestions)
═══════════════════════════════════════ */
function renderPremiumFeatures(d, planInfo) {
  document.querySelectorAll('.premium-section').forEach(el => el.remove());
  const result = document.getElementById('result');
  const cta    = result.querySelector('.demo-cta');
  const ins    = el => { if (cta) result.insertBefore(el, cta); else result.appendChild(el); };

  setTimeout(() => {
    ['reddit', 'linkedin', 'twitter', 'whatsapp'].forEach(p => updateRegenCounter(p, planInfo));
  }, 100);

  if (isPremium(planInfo)) {
    const ph = document.createElement('div');
    ph.className = 'premium-section ph-kit-section';
    ph.innerHTML = `
    <div class="d-sec"><div class="d-sec-l">🚀 Product Hunt Launch Kit</div><div class="d-sec-r" style="color:var(--moss)">Premium</div></div>
    <div class="ph-kit">
      <div class="ph-kit-card">
        <div class="ph-kit-label">Tagline</div>
        <div class="ph-kit-content" contenteditable="true">${d.name} — ${d.desc.split('.')[0]}</div>
        <button class="tool-btn copy-btn" onclick="copyText(this.previousElementSibling)">📋</button>
      </div>
      <div class="ph-kit-card">
        <div class="ph-kit-label">PH Description</div>
        <div class="ph-kit-content" contenteditable="true">Launching ${d.name} today! ${d.desc} Built for India. We'd love your support!</div>
        <button class="tool-btn copy-btn" onclick="copyText(this.previousElementSibling)">📋</button>
      </div>
      <div class="ph-kit-card">
        <div class="ph-kit-label">Maker's First Comment</div>
        <div class="ph-kit-content" contenteditable="true">Hey Product Hunt! 👋 I'm the maker of ${d.name}. ${d.sDesc} Happy to answer anything!</div>
        <button class="tool-btn copy-btn" onclick="copyText(this.previousElementSibling)">📋</button>
      </div>
      <a href="https://www.producthunt.com/posts/new" target="_blank" class="btn-solid btn-sm" style="margin-top:12px">🚀 Launch on Product Hunt →</a>
    </div>`;
    ins(ph);

    const rep = document.createElement('div');
    rep.className = 'premium-section reply-section';
    rep.innerHTML = `
    <div class="d-sec"><div class="d-sec-l">💬 Reply Suggestions</div><div class="d-sec-r" style="color:var(--moss)">Premium</div></div>
    <p style="font-size:13px;color:var(--ink3);margin-bottom:12px">Ready-to-paste replies when someone asks about a problem your product solves.</p>
    <div class="reply-cards">
      <div class="reply-card">
        <div class="reply-q">"Anyone know a good tool for ${d.tags[0]?.toLowerCase() || 'this'}?"</div>
        <div class="reply-a" contenteditable="true">Hey! I built exactly this — ${d.name} (${d.url}). ${d.desc.split('.')[0]}. Happy to help!</div>
        <button class="tool-btn copy-btn" onclick="copyText(this.previousElementSibling)">📋 Copy</button>
      </div>
      <div class="reply-card">
        <div class="reply-q">"Looking for something like ${d.tags[1]?.toLowerCase() || 'this'}"</div>
        <div class="reply-a" contenteditable="true">Check out ${d.name} — ${d.desc.split('.')[0]}. Built for India. Free at ${d.url}</div>
        <button class="tool-btn copy-btn" onclick="copyText(this.previousElementSibling)">📋 Copy</button>
      </div>
    </div>`;
    ins(rep);
  }

  if (!isPremium(planInfo)) {
    const banner = document.createElement('div');
    banner.className = 'premium-section upgrade-banner-inline';
    const hasBasic = hasActivePlan(planInfo);
    banner.innerHTML = `<div class="upgrade-banner-content">
      <div style="font-size:20px">⚡</div>
      <div>
        <strong>${hasBasic ? 'Upgrade to Premium' : 'Get a plan'}</strong>
        <div style="font-size:12px;color:var(--ink3);margin-top:2px">
          ${hasBasic ? 'Unlock unlimited regeneration, 20+ communities, Product Hunt kit.'
                     : 'Get AI analysis, 10 communities, 15 content pieces, 30-day calendar.'}
        </div>
      </div>
      <a href="#pricing" class="btn-solid btn-sm">${hasBasic ? 'Upgrade — ₹2,499/mo' : 'Get Started — ₹899'}</a>
    </div>`;
    ins(banner);
  }
}

/* ═══════════════════════════════════════
   CALENDAR RENDER
   Each day's post shows:
   • platform dot + name
   • 1-line description of what to post
   • "Generate Post" AI button + ↻ regen
   • "📤 Post Now" button
═══════════════════════════════════════ */
function renderCalendar(cal) {
  const grid = document.getElementById('calGrid');
  if (!grid) return;
  grid.innerHTML = cal.map((day, idx) => `
  <div class="cal-c ${day.today ? 'today' : ''} ${idx === 0 ? 'cal-selected' : ''}"
       onclick="selectCalDay(${idx})" data-cal-idx="${idx}">
    <div class="cn2">${day.n}</div>
    <div class="cd">${day.d}</div>
    <div class="cdots">${day.dots.map(c => `<div class="cdot" style="background:${c}"></div>`).join('')}</div>
  </div>`).join('');
  renderCalDetail(cal[0]);
}

function selectCalDay(idx) {
  if (!currentData?.cal) return;
  document.querySelectorAll('.cal-c').forEach(el => el.classList.remove('cal-selected'));
  document.querySelector(`[data-cal-idx="${idx}"]`)?.classList.add('cal-selected');
  renderCalDetail(currentData.cal[idx]);
}

function renderCalDetail(day) {
  const detail = document.getElementById('calDetail');
  if (!detail) return;
  if (!day.posts?.length) {
    detail.innerHTML = `<div class="cal-detail-empty">No posts scheduled for Day ${day.n}.</div>`;
    return;
  }
  const dayIdx = day.calIdx ?? 0;
  detail.innerHTML = `
  <div class="cal-detail-header">
    <div class="cal-detail-day">Day ${day.n} — ${day.label}</div>
    <div class="cal-detail-label">${day.posts.length} post${day.posts.length > 1 ? 's' : ''} to publish</div>
  </div>
  <div class="cal-detail-posts">
    ${day.posts.map((p, pi) => `
    <div class="cal-post-item" id="calitem_${dayIdx}_${pi}">
      <div class="cal-post-left">
        <div class="cal-post-dot" style="background:${p.color}"></div>
        <div class="cal-post-info">
          <div class="cal-post-platform">${p.platform}
            ${p.platform === 'ProductHunt' ? `<a href="https://www.producthunt.com/posts/new" target="_blank" class="cal-ph-link">↗ Launch</a>` : ''}
          </div>
          <div class="cal-post-type">${p.type}</div>
          <div class="cal-post-desc">${p.desc}</div>
        </div>
      </div>
      <div class="cal-post-actions">
        <div class="cal-post-time">${getPostTime(p.platform)}</div>
        <div class="cal-post-btns">
          <button class="cal-gen-btn" onclick="generateCalPost(${dayIdx},${pi})" id="calgen_${dayIdx}_${pi}">✨ Generate</button>
          <button class="cal-post-btn" onclick="calPostNow('${p.platform}','${p.sub}',${dayIdx},${pi})">📤 Post</button>
        </div>
      </div>
    </div>
    <div class="cal-generated-post" id="calgpost_${dayIdx}_${pi}" style="display:none">
      <div class="cal-generated-text" id="calgtxt_${dayIdx}_${pi}" contenteditable="true"></div>
      <div class="cal-gen-toolbar">
        <button class="tool-btn copy-btn" onclick="copyText(document.getElementById('calgtxt_${dayIdx}_${pi}'))">📋 Copy</button>
        <button class="tool-btn regen-btn" onclick="generateCalPost(${dayIdx},${pi})">↻ Regenerate</button>
        <button class="tool-btn post-btn"  onclick="calPostNow('${p.platform}','${p.sub}',${dayIdx},${pi})">📤 Post →</button>
      </div>
    </div>`).join('')}
  </div>`;

  // Restore cached posts
  day.posts.forEach((p, pi) => {
    const key  = `${dayIdx}_${pi}`;
    const cached = calPostCache[key];
    if (cached) {
      const txtEl   = document.getElementById(`calgtxt_${key}`);
      const postDiv = document.getElementById(`calgpost_${key}`);
      const genBtn  = document.getElementById(`calgen_${key}`);
      if (txtEl) txtEl.innerHTML = cached.replace(/\n/g, '<br>');
      if (postDiv) postDiv.style.display = 'block';
      if (genBtn)  genBtn.textContent = '↻ Regenerate';
    }
  });
}

/* ── Generate AI post for a calendar slot ── */
async function generateCalPost(dayIdx, postIdx) {
  const planInfo = await getUserPlan();
  if (!hasActivePlan(planInfo)) { showUpgradeModal(); return; }
  if (!currentData) return;

  const day  = currentData.cal[dayIdx];
  if (!day)  return;
  const post = day.posts[postIdx];
  if (!post) return;

  const key    = `${dayIdx}_${postIdx}`;
  const genBtn = document.getElementById(`calgen_${key}`);
  const postDiv= document.getElementById(`calgpost_${key}`);
  const txtEl  = document.getElementById(`calgtxt_${key}`);
  if (!txtEl) return;

  if (genBtn) { genBtn.textContent = '⏳ Generating…'; genBtn.disabled = true; }

  const customDesc = `Post type: ${post.type}. Goal: ${post.desc}. Platform: ${post.platform}. Keep it short and punchy.`;

  try {
    const res = await fetch(`${API_BASE}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform:          post.platform === 'ProductHunt' ? 'linkedin' : post.platform.toLowerCase(),
        productName:       currentData.name,
        productUrl:        currentData.url,
        productDesc:       currentData.desc,
        customDescription: customDesc
      })
    });

    if (!res.ok) {
      showToast(res.status === 429 ? '⏳ AI busy — wait a moment' : '⚠️ Generation failed');
      return;
    }

    const data    = await res.json();
    const content = data.content || (data.tweets ? data.tweets.join('\n\n') : '');
    if (!content) return;

    txtEl.innerHTML = content.replace(/\n/g, '<br>');
    calPostCache[key] = content;
    if (postDiv) postDiv.style.display = 'block';
    showToast('✅ Post generated!');
  } catch (e) {
    showToast('⚠️ Connection error');
  } finally {
    if (genBtn) { genBtn.textContent = '↻ Regenerate'; genBtn.disabled = false; }
  }
}

/* ── Post a calendar item to the platform ── */
function calPostNow(platform, sub, dayIdx, postIdx) {
  requireAuth(() => {
    const name    = currentData?.name || 'Product';
    const url     = currentData?.url  || '';
    const key     = `${dayIdx}_${postIdx}`;
    const cached  = calPostCache[key];
    const content = cached || `${name} — ${url}`;

    const urls = {
      Reddit:      `https://www.reddit.com/r/${(sub || 'india').replace('r/', '').replace(/ /g, '')}/submit?type=TEXT&title=${encodeURIComponent('Check out ' + name)}&text=${encodeURIComponent(content)}`,
      LinkedIn:    `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(content)}`,
      Twitter:     `https://twitter.com/intent/tweet?text=${encodeURIComponent(content.substring(0, 280))}`,
      WhatsApp:    `https://web.whatsapp.com/send?text=${encodeURIComponent(content)}`,
      ProductHunt: 'https://www.producthunt.com/posts/new',
    };

    if (platform === 'LinkedIn') {
      navigator.clipboard?.writeText(content);
      showToast('📋 Copied — paste with Ctrl+V');
    }

    const dest = urls[platform];
    if (dest) {
      window.open(dest, '_blank');
      showToast(`📤 Opening ${platform}…`);
      setTimeout(() => {
        if (confirm(`Did you post on ${platform}?`))
          saveUserPost(platform, content.substring(0, 500), sub);
      }, 3000);
    }
  });
}

function getPostTime(p) {
  return { LinkedIn: '9:00 AM', Twitter: '12:30 PM', Reddit: '10:00 AM', WhatsApp: '7:00 PM', ProductHunt: '12:01 AM PST' }[p] || '10:00 AM';
}

/* ═══════════════════════════════════════
   UTILITIES
═══════════════════════════════════════ */
function copyPostText(id) {
  const el = document.querySelector(`[data-post-id="${id}"]`);
  if (el) copyText(el);
}
function copyText(el) {
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text)
    .then(() => showToast('Copied! 📋'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('Copied! 📋');
    });
}

function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function showUpgradeModal() {
  document.getElementById('upgradeModal')?.remove();
  const m = document.createElement('div');
  m.id = 'upgradeModal'; m.className = 'auth-modal-overlay active';
  m.innerHTML = `<div class="auth-modal" style="text-align:center;padding:40px 32px">
    <button class="auth-close" onclick="this.closest('.auth-modal-overlay').remove()">✕</button>
    <div style="font-size:40px;margin-bottom:12px">🔒</div>
    <h3 class="auth-title">Get a Plan</h3>
    <p class="auth-subtitle" style="margin-bottom:20px">Unlock AI analysis and content generation.</p>
    <div style="text-align:left;margin:0 auto 20px;max-width:260px;font-size:13px;color:var(--ink2);line-height:2">
      ✓ AI reads your actual website<br>✓ 10–20+ communities<br>✓ 15 content pieces<br>✓ 30-day calendar with AI posts<br>✓ 15 regen/platform (Basic) or unlimited (Premium)
    </div>
    <a href="#pricing" class="btn-solid" onclick="this.closest('.auth-modal-overlay').remove()">See Plans — from ₹899 →</a>
  </div>`;
  document.body.appendChild(m);
}

function toggleHinglish() {
  hinglishMode = !hinglishMode;
  updateHinglishToggle();
  if (currentData) document.getElementById('whatsappCard').innerHTML = renderWhatsAppCard(currentData.waPost);
}
function updateHinglishToggle() {
  const t = document.getElementById('hinglishToggle');
  if (t) {
    t.classList.toggle('active', hinglishMode);
    const l = t.querySelector('.toggle-label');
    if (l) l.textContent = hinglishMode ? 'Hinglish' : 'English';
  }
}

async function saveUserPost(platform, content, sub) {
  if (typeof currentUser === 'undefined' || !currentUser) return;
  try {
    await db.collection('users').doc(currentUser.uid).collection('posts').add({
      platform, content: content.substring(0, 500), sub: sub || '',
      postedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast('📤 Tracked in dashboard!');
  } catch (e) { console.error(e); }
}

/* ── Inject CSS once ── */
(function () {
  if (document.getElementById('lp-v6-css')) return;
  const s = document.createElement('style'); s.id = 'lp-v6-css';
  s.textContent = `
  /* Angle box */
  .angle-wrap{margin-top:10px}
  .angle-toggle{width:100%;background:transparent;border:1.5px dashed var(--line2);border-radius:8px;padding:7px 14px;font-size:12px;color:var(--ink3);cursor:pointer;text-align:left;font-family:var(--ff);transition:.15s}
  .angle-toggle:hover{color:var(--moss);border-color:var(--moss-line);background:var(--moss-bg)}
  .angle-box{margin-top:8px}
  .angle-input{width:100%;padding:10px 14px;background:var(--page);border:1.5px solid var(--line2);border-radius:9px;font-family:var(--ff);font-size:13px;color:var(--ink);resize:vertical;outline:none;transition:border-color .15s;line-height:1.6;box-sizing:border-box}
  .angle-input:focus{border-color:var(--moss-line)}
  .angle-input::placeholder{color:var(--ink3);font-size:12px}
  .angle-submit{margin-top:8px;background:var(--moss-bg)!important;color:var(--moss)!important;border:1px solid var(--moss-line)!important;width:auto!important}
  .angle-submit:hover{background:var(--moss)!important;color:#fff!important}

  /* Regen counter */
  .regen-counter{min-height:16px;margin-top:6px}
  .regen-count-badge{font-size:11px;color:var(--ink3);font-family:var(--ff)}
  .regen-count-badge.regen-limit{color:var(--ink3)}

  /* Price badges */
  .discount-badge{background:#e53935;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;vertical-align:middle;margin-left:6px;letter-spacing:.5px}
  .price-orig{text-decoration:line-through;color:var(--ink3);font-size:16px;margin-left:8px;vertical-align:middle}

  /* Calendar enhanced */
  .cal-post-item{align-items:flex-start !important;gap:12px !important;flex-wrap:wrap}
  .cal-post-left{display:flex;gap:10px;align-items:flex-start;flex:1;min-width:0}
  .cal-post-desc{font-size:11.5px;color:var(--ink3);line-height:1.5;margin-top:3px;font-style:italic}
  .cal-post-type{font-size:12px;color:var(--ink2);font-weight:600;margin-top:1px}
  .cal-post-actions{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
  .cal-post-btns{display:flex;gap:6px}
  .cal-gen-btn{background:var(--moss-bg);color:var(--moss);border:1px solid var(--moss-line);border-radius:7px;padding:5px 10px;font-size:11px;cursor:pointer;font-family:var(--ff);transition:.15s;white-space:nowrap}
  .cal-gen-btn:hover{background:var(--moss);color:#fff}
  .cal-gen-btn:disabled{opacity:.5;cursor:not-allowed}
  .cal-generated-post{margin:0 0 12px 0;background:var(--page);border:1px solid var(--line2);border-radius:10px;padding:14px}
  .cal-generated-text{font-size:13px;color:var(--ink);line-height:1.7;outline:none;min-height:40px;word-break:break-word}
  .cal-gen-toolbar{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
  .cal-ph-link{font-size:11px;color:var(--moss);text-decoration:none;margin-left:6px;font-weight:600}
  .cal-ph-link:hover{text-decoration:underline}
  `;
  document.head.appendChild(s);
})();
