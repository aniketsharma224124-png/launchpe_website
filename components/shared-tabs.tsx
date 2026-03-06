"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Copy, RefreshCw, ArrowUp, ArrowDown, Loader2, Globe,
  Lock, X, ChevronDown, ChevronRight, ExternalLink, Zap,
  Calendar, Map, Mail, Rocket, Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script"; // Moved Script import to the top

// ─── Types ────────────────────────────────────────────────────────────────────
type Plan = "free" | "launch" | "founder";

interface Analysis {
  url: string;
  productName: string;
  productDescription: string;
  categories: string[];
  uniqueAngles: string[];
  launchReadiness?: {
    overallScore: number;
    landingPage: { score: number; reason: string };
    communityFit: { score: number; reason: string };
    contentStrategy: { score: number; reason: string };
    distribution: { score: number; reason: string };
  };
  communities: {
    reddit: {
      subreddits: { name: string; members: string; match: number }[];
      postAngles: number;
      preview: { subreddit: string; upvotes: string; title: string; body: string };
    };
    linkedin: {
      formats: number; bestTime: string;
      preview: { author: string; role: string; content: string; reactions: number; comments: number; reposts: number };
    };
    twitter: { threads: number; replyHooks: number; preview: string };
    whatsapp: { groupTypes: number; tone: string; preview: string; groups?: { name: string; platform: string; url: string; members: string }[] };
  };
  generatedPosts?: Record<string, Post[]>;
  generatedCalendar?: any;
  generatedCalendarDone?: string[];
  generatedDistribution?: any;
  generatedEmails?: any;
  generatedKit?: any;
  generatedImprovements?: any;
}

