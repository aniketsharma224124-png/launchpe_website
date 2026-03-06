"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Copy, RefreshCw, ArrowUp, ArrowDown, Loader2, Globe,
  Lock, X, ChevronDown, ChevronRight, ExternalLink, Zap,
  Calendar, Map, Mail, Rocket, Lightbulb, Bell,
} from "lucide-react";
import toast from "react-hot-toast";
import Script from "next/script";

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
  const allCommunities = [
    ...(r?.subreddits || []).map(s => ({ name: s.name, platform: 'Reddit', icon: 'r/', bg: '#FF4500', members: s.members, match: s.match, url: `https://reddit.com/${s.name}` })),
    ...(wa?.groups || []).map(g => ({ name: g.name, platform: g.platform, icon: g.platform === 'WhatsApp' ? '💬' : '✈️', bg: g.platform === 'WhatsApp' ? '#25D366' : '#0088cc', members: g.members, match: 85 + Math.floor(Math.random() * 10), url: g.url })),
    ...(li ? [{ name: 'B2B Founders & Execs', platform: 'LinkedIn', icon: 'in', bg: '#0A66C2', members: 'Global Network', match: 92, url: 'https://linkedin.com' }] : []),
    ...(tw ? [{ name: 'Tech Twitter / Build in Public', platform: 'Twitter', icon: '𝕏', bg: '#111', members: 'Massive Reach', match: 88, url: 'https://twitter.com' }] : []),
  ].sort((a, b) => b.match - a.match);

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
      </div>

      {!isFounder && used >= LIMIT && (
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

      {posts.length > 0 && (
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
type KitData = { productHuntTitle: string; productHuntTagline: string; productHuntDescription: string; productHuntTopics: string[]; launchChecklist: string[] };

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
      <div className="grid md:grid-cols-2 gap-4">
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
          <h4 className="font-semibold text-stone-900 mb-3 text-sm">Launch Checklist</h4>
          <ul className="space-y-2">
            {kit.launchChecklist?.map((item, i) => (
              <li key={i} onClick={() => setChecked(p => { const n = new Set(p); checked.has(i) ? n.delete(i) : n.add(i); return n; })}
                className="flex items-start gap-2 cursor-pointer">
                <div className={`w-4 h-4 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${checked.has(i) ? "bg-green-500 border-green-500" : "border-stone-300"}`}>
                  {checked.has(i) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className={`text-sm ${checked.has(i) ? "line-through text-stone-400" : "text-stone-600"}`}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
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
];

function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [plan, setPlan] = useState<Plan>("free");
  const [upgradeModal, setUpgradeModal] = useState<"launch" | "founder" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(false);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const stored = sessionStorage.getItem("lp_a");
        if (stored) {
          const parsed = JSON.parse(stored);
          setAnalysis(parsed);

          // If we have a session but this data isn't saved to DB yet, save it now
          if (session?.user && !sessionStorage.getItem("lp_id")) {
            fetch("/api/analyze", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: parsed.url, productContext: { productName: parsed.productName, productDescription: parsed.productDescription }, analysis: parsed })
            }).then(r => r.json()).then(d => {
              if (d.id) sessionStorage.setItem("lp_id", d.id);
            }).catch(console.error);
          }
        }
        else if (session?.user) {
          const r = await fetch("/api/latest-analysis");
          if (r.ok) {
            const { analysisId, analysis: a } = await r.json();
            if (a) {
              sessionStorage.setItem("lp_a", JSON.stringify(a));
              if (analysisId) sessionStorage.setItem("lp_id", analysisId);
              setAnalysis(a);
            }
          }
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    loadAnalysis();

    const storedPlan = sessionStorage.getItem("lp_plan") as Plan | null;
    const sessionPlan = (session?.user as { plan?: Plan })?.plan;
    setPlan(storedPlan || sessionPlan || "free");
  }, [session]);

  // Auto-open upgrade modal from pricing redirect (?up=launch or ?up=founder)
  useEffect(() => {
    const up = searchParams.get("up");
    if (up === "launch" || up === "founder") {
      setUpgradeModal(up);
    }
  }, [searchParams]);

  const handleUpgrade = (p: Plan) => {
    setPlan(p); setUpgradeModal(null);
    sessionStorage.setItem("lp_plan", p);
    toast.success(`${p === "launch" ? "Launch" : "Founder"} Plan activated! 🎉`);
    if (session) {
      fetch("/api/upgrade", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: p }) }).catch(console.error);
    }
  };

  const isPaid = plan === "launch" || plan === "founder";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0ede8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    );
  }

  // Count Posts
  let postCount = 0;
  if (analysis?.generatedPosts) {
    Object.values(analysis.generatedPosts).forEach(posts => {
      postCount += posts.length;
    });
  }

  return (
    <div className="min-h-screen bg-[#f0ede8] font-sans text-stone-900 flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#f0ede8]/92 backdrop-blur border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl text-stone-900 flex items-center gap-1.5">
            <span className="w-6 h-6 bg-stone-900 text-white rounded flex items-center justify-center text-xs font-bold">L</span>
            LaunchPe
          </Link>
          <div className="hidden md:flex gap-7 text-sm font-medium">
            <Link href="/" className="text-stone-500 hover:text-stone-900">Home</Link>
            <Link href="/#demo" className="text-stone-500 hover:text-stone-900">Demo</Link>
            <Link href="/#pricing" className="text-stone-500 hover:text-stone-900">Pricing</Link>
          </div>
          <div className="hidden md:block">
            {session?.user ? (
              <button onClick={() => { sessionStorage.clear(); signOut({ callbackUrl: "/" }); }} className="text-sm font-semibold border border-stone-300 bg-white text-stone-700 px-4 py-2 rounded-lg hover:bg-stone-50 transition-colors">Sign out</button>
            ) : (
              <button onClick={() => signIn("google")} className="text-sm font-semibold bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">Sign in</button>
            )}
          </div>
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
          </button>
        </div>
      </header>
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="md:hidden bg-white border-b border-stone-200 overflow-hidden">
            <div className="flex flex-col p-4 gap-4">
              <Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link href="/#demo" onClick={() => setMenuOpen(false)}>Demo</Link>
              <Link href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
              {session?.user ? (
                <button onClick={() => { sessionStorage.clear(); signOut({ callbackUrl: "/" }); }} className="text-left font-medium">Sign out</button>
              ) : (
                <button onClick={() => signIn("google")} className="text-left font-medium">Sign in</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Layout ── */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 md:px-6 py-8 md:py-12">
        {!session?.user ? (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl shadow-sm">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="font-serif text-3xl mb-2 text-stone-900">Please sign in</h2>
            <p className="text-stone-500 mb-6">You need to be logged in to access your dashboard.</p>
            <button onClick={() => signIn("google")} className="bg-stone-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors inline-block">Sign In →</button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl md:text-4xl text-stone-900">Welcome, {session?.user?.name || "Founder"} 👋</h1>
                <p className="text-stone-500 mt-2 text-lg">Manage your launch plan and track your progress</p>
              </div>
              <div className="flex gap-3">
                <Link href="/#demo" className="border border-stone-300 bg-white text-stone-700 font-medium px-4 py-2.5 rounded-xl hover:bg-stone-50 transition-colors text-sm shadow-sm whitespace-nowrap">Analyze URL</Link>
              </div>
            </div>

            {/* Expiry Banner */}
            {isPaid && (
              <div className="bg-green-100/60 border border-green-200 p-5 rounded-2xl flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(34,197,94,0.15)] flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div className="font-medium text-green-900 text-sm md:text-base">Plan active — {plan === "founder" ? "29 days" : "Unlimited"} remaining</div>
                </div>
                {plan === "founder" && (
                  <button className="bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-green-800 transition-colors shadow-sm">
                    Renew Plan →
                  </button>
                )}
              </div>
            )}

            {/* Grid Top Level */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Plan */}
              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-serif text-xl font-bold flex items-center gap-2">📋 Current Plan</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${plan === 'founder' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                    plan === 'launch' ? 'bg-green-100 text-green-800 border border-green-200' :
                      'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}>
                    {plan}
                  </span>
                </div>
                {!isPaid ? (
                  <div className="text-center py-6 mt-auto">
                    <p className="text-stone-500 text-sm mb-4">You haven't purchased a plan yet.</p>
                    <Link href="/#pricing" className="bg-stone-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-stone-800 inline-block transition-colors">Get a Plan →</Link>
                  </div>
                ) : (
                  <div className="mt-auto space-y-4 text-sm">
                    <div className="flex justify-between border-b border-stone-100 pb-2"><span className="text-stone-500">Status</span><span className="font-medium text-green-600">Active</span></div>
                    <div className="flex justify-between border-b border-stone-100 pb-2"><span className="text-stone-500">Billing</span><span className="font-medium">{plan === 'founder' ? 'Monthly' : 'One-time'}</span></div>
                    <div className="flex justify-between pb-2"><span className="text-stone-500">Limits</span><span className="font-medium">{plan === 'founder' ? 'Unlimited' : '15 per platform'}</span></div>
                  </div>
                )}
              </div>

              {/* Account */}
              <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
                <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">👤 Account</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Email</span>
                    <span className="font-medium text-stone-800">{session?.user?.email || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-stone-100 pb-3">
                    <span className="text-stone-500">Member since</span>
                    <span className="font-medium text-stone-800">Today</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-stone-500">User ID</span>
                    <span className="font-mono text-xs bg-stone-100 px-2 py-1 rounded text-stone-500">uid_{(session?.user as any)?.id?.slice(0, 8) || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Mention Alert Notification Bar */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900 text-sm">Daily Mention Alerts</div>
                  <p className="text-xs text-blue-600 mt-0.5">{mentionAlerts ? "You'll get notified when your product is mentioned across communities" : "Enable to get notified when your product is mentioned"}</p>
                </div>
              </div>
              <button onClick={() => { setMentionAlerts(!mentionAlerts); toast.success(mentionAlerts ? "Alerts disabled" : "✅ Daily Mention Alerts enabled! We'll notify you via email."); }}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${mentionAlerts ? 'bg-blue-500' : 'bg-stone-300'}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${mentionAlerts ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Your Posts — Last 3 per platform */}
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-serif text-xl font-bold flex items-center gap-2">📤 Your Posts</h3>
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 text-sm font-medium bg-stone-100 px-3 py-1 rounded-lg">{postCount} posts</span>
                  {postCount > 0 && <Link href="/#demo" className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-lg hover:bg-green-100 transition-colors">+ Generate more</Link>}
                </div>
              </div>
              {postCount === 0 ? (
                <div className="bg-stone-50 border border-stone-200 border-dashed rounded-xl p-8 text-center">
                  <p className="text-stone-500 text-sm mb-2">No posts yet.</p>
                  <p className="text-stone-400 text-sm">Use the <Link href="/#demo" className="text-stone-900 underline underline-offset-2 hover:text-green-700">demo</Link> to generate content and post to platforms!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(analysis?.generatedPosts || {}).map(([platform, posts]) => {
                    const platformColors: Record<string, string> = { reddit: "bg-orange-500", linkedin: "bg-blue-600", twitter: "bg-sky-500", whatsapp: "bg-green-500" };
                    const platformIcons: Record<string, string> = { reddit: "r/", linkedin: "in", twitter: "𝕏", whatsapp: "💬" };
                    return (
                      <div key={platform} className="border border-stone-100 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-md ${platformColors[platform] || 'bg-stone-500'} text-white text-[10px] font-bold flex items-center justify-center`}>{platformIcons[platform] || '?'}</span>
                            <span className="font-semibold text-stone-800 text-sm capitalize">{platform}</span>
                            <span className="text-xs text-stone-400">{(posts as Post[]).length} posts</span>
                          </div>
                        </div>
                        <div className="divide-y divide-stone-50">
                          {(posts as Post[]).slice(0, 3).map((p: Post, i: number) => (
                            <div key={p.id || i} className="px-4 py-3 hover:bg-stone-50/50 transition-colors group">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {p.hook && <p className="text-xs font-semibold text-stone-400 mb-1">🎣 {p.hook}</p>}
                                  <p className="text-sm text-stone-700 leading-relaxed line-clamp-3">{p.content.replace(/\\n/g, '\n')}</p>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.content.replace(/\\n/g, '\n')); toast.success(`Copied ${platform} post!`); }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-2 bg-stone-100 hover:bg-stone-200 rounded-lg">
                                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                                </button>
                              </div>
                              {p.community && <p className="text-[11px] text-stone-400 mt-1.5">📍 {p.community}</p>}
                            </div>
                          ))}
                          {(posts as Post[]).length > 3 && (
                            <div className="px-4 py-2 text-center">
                              <Link href="/#demo" className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors">View all {(posts as Post[]).length} {platform} posts →</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-sm">
              <h3 className="font-serif text-xl font-bold mb-6 flex items-center gap-2">⚡ Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/#demo" className="flex items-start gap-4 p-4 border border-stone-200 rounded-xl hover:border-stone-400 hover:shadow-md transition-all group bg-white">
                  <div className="text-2xl mt-1 group-hover:scale-110 transition-transform">🔍</div>
                  <div>
                    <div className="font-bold text-stone-900">Analyze a URL</div>
                    <div className="text-xs text-stone-500 mt-1 leading-relaxed">Get a launch strategy for any product</div>
                  </div>
                </Link>
                <button onClick={() => setUpgradeModal("founder")} className="flex items-start text-left gap-4 p-4 border border-stone-200 rounded-xl hover:border-stone-400 hover:shadow-md transition-all group bg-white">
                  <div className="text-2xl mt-1 group-hover:scale-110 transition-transform">💳</div>
                  <div>
                    <div className="font-bold text-stone-900">Upgrade Plan</div>
                    <div className="text-xs text-stone-500 mt-1 leading-relaxed">Get more features and communities</div>
                  </div>
                </button>
                <a href="https://www.producthunt.com/posts/new" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-4 border border-stone-200 rounded-xl hover:border-stone-400 hover:shadow-md transition-all group bg-white">
                  <div className="text-2xl mt-1 group-hover:scale-110 transition-transform">🚀</div>
                  <div>
                    <div className="font-bold text-stone-900">Launch on Product Hunt</div>
                    <div className="text-xs text-stone-500 mt-1 leading-relaxed">Submit your product to PH</div>
                  </div>
                </a>
                <button className="flex items-start text-left gap-4 p-4 border border-stone-200 rounded-xl hover:border-stone-400 hover:shadow-md transition-all group bg-white"
                  onClick={() => { setMentionAlerts(true); toast.success("✅ Daily Mention Alerts enabled!"); }}>
                  <div className="text-2xl mt-1 group-hover:scale-110 transition-transform">🔔</div>
                  <div>
                    <div className="font-bold text-stone-900">Daily Mentions Alert</div>
                    <div className="text-xs text-stone-500 mt-1 leading-relaxed">{mentionAlerts ? "✅ Enabled" : "Off (Click to enable)"}</div>
                  </div>
                </button>
              </div>
            </div>


          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-stone-200 bg-white py-8 mt-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-stone-500">
          <div className="flex items-center gap-1.5 font-serif text-stone-900 text-sm">
            <span className="w-5 h-5 bg-stone-900 text-white rounded flex items-center justify-center text-[10px] font-bold">L</span>
            LaunchPe
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-stone-900">Privacy</Link>
            <Link href="#" className="hover:text-stone-900">Terms</Link>
            <a href="mailto:hello@launchpe.in" className="hover:text-stone-900">Contact</a>
          </div>
          <div className="text-center md:text-right">
            © 2025 LaunchPe · Built for Indian founders 🇮🇳
          </div>
        </div>
      </footer>

      {/* Global Upgrade Modal Instance */}
      {upgradeModal && <UpgradeModal plan={upgradeModal} onClose={() => setUpgradeModal(null)} onSuccess={handleUpgrade} />}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f0ede8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