interface Post { id: string; content: string; hook?: string; community?: string }

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
function Copied({ text, small }: { text: string; small?: boolean }) {
  const [ok, set] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); set(true); toast.success("Copied!"); setTimeout(() => set(false), 1800); }}
      className={`flex items-center gap-1.5 border border-stone-200 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors ${small ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}>
      {ok ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
      {ok ? "Copied" : "Copy"}
    </button>
  );
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({ plan, onClose, onSuccess }: { plan: "launch" | "founder"; onClose: () => void; onSuccess: (p: Plan) => void }) {
  const info = {
    launch: {
      name: "Launch Plan", price: "$9", period: "one-time",
      feats: ["AI reads your actual website", "10 best-match communities", "15 ready-to-post content pieces", "20-day launch calendar", "Reddit · LinkedIn · Twitter · WhatsApp", "15 regenerations per platform", "Viral score + strategy report", "Custom angle generation"],
    },
    founder: {
      name: "Founder Plan", price: "$19", period: "/month",
      feats: ["Everything in Launch", "20+ communities per product", "30-day calendar — renewed monthly", "Unlimited content regeneration", "Custom angle generation", "Product Hunt launch kit", "Pre-written reply suggestions", "Priority support"],
    },
  }[plan]!;
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const handlePayment = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, userId: (session?.user as any)?.id || null }),
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error);

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "LaunchPe",
        description: info.name,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, plan, userId: (session?.user as any)?.id || null }),
          });
          const verifyData = await verifyRes.json();
          if (verifyRes.ok && verifyData.success) {
            onSuccess(plan);
          } else {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          email: session?.user?.email || "",
        },
        theme: { color: "#1c1917" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (resp: any) {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: .96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm z-10">
        <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-stone-400 hover:bg-stone-100">
          <X className="w-4 h-4" />
        </button>
        <p className="text-xs text-stone-400 mb-1">{info.name}</p>
        <div className="font-serif text-5xl text-stone-900">{info.price}</div>
        <p className="text-sm text-stone-400 mb-4">{info.period}</p>

        <button onClick={handlePayment} disabled={loading}
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-semibold py-3 rounded-xl transition-colors mb-5 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Pay with Razorpay"}
        </button>

        <hr className="border-stone-100 mb-4" />
        <ul className="space-y-2">
          {info.feats.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span className="text-stone-500">{f}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

// ─── Launch Scorecard ─────────────────────────────────────────────────────────
export function LaunchScorecard({ analysis }: { analysis: Analysis }) {
  const readiness = analysis.launchReadiness;
  if (!readiness) return null;

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 md:p-6 mb-6 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-serif text-xl font-bold flex items-center gap-2">📊 Launch Readiness Score</h3>
          <p className="text-stone-500 text-sm mt-1">AI-graded evaluation based on your landing page content</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-3xl font-bold text-stone-900 leading-none">{readiness.overallScore}<span className="text-lg text-stone-400">/100</span></div>
          <button onClick={() => {
            const text = `My product scored ${readiness.overallScore}/100 on LaunchPe's Launch Readiness test! 📊\n\n🏠 Landing Page: ${readiness.landingPage.score}/10\n👥 Community Fit: ${readiness.communityFit.score}/10\n📝 Content Strategy: ${readiness.contentStrategy.score}/10\n📡 Distribution: ${readiness.distribution.score}/10\n\nTest yours free → launchpe.in`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
          }} className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded mt-2 hover:bg-blue-100 transition-colors flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
            Share Score
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {[
          { key: "landingPage", label: "Landing Page", data: readiness.landingPage },
          { key: "communityFit", label: "Community Fit", data: readiness.communityFit },
          { key: "contentStrategy", label: "Content Strategy", data: readiness.contentStrategy },
          { key: "distribution", label: "Distribution", data: readiness.distribution },
        ].map(({ key, label, data }) => (
          <div key={key} className="bg-stone-50 rounded-xl p-4 border border-stone-100">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-stone-700 text-sm">{label}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${data.score >= 8 ? 'bg-green-100 text-green-700' : data.score >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {data.score}/10
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-stone-200 rounded-full h-1.5 mb-3">
              <div className={`h-1.5 rounded-full ${data.score >= 8 ? 'bg-green-500' : data.score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${data.score * 10}%` }}></div>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">{data.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reddit Preview ───────────────────────────────────────────────────────────
function RedditPreview({ sub, upvotes, title, body }: { sub: string; upvotes: string; title: string; body: string }) {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white text-sm">
      <div className="flex">
        <div className="flex flex-col items-center gap-1 px-3 py-4 bg-stone-50 shrink-0">
          <ArrowUp className="w-4 h-4 text-orange-500" />
          <span className="text-xs font-bold text-stone-700 leading-none">{upvotes}</span>
          <ArrowDown className="w-4 h-4 text-stone-300" />
        </div>
        <div className="p-4 flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">r/</span>
            <span className="font-medium text-stone-700">{sub}</span>
            <span className="text-xs text-stone-400">· u/you · just now</span>
          </div>
          <h4 className="font-bold text-stone-900 mb-2 leading-snug">{title}</h4>
          <p className="text-stone-600 leading-relaxed whitespace-pre-line">{body}</p>
          <div className="flex gap-4 mt-3 text-xs text-stone-400">
            <button className="hover:text-stone-600">💬 Comments</button>
            <button className="hover:text-stone-600">↗ Share</button>
            <button className="hover:text-stone-600">⭐ Save</button>
          </div>
        </div>
      </div>
      <div className="border-t border-stone-100 bg-stone-50/50 px-4 py-3 flex items-center gap-2 flex-wrap">
        <Copied text={`${title}\n\n${body}`} />
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors ml-auto">
          📋 Post Now →
        </button>
      </div>
      <div className="border-t border-dashed border-stone-100 px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs text-stone-300">✏️</span>
        <input className="flex-1 text-xs outline-none placeholder:text-stone-300 bg-transparent" placeholder="Describe what you want → AI writes it" />
      </div>
    </div>
  );
}

// ─── LinkedIn Preview ─────────────────────────────────────────────────────────
function LinkedInPreview({ preview }: { preview: Analysis["communities"]["linkedin"]["preview"] }) {
  return (
    <div className="border border-stone-200 rounded-xl overflow-hidden bg-white text-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg shrink-0">{preview.author[0]}</div>
            <div>
              <p className="font-semibold text-stone-900">{preview.author} <span className="font-normal text-stone-400">· 1st</span></p>
              <p className="text-xs text-stone-500">{preview.role}</p>
              <p className="text-xs text-stone-400">Just now · 🌐</p>
            </div>
          </div>
          <button className="text-blue-600 font-semibold shrink-0 hover:underline">+ Follow</button>
        </div>
        <p className="text-stone-800 leading-relaxed whitespace-pre-line mb-4">{preview.content}</p>
        <div className="flex justify-between text-xs text-stone-400 pb-3 border-b border-stone-100">
          <span>🔥❤️🎉 {preview.reactions.toLocaleString()}</span>
          <span>{preview.comments} comments · {preview.reposts} reposts</span>
        </div>
        <div className="flex gap-4 pt-3 text-stone-500">
          {["👍 Like", "💬 Comment", "↗ Repost", "📤 Send"].map(a => (
            <button key={a} className="hover:text-stone-900 transition-colors">{a}</button>
          ))}
        </div>
      </div>
      <div className="border-t border-stone-100 bg-stone-50/50 px-4 py-3 flex items-center gap-2 flex-wrap">
        <Copied text={preview.content} />
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 transition-colors ml-auto">
          📋 Post Now →
        </button>
      </div>
      <div className="border-t border-dashed border-stone-100 px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs text-stone-300">✏️</span>
        <input className="flex-1 text-xs outline-none placeholder:text-stone-300 bg-transparent" placeholder="Describe what you want → AI writes it" />
      </div>
    </div>
  );
}

// ─── Communities Tab ──────────────────────────────────────────────────────────
function CommunitiesTab({ analysis, isPaid, onUpgrade }: { analysis: Analysis; isPaid: boolean; onUpgrade: () => void }) {
  const { reddit: r, linkedin: li, twitter: tw, whatsapp: wa } = analysis.communities || {};

  // Combine all communities into a single intelligent list
  let allCommunities = [
    ...(r?.subreddits || []).map(s => ({ name: s.name, platform: 'Reddit', icon: 'r/', bg: '#FF4500', members: s.members, match: s.match, url: `https://reddit.com/${s.name}` })),
    ...(wa?.groups || []).map(g => ({ name: g.name, platform: g.platform, icon: g.platform === 'WhatsApp' ? '💬' : '✈️', bg: g.platform === 'WhatsApp' ? '#25D366' : '#0088cc', members: g.members, match: 85 + Math.floor(Math.random() * 10), url: g.url })),
    ...(li ? [{ name: 'B2B Founders & Execs', platform: 'LinkedIn', icon: 'in', bg: '#0A66C2', members: 'Global Network', match: 92, url: 'https://linkedin.com' }] : []),
    ...(tw ? [{ name: 'Tech Twitter / Build in Public', platform: 'Twitter', icon: '𝕏', bg: '#111', members: 'Massive Reach', match: 88, url: 'https://twitter.com' }] : []),
  ].sort((a, b) => b.match - a.match);

  const totalFound = allCommunities.length;
  if (!isPaid) {
    allCommunities = allCommunities.slice(0, 10);
  }

  const topTier = allCommunities.filter(c => c.match >= 90);
  const midTier = allCommunities.filter(c => c.match >= 80 && c.match < 90);
  const lowTier = allCommunities.filter(c => c.match < 80);

  const Group = ({ title, desc, items, color }: { title: string, desc: string, items: typeof allCommunities, color: string }) => (
    items.length > 0 ? (
      <div className="mb-6 last:mb-0">
        <div className="flex items-baseline gap-3 mb-3">
          <h4 className="font-bold text-stone-900">{title}</h4>
          <span className="text-xs text-stone-400">{desc}</span>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
          {items.map((c, i) => (
            <div key={i} className="flex items-center p-4 border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <div className="ml-4 flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors truncate">{c.name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ color: color, backgroundColor: `${color}15` }}>{c.match}% Match</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  <span className="flex items-center gap-1.25"><span className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {c.platform}</span>
                  <span className="flex items-center gap-1.25"><span className="w-1.5 h-1.5 rounded-full bg-stone-300" /> {c.members}</span>
                </div>
              </div>
              <div className="ml-4 flex items-center gap-3">
                <a href={c.url} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shrink-0">
                  Open <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <h3 className="font-semibold text-stone-900 flex items-center gap-2 mb-1">
            <Map className="w-5 h-5 text-blue-500" /> Audience Match Intelligence
          </h3>
          <p className="text-sm text-stone-500">We scanned the web to find where your users already hang out.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-stone-50 rounded-xl border border-stone-100">
            <div className="font-bold text-stone-900">{allCommunities.length}</div>
            <div className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase">Active Groups</div>
          </div>
          <div className="text-center px-4 py-2 bg-stone-50 rounded-xl border border-stone-100">
            <div className="font-bold text-stone-900">{analysis.launchReadiness?.overallScore || 85}</div>
            <div className="text-[10px] font-semibold text-stone-400 tracking-wider uppercase">Readiness Score</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Group title="🔥 High Conviction Targets" desc="Exact match. Post here first." items={topTier} color="#16a34a" />
        <Group title="🌊 Broad Growth Channels" desc="Large overlap, good for awareness." items={midTier} color="#d97706" />
        <Group title="🎯 Niche & Alternative" desc="Smaller but highly tailored audiences." items={lowTier} color="#4b5563" />
      </div>

      {!isPaid && (
        <div className="bg-stone-900 rounded-2xl p-6 relative overflow-hidden mt-8">
          <div className="absolute -right-10 -top-10 opacity-10 text-[150px]">🚀</div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-serif text-white text-2xl mb-2 leading-tight">Want our full list of 40+ communities?</h3>
              <p className="text-stone-400 text-sm max-w-md">Upgrade to Launch Plan to unlock all specific groups, exact targeting strategies, and the complete distribution map.</p>
            </div>
            <button onClick={onUpgrade} className="bg-yellow-400 text-stone-900 font-bold px-6 py-3.5 rounded-xl hover:bg-yellow-300 transition-colors whitespace-nowrap shadow-lg shadow-yellow-400/20 shrink-0">
              Unlock Full Map →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Posts Tab ────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "reddit", label: "Reddit", icon: "r/", bg: "#FF4500" },
  { id: "linkedin", label: "LinkedIn", icon: "in", bg: "#0A66C2" },
  { id: "twitter", label: "Twitter/X", icon: "𝕏", bg: "#111" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", bg: "#25D366" },
];
const TONES = ["Founder story", "Bold & direct", "Conversational", "Data-driven", "Controversial hook", "Humble builder"];

function PostsTab({ analysis, plan, onUpgrade, setAnalysis }: { analysis: Analysis; plan: Plan; onUpgrade: () => void; setAnalysis: (u: Partial<Analysis>) => void }) {
  const [plat, setPlat] = useState("reddit");
  const [tone, setTone] = useState("Founder story");
  const [custom, setCustom] = useState("");
  const [postsPerPlatform, setPostsPerPlatform] = useState<Record<string, Post[]>>(analysis.generatedPosts || {});
  const posts = postsPerPlatform[plat] || [];
  const [loading, setLoading] = useState(false);
  const [usedPerPlatform, setUsedPerPlatform] = useState<Record<string, number>>({ reddit: 0, linkedin: 0, twitter: 0, whatsapp: 0 });
  const LIMIT = 15;
  const isFounder = plan === "founder";
  const used = usedPerPlatform[plat] || 0;

  const generate = async () => {
    if (!isFounder && used >= LIMIT) {
      toast.error(`15-regeneration limit reached for ${plat}. Upgrade to Founder for unlimited.`);
      onUpgrade();
      return;
    }
    setLoading(true);
    try {
      const r = await fetch("/api/posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analysis.url, platform: plat, tone: custom || tone, analysis, plan }),
      });
      const d = await r.json();
      if (r.status === 403 && d.error === "limit_reached") { onUpgrade(); return; }
      if (!r.ok) throw new Error(d.error);
      const newPosts: Post[] = (d.posts || []).map((p: Omit<Post, "id">, i: number) => ({ id: `${Date.now()}-${i}`, ...p }));
      setPostsPerPlatform(prev => {
        const next = { ...prev, [plat]: newPosts };
        setAnalysis({ generatedPosts: next });
        return next;
      });
      if (!isFounder) setUsedPerPlatform(prev => ({ ...prev, [plat]: Math.min((prev[plat] || 0) + 1, LIMIT) }));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h3 className="font-semibold text-stone-900 mb-5">AI Social Post Generator</h3>

        <div className="mb-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Platform</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => setPlat(p.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${plat === p.id ? "bg-stone-900 border-stone-900 text-white" : "border-stone-200 text-stone-600 hover:border-stone-400"}`}>
                <span className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold" style={{ background: p.bg }}>{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Tone & Style</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {TONES.map(t => (
              <button key={t} onClick={() => { setTone(t); setCustom(""); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${tone === t && !custom ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-500"}`}>
                {t}
              </button>
            ))}
          </div>
          <input value={custom} onChange={e => setCustom(e.target.value)}
            placeholder="Or describe a custom tone / angle..."
            className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-400 transition-colors" />
        </div>

        {plan === "free" ? (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center mt-4">
            <Lock className="w-6 h-6 text-stone-400 mx-auto mb-2" />
            <h4 className="font-semibold text-stone-900 mb-1">Unlimited Post Generation Locked</h4>
            <p className="text-sm text-stone-500 mb-4 max-w-sm mx-auto">Upgrade to generate endless tailored {plat} posts with custom angles, hooks, and community-specific formatting.</p>
            <button onClick={onUpgrade} className="bg-stone-900 text-white font-semibold px-5 py-2 rounded-lg hover:bg-stone-800 transition-colors text-sm">
              Upgrade to Unlock
            </button>
          </div>
        ) : (
          <>
            {!isFounder && (
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-stone-400">{used}/{LIMIT} regenerations ({plat})</span>
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${(used / LIMIT) * 100}%` }} />
                </div>
                {used >= 12 && <span className="text-xs text-amber-600 font-medium">Almost at limit</span>}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={generate} disabled={loading}
                className="bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Generating..." : posts.length > 0 ? "Regenerate 3 Posts" : "Generate 3 Posts"}
              </button>
              {posts.length > 0 && (
                <span className="text-xs text-stone-400">
                  {isFounder ? "♾️ Unlimited regenerations" : `${used}/${LIMIT} for ${plat}`}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {!isFounder && plan !== "free" && used >= LIMIT && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-stone-900 text-sm mb-1">You&apos;ve used all 15 regenerations for {plat}</p>
            <p className="text-xs text-stone-500">Upgrade to Founder Plan for unlimited regeneration on all platforms.</p>
          </div>
          <button onClick={onUpgrade} className="bg-amber-500 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-amber-600 transition-colors whitespace-nowrap">
            Upgrade →
          </button>
        </div>
      )}

      {plan === "free" && analysis.communities && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="font-semibold text-stone-900">Your Free Preview Post</h4>
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded">1 included</span>
          </div>
          {plat === "reddit" && analysis.communities.reddit?.preview && (
            <RedditPreview
              sub={analysis.communities.reddit.preview.subreddit}
              upvotes={analysis.communities.reddit.preview.upvotes}
              title={analysis.communities.reddit.preview.title}
              body={analysis.communities.reddit.preview.body}
            />
          )}
          {plat === "linkedin" && analysis.communities.linkedin?.preview && (
            <LinkedInPreview preview={analysis.communities.linkedin.preview} />
          )}
          {plat === "twitter" && analysis.communities.twitter?.preview && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mb-4">{analysis.communities.twitter.preview.replace(/\\n/g, '\n')}</p>
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <Copied text={analysis.communities.twitter.preview.replace(/\\n/g, '\n')} small />
              </div>
            </div>
          )}
          {plat === "whatsapp" && analysis.communities.whatsapp?.preview && (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 bg-[#efeae2]">
              <div className="bg-[#d9fdd3] text-[#111b21] rounded-xl rounded-tl-none p-3 max-w-[85%] text-sm shadow-sm inline-block whitespace-pre-wrap">
                {analysis.communities.whatsapp.preview.replace(/\\n/g, '\n')}
              </div>
              <div className="flex items-center justify-between pt-4 mt-2">
                <Copied text={analysis.communities.whatsapp.preview.replace(/\\n/g, '\n')} small />
              </div>
            </div>
          )}
        </div>
      )}

      {plan !== "free" && posts.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {posts.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white border border-stone-200 rounded-2xl p-5">
              {p.community && <p className="text-xs font-semibold text-green-700 mb-1.5">{p.community}</p>}
              {p.hook && <p className="text-xs text-stone-400 italic mb-2">Hook: {p.hook}</p>}
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mb-4">{p.content.replace(/\\n/g, '\n')}</p>
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <span className="text-xs text-stone-400">{p.content.length} chars</span>
                <Copied text={p.content.replace(/\\n/g, '\n')} small />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Calendar Tab ─────────────────────────────────────────────────────────────
function CalendarTab({ analysis, plan, setAnalysis }: { analysis: Analysis; plan: Plan; setAnalysis: (u: Partial<Analysis>) => void }) {
  const daysLimit = plan === "founder" ? 30 : 15;
  type DayType = { day: number; theme: string; tasks: { title: string; description: string; platform?: string; priority: "high" | "medium" | "low" }[] };
  const [days, setDays] = useState<DayType[]>(analysis.generatedCalendar || []);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set([1]));
  const [done, setDone] = useState<Set<string>>(new Set(analysis.generatedCalendarDone || []));

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/calendar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analysis.url, plan, days: daysLimit }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      const newDays = d.calendar?.days || [];
      setDays(newDays);
      setAnalysis({ generatedCalendar: newDays });
      toast.success(`✓ ${daysLimit}-day calendar ready`);
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  if (!days.length) return (
    <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
      <Calendar className="w-10 h-10 text-stone-200 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-900 mb-2">{daysLimit}-Day Launch Calendar</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto">Day-by-day plan with specific posts, communities, and timing.</p>
      <button onClick={generate} disabled={loading}
        className="bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        {loading ? "Building..." : "Generate Calendar"}
      </button>
    </div>
  );

  const total = days.reduce((s, d) => s + d.tasks.length, 0);
  const phase = (n: number) => n <= 3 ? "Pre-launch" : n <= daysLimit * 0.4 ? "Launch" : "Growth";

  return (
    <div className="space-y-3">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-stone-900">{daysLimit}-Day Launch Calendar</h3>
          <p className="text-sm text-stone-500 mt-0.5">{done.size}/{total} tasks completed · {Math.round((done.size / total) * 100) || 0}%</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 rounded-full transition-all" style={{ width: `${(done.size / total) * 100}%` }} />
          </div>
          <button onClick={generate} disabled={loading} className="text-xs text-stone-400 hover:text-stone-700 transition-colors">↺</button>
        </div>
      </div>

      {days.map(d => {
        const isOpen = open.has(d.day);
        const dayDone = d.tasks.filter((_, i) => done.has(`${d.day}-${i}`)).length;
        return (
          <div key={d.day} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(p => { const n = new Set(p); isOpen ? n.delete(d.day) : n.add(d.day); return n; })}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors text-left">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center font-serif text-green-700 shrink-0 text-sm font-semibold">{d.day}</div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-stone-900 text-sm">{d.theme}</span>
                <span className="text-xs text-stone-400 ml-2">{phase(d.day)}</span>
              </div>
              <span className="text-xs text-stone-400">{dayDone}/{d.tasks.length}</span>
              {isOpen ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />}
            </button>
            {isOpen && (
              <div className="px-5 pb-4 space-y-2 border-t border-stone-100 pt-3">
                {d.tasks.map((t, i) => {
                  const k = `${d.day}-${i}`; const isDone = done.has(k);
                  return (
                    <div key={i} onClick={() => setDone(p => {
                      const n = new Set(p); isDone ? n.delete(k) : n.add(k);
                      setAnalysis({ generatedCalendarDone: Array.from(n) });
                      return n;
                    })}
                      className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isDone ? "opacity-40 bg-stone-50 border-stone-100" : "bg-white border-stone-100 hover:border-stone-200"}`}>
                      <div className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${isDone ? "bg-green-500 border-green-500" : "border-stone-300"}`}>
                        {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${isDone ? "line-through text-stone-400" : "text-stone-900"}`}>{t.title}</p>
                        <p className="text-xs text-stone-400 mt-0.5">{t.description}</p>
                        {t.platform && <span className="text-xs text-green-700 font-medium">{t.platform}</span>}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded h-fit shrink-0 ${t.priority === "high" ? "bg-red-50 text-red-600" : t.priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-stone-100 text-stone-500"}`}>
                        {t.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Distribution Map Tab ─────────────────────────────────────────────────────
type DistData = {
  reddit: { name: string; members: string; type: string; relevance: string }[];
  communities: { name: string; platform: string; type: string; relevance: string; url?: string }[];
  directories: { name: string; type: string; url?: string }[];
  newsletters: { name: string; audience: string; type: string; url?: string }[];
  founderGroups: { name: string; platform: string; members: string; url?: string }[];
};

function DistributionTab({ analysis, setAnalysis }: { analysis: Analysis; setAnalysis: (u: Partial<Analysis>) => void }) {
  const [data, setData] = useState<DistData | null>(analysis.generatedDistribution || null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/distribution", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData(d.distribution);
      setAnalysis({ generatedDistribution: d.distribution });
      toast.success("✓ Distribution map ready");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  if (!data) return (
    <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
      <Map className="w-10 h-10 text-stone-200 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-900 mb-2">Distribution Map</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto">Communities, directories, newsletters, Reddit subreddits and founder groups mapped to your product.</p>
      <button onClick={generate} disabled={loading}
        className="bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Map className="w-4 h-4" />}
        {loading ? "Mapping..." : "Generate Map"}
      </button>
    </div>
  );

  const Card = ({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) => (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <h4 className="font-semibold text-stone-900 mb-4 flex items-center gap-2 text-sm">{icon} {title}</h4>
      {children}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-stone-900">Distribution Map</h3>
          <p className="text-sm text-stone-500 mt-0.5">Where to share your product for maximum reach</p>
        </div>
        <button onClick={generate} disabled={loading} className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Reddit Subreddits" icon="🟠">
          <div className="space-y-2">
            {data.reddit?.map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 bg-stone-50 rounded-xl">
                <div>
                  <a href={`https://reddit.com/${s.name}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{s.name}</a>
                  <p className="text-xs text-stone-400 mt-0.5">{s.relevance}</p>
                </div>
                <span className="text-xs text-stone-500 shrink-0">{s.members}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Communities & Groups" icon="👥">
          <div className="space-y-2">
            {data.communities?.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl">
                <div className="flex-1">
                  {c.url ? (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{c.name}</a>
                  ) : (
                    <p className="text-sm font-medium text-stone-900">{c.name}</p>
                  )}
                  <p className="text-xs text-stone-400">{c.platform} · {c.relevance}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">{c.type}</span>
                  {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Directories & Listings" icon="📋">
          <div className="space-y-2">
            {data.directories?.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-stone-900">{d.name}</p>
                  <p className="text-xs text-stone-400">{d.type}</p>
                </div>
                {d.url && <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Newsletters" icon="📧">
          <div className="space-y-2">
            {data.newsletters?.map((n, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div>
                  {n.url ? (
                    <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{n.name}</a>
                  ) : (
                    <p className="text-sm font-medium text-stone-900">{n.name}</p>
                  )}
                  <p className="text-xs text-stone-400">{n.audience} · {n.type}</p>
                </div>
                {n.url && <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Founder Groups" icon="🚀">
          <div className="space-y-2">
            {data.founderGroups?.map((g, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                <div>
                  {g.url ? (
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{g.name}</a>
                  ) : (
                    <p className="text-sm font-medium text-stone-900">{g.name}</p>
                  )}
                  <p className="text-xs text-stone-400">{g.platform}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-400">{g.members}</span>
                  {g.url && <a href={g.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" /></a>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Outreach Tab ─────────────────────────────────────────────────────────────
const EMAIL_TABS = [
  { id: "early_adopter", label: "Early Adopter", icon: "👤" },
  { id: "beta_invite", label: "Beta Invite", icon: "🧪" },
  { id: "influencer", label: "Influencer", icon: "📢" },
  { id: "investor", label: "Investor", icon: "💰" },
];

type EmailType = { type: string; subject: string; body: string };

function OutreachTab({ analysis, setAnalysis }: { analysis: Analysis; setAnalysis: (u: Partial<Analysis>) => void }) {
  const [emails, setEmails] = useState<EmailType[]>(analysis.generatedEmails || []);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState("early_adopter");

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/outreach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: analysis.url, analysis }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setEmails(d.emails || []);
      setAnalysis({ generatedEmails: d.emails || [] });
      toast.success("✓ 4 email templates ready");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  if (!emails.length) return (
    <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
      <Mail className="w-10 h-10 text-stone-200 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-900 mb-2">Cold Outreach Email Bundle</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto">4 AI-crafted email templates: early adopter, beta invite, influencer & investor.</p>
      <button onClick={generate} disabled={loading}
        className="bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {loading ? "Writing emails..." : "Generate Bundle"}
      </button>
    </div>
  );

  const email = emails.find(e => e.type === active);

  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="space-y-2">
        {EMAIL_TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={`w-full text-left p-3 rounded-xl border transition-all text-sm font-medium flex items-center gap-2 ${active === t.id ? "bg-stone-900 text-white border-stone-900" : "bg-white border-stone-200 text-stone-700 hover:border-stone-400"}`}>
            {t.icon} {t.label}
          </button>
        ))}
        <button onClick={generate} disabled={loading} className="w-full text-xs text-stone-400 hover:text-stone-700 py-2 flex items-center justify-center gap-1">
          <RefreshCw className="w-3 h-3" /> Regenerate
        </button>
      </div>
      {email && (
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Subject Line</p>
            <div className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3 gap-3">
              <span className="font-medium text-sm text-stone-900 flex-1">{email.subject}</span>
              <Copied text={email.subject} small />
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-stone-400 uppercase tracking-wider">Email Body</p>
              <Copied text={email.body} />
            </div>
            <div className="bg-stone-50 rounded-xl p-4 min-h-48">
              <pre className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap font-sans">{email.body}</pre>
            </div>
            <p className="text-xs text-stone-400 mt-3">💡 Replace [Name] with their first name and add one personal observation at the top.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PH Kit Tab ───────────────────────────────────────────────────────────────
type KitData = { productHuntTitle: string; productHuntTagline: string; productHuntDescription: string; productHuntTopics: string[]; launchChecklist: (string | { title: string; description: string })[] };

function KitTab({ analysis, setAnalysis }: { analysis: Analysis; setAnalysis: (u: Partial<Analysis>) => void }) {
  const [kit, setKit] = useState<KitData | null>(analysis.generatedKit || null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/kit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setKit(d.kit);
      setAnalysis({ generatedKit: d.kit });
      toast.success("✓ Product Hunt kit ready");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  if (!kit) return (
    <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
      <Rocket className="w-10 h-10 text-stone-200 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-900 mb-2">Product Hunt Launch Kit</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto">Optimized title, tagline, description, topics and 10-step launch checklist.</p>
      <button onClick={generate} disabled={loading}
        className="bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
        {loading ? "Building kit..." : "Generate PH Kit"}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-stone-900">Product Hunt Listing</h3>
          <a href="https://producthunt.com/posts/new" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900">Open PH <ExternalLink className="w-3 h-3" /></a>
        </div>
        <div className="space-y-4">
          {[{ label: "Title (max 30 chars)", val: kit.productHuntTitle }, { label: "Tagline (max 60 chars)", val: kit.productHuntTagline }].map(({ label, val }) => (
            <div key={label}>
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-1.5">{label}</p>
              <div className="flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3 gap-3">
                <span className="font-medium text-sm text-stone-900 flex-1">{val}</span>
                <Copied text={val} small />
              </div>
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-stone-400 uppercase tracking-wider">Description</p>
              <Copied text={kit.productHuntDescription} />
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{kit.productHuntDescription}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl p-5">
        <h4 className="font-semibold text-stone-900 mb-3 text-sm">Topics to Target</h4>
        <div className="flex flex-wrap gap-2">
          {kit.productHuntTopics?.map((t, i) => (
            <button key={i} onClick={() => { navigator.clipboard.writeText(t); toast.success("Copied!"); }}
              className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full hover:bg-amber-100 transition-colors cursor-pointer">
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl p-5">
        <h4 className="font-semibold text-stone-900 mb-4 text-sm">🚀 Launch Checklist</h4>
        <ul className="space-y-3">
          {kit.launchChecklist?.map((item, i) => {
            const title = typeof item === 'string' ? item : item.title;
            const desc = typeof item === 'string' ? null : item.description;
            return (
              <li key={i} onClick={() => setChecked(p => { const n = new Set(p); checked.has(i) ? n.delete(i) : n.add(i); return n; })}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked.has(i) ? "opacity-50 bg-stone-50 border-stone-100" : "bg-white border-stone-100 hover:border-stone-200"}`}>
                <div className={`w-5 h-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${checked.has(i) ? "bg-green-500 border-green-500" : "border-stone-300"}`}>
                  {checked.has(i) && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${checked.has(i) ? "line-through text-stone-400" : "text-stone-900"}`}>{title}</p>
                  {desc && <p className={`text-xs mt-1 leading-relaxed ${checked.has(i) ? "text-stone-300" : "text-stone-500"}`}>{desc}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <button onClick={generate} disabled={loading}
        className="w-full py-2.5 text-sm text-stone-500 hover:text-stone-900 border border-stone-200 rounded-2xl hover:bg-white transition-colors flex items-center justify-center gap-2">
        <RefreshCw className="w-3.5 h-3.5" /> Regenerate Kit
      </button>
    </div>
  );
}

// ─── Improvements Tab ─────────────────────────────────────────────────────────
type Improvement = { section: string; issue: string; suggestion: string; priority: "critical" | "high" | "medium"; example?: string };
type ImprovData = { improvements: Improvement[]; quickWins: string[]; abTests: { element: string; variant: string }[] };

function ImprovementsTab({ analysis, setAnalysis }: { analysis: Analysis; setAnalysis: (u: Partial<Analysis>) => void }) {
  const [data, setData] = useState<ImprovData | null>(analysis.generatedImprovements || null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState<Set<number>>(new Set([0, 1]));

  const generate = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/improvements", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setData(d.improvements);
      setAnalysis({ generatedImprovements: d.improvements });
      toast.success("✓ Improvement report ready");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  };

  if (!data) return (
    <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center">
      <Lightbulb className="w-10 h-10 text-stone-200 mx-auto mb-4" />
      <h3 className="font-semibold text-stone-900 mb-2">Landing Page Improvements</h3>
      <p className="text-sm text-stone-500 mb-6 max-w-xs mx-auto">AI-powered CRO audit, quick wins and A/B test ideas for your landing page.</p>
      <button onClick={generate} disabled={loading}
        className="bg-stone-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2 mx-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
        {loading ? "Analyzing..." : "Analyze My Page"}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: "Critical", v: data.improvements.filter(i => i.priority === "critical").length, c: "text-red-600" },
          { l: "Quick Wins", v: data.quickWins?.length || 0, c: "text-amber-600" },
          { l: "A/B Tests", v: data.abTests?.length || 0, c: "text-blue-600" },
        ].map(s => (
          <div key={s.l} className="bg-white border border-stone-200 rounded-2xl p-4 text-center">
            <div className={`font-serif text-4xl ${s.c}`}>{s.v}</div>
            <div className="text-xs text-stone-400 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {data.quickWins?.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="font-semibold text-sm text-stone-900">Quick Wins — Do These First</span>
          </div>
          <ul className="space-y-2">
            {data.quickWins.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-stone-900 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        {data.improvements.map((item, i) => {
          const isOpen = open.has(i);
          return (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <button onClick={() => setOpen(p => { const n = new Set(p); isOpen ? n.delete(i) : n.add(i); return n; })}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-stone-50 transition-colors text-left">
                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${item.priority === "critical" ? "bg-red-50 text-red-600" : item.priority === "high" ? "bg-amber-50 text-amber-600" : "bg-stone-100 text-stone-500"}`}>
                  {item.priority}
                </span>
                <span className="font-medium text-sm text-stone-900 flex-1">{item.section}</span>
                <span className="text-xs text-stone-400 hidden md:block max-w-[200px] truncate">{item.issue}</span>
                {isOpen ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 space-y-3 border-t border-stone-100 pt-4">
                  <div><p className="text-xs text-stone-400 mb-1">Issue</p><p className="text-sm text-red-600">{item.issue}</p></div>
                  <div><p className="text-xs text-stone-400 mb-1">Recommendation</p><p className="text-sm text-stone-700 leading-relaxed">{item.suggestion}</p></div>
                  {item.example && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                      <p className="text-xs text-stone-400 mb-1">Example</p>
                      <p className="text-sm text-green-800 italic">{item.example}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.abTests?.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <h4 className="font-semibold text-stone-900 mb-3 text-sm">A/B Test Ideas</h4>
          <div className="space-y-2">
            {data.abTests.map((t, i) => (
              <div key={i} className="flex gap-3 text-sm p-3 bg-stone-50 rounded-xl">
                <span className="font-medium text-stone-500 shrink-0">Test {i + 1}:</span>
                <span className="text-stone-600">{t.element} → <span className="text-blue-600 font-medium">{t.variant}</span></span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "communities", label: "Communities", free: true },
  { id: "posts", label: "Posts", free: false },
  { id: "calendar", label: "Calendar", free: false },
  { id: "distribution", label: "Distribution", free: false },
  { id: "outreach", label: "Outreach", free: false },
  { id: "kit", label: "PH Kit", free: false, founderOnly: true },
  { id: "improvements", label: "Improvements", free: false },
];
export { UpgradeModal, CommunitiesTab, PostsTab, CalendarTab, DistributionTab, OutreachTab, KitTab, ImprovementsTab };
