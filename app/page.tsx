"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Lock, Zap } from "lucide-react";
import toast from "react-hot-toast";

// We import the Dashboard Tabs from the new shared component file
import {
  CommunitiesTab, PostsTab, CalendarTab, DistributionTab, OutreachTab, KitTab, ImprovementsTab, UpgradeModal, LaunchScorecard
} from "../components/shared-tabs";

const DEMO = ["noticeboard.app", "myresume.ai", "zapbook.in"];
const FAQS = [
  { q: "Does LaunchPe auto-post on my behalf?", a: "No. Auto-posting gets accounts banned. We generate ready-to-paste content — you copy, paste, and post yourself. Takes 5–10 minutes per day and keeps your account safe." },
  { q: "How good is the AI content?", a: "It's a strong first draft — 70–85% ready. You'll want to add your personal story, specific numbers, and your own voice. Think of it as removing the blank-page problem." },
  { q: "What if my website has minimal content?", a: "The less we can scrape, the more generic the output. For best results, ensure your page clearly explains: what the product does, who it's for, and what problem it solves." },
  { q: "Is $9 really one-time?", a: "Yes. Pay once, get your complete launch package for one product. No monthly charges, no expiry. Content regeneration requires the Premium plan." },
  { q: "Can I use this for a non-Indian product?", a: "Absolutely. The community database works globally. We include Indian communities by default, but you can focus on whichever audience fits your product." },
  { q: "What's the refund policy?", a: "If the tool fails to generate content, you get a full refund. If you're unhappy with quality, we'll regenerate once for free. Beyond that, no refunds on used credits." },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [o, setO] = useState(false);
  return (
    <div className="border-b border-stone-200">
      <button onClick={() => setO(!o)} className="w-full flex justify-between items-center py-5 text-left gap-4">
        <span className="font-medium text-[15px] text-stone-800">{q}</span>
        <ChevronDown className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${o ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {o && <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pb-5 text-sm text-stone-500 leading-relaxed overflow-hidden">{a}</motion.p>}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [tab, setTab] = useState("communities");
  const [plan, setPlan] = useState<"free" | "launch" | "founder">("free");
  const [upgradeModal, setUpgradeModal] = useState<"launch" | "founder" | null>(null);
  const [demoPost, setDemoPost] = useState<{ content: string; hook?: string; community?: string } | null>(null);
  const [postLoading, setPostLoading] = useState(false);
  const [audit, setAudit] = useState<string | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Load existing analysis & plan on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("lp_a");
      if (stored) { setAnalysis(JSON.parse(stored)); setUrl(JSON.parse(stored).url || ""); }
      else if (session?.user) {
        fetch("/api/latest-analysis").then(r => r.ok && r.json()).then(d => {
          if (d?.analysis) {
            sessionStorage.setItem("lp_a", JSON.stringify(d.analysis));
            if (d.analysisId) sessionStorage.setItem("lp_id", d.analysisId);
            setAnalysis(d.analysis); setUrl(d.analysis.url || "");
          }
        });
      }
    } catch { /* ignore */ }

    const storedPlan = sessionStorage.getItem("lp_plan") as "free" | "launch" | "founder" | null;
    const sessionPlan = (session?.user as { plan?: string })?.plan as "free" | "launch" | "founder" | undefined;
    if (storedPlan) setPlan(storedPlan);
    else if (sessionPlan) setPlan(sessionPlan);
  }, [session]);

  const updateAnalysis = (updates: any) => {
    setAnalysis((prev: any) => {
      if (!prev) return prev;
      const newA = { ...prev, ...updates };
      sessionStorage.setItem("lp_a", JSON.stringify(newA));
      if (session?.user && sessionStorage.getItem("lp_id")) {
        fetch("/api/save-progress", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId: sessionStorage.getItem("lp_id"), userId: (session.user as any).id, data: newA })
        }).catch(console.error);
      }
      return newA;
    });
  };

  const go = async (u?: string) => {
    const target = (u || url).trim();
    if (!target) { toast.error("Paste a URL first"); return; }
    let full = target;
    if (!full.startsWith("http")) full = "https://" + full;
    setLoading(true);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: full, userId: (session?.user as { id?: string })?.id }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      sessionStorage.setItem("lp_a", JSON.stringify({ ...d.analysis, url: full }));
      sessionStorage.setItem("lp_id", d.analysisId || "");
      setAnalysis({ ...d.analysis, url: full });
      // Auto-generate a real Reddit post for the demo
      setPostLoading(true);
      try {
        const pr = await fetch("/api/posts", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: full, platform: "reddit", tone: "Founder story", analysis: d.analysis, plan: "free" }),
        });
        const pd = await pr.json();
        if (pr.ok && pd.posts?.length > 0) {
          setDemoPost(pd.posts[0]);
        }
      } catch { } finally { setPostLoading(false); }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed — check GROQ_API_KEY");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f0ede8]">
      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 bg-[#f0ede8]/92 backdrop-blur border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl text-stone-900 flex items-center gap-1.5">
            <span className="w-6 h-6 bg-stone-900 text-white rounded flex items-center justify-center text-xs font-bold">L</span>
            LaunchPe
          </Link>
          <nav className="hidden md:flex gap-7 text-sm text-stone-500">
            <a href="#how" className="hover:text-stone-900 transition-colors">How it works</a>
            <a href="#demo" className="hover:text-stone-900 transition-colors">Demo</a>
            <a href="#pricing" className="hover:text-stone-900 transition-colors">Pricing</a>
          </nav>
          {session
            ? <Link href="/dashboard" className="text-sm font-semibold bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">Dashboard</Link>
            : <button onClick={() => signIn("google")} className="text-sm font-semibold bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition-colors">Sign in</button>
          }
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 fade-up text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 border border-stone-300 bg-white/60 px-3 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full pulse-dot" />
          847 founders already launching
        </div>
        <h1 className="font-serif text-5xl md:text-6xl text-stone-900 leading-[1.1] tracking-tight mb-6 mx-auto">
          You built it.<br />
          <em className="italic text-green-700">Now get seen.</em><br />
          Automatically.
        </h1>
        <p className="text-base text-stone-500 max-w-lg mx-auto mb-10 leading-relaxed">
          Paste your URL. LaunchPe maps your exact audience across Reddit, LinkedIn, Twitter and 40+ communities — then writes every post, in your voice, at the right time.
        </p>
        <div className="flex flex-wrap gap-3 mb-14 justify-center">
          <a href="#demo" className="inline-flex items-center gap-2 bg-stone-900 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-stone-800 transition-colors">
            Try the demo <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#how" className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 font-medium px-5 py-2.5 rounded-lg hover:bg-white transition-colors">
            How it works
          </a>
        </div>
        <div className="flex flex-wrap gap-10 pt-7 border-t border-stone-200 justify-center">
          {[["2 min", "URL to full launch plan"], ["40+", "Communities mapped"], ["6×", "More signups vs manual"], ["$9", "One-time launch plan"]].map(([v, l]) => (
            <div key={l}><div className="font-serif text-2xl text-stone-900">{v}</div><div className="text-sm text-stone-400 mt-0.5">{l}</div></div>
          ))}
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" className="max-w-5xl mx-auto px-6 py-20">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">Live demo</p>
        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-5">See it work <em className="italic text-green-700">in real time</em></h2>
        <p className="text-stone-500 mb-10">Paste any product URL and watch LaunchPe build a complete launch strategy in under 60 seconds.</p>

        {/* Browser shell */}
        <div className="rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
          {/* Chrome bar */}
          <div className="bg-stone-100 border-b border-stone-200 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" /></div>
            <div className="flex-1 flex justify-center"><div className="bg-stone-200 rounded px-4 py-1 text-xs text-stone-500 font-mono">launchpe.in — Launch Engine</div></div>
          </div>
          {/* URL input */}
          <div className="bg-white p-5 border-b border-stone-100">
            <div className="flex gap-3">
              <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && go()}
                placeholder="Paste your product URL — e.g. noticeboard.app"
                className="flex-1 border border-stone-200 rounded-xl px-4 py-3 text-[15px] text-stone-900 placeholder:text-stone-400 outline-none focus:border-stone-400 transition-colors" />
              <button onClick={() => go()} disabled={loading}
                className="bg-stone-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-60 flex items-center gap-2 whitespace-nowrap">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Analyze →"}
              </button>
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-stone-400">
              <span>Try:</span>
              {DEMO.map(d => <button key={d} onClick={() => { setUrl(d); }} className="underline hover:text-stone-700 transition-colors">{d}</button>)}
            </div>
            {/* Brutal Honest Audit Button */}
            {analysis && !auditLoading && !audit && (
              <button onClick={async () => {
                setAuditLoading(true);
                try {
                  const r = await fetch("/api/audit", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: analysis.url, analysis }),
                  });
                  const d = await r.json();
                  if (r.ok) setAudit(d.audit);
                } catch { } finally { setAuditLoading(false); }
              }} className="w-full mt-3 py-2.5 border border-red-200 bg-red-50 text-red-700 text-sm font-semibold rounded-xl hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2">
                🔍 What's holding this back?
              </button>
            )}
            {auditLoading && (
              <div className="w-full mt-3 py-3 border border-stone-200 bg-stone-50 rounded-xl text-center">
                <div className="inline-flex items-center gap-2 text-sm text-stone-500"><div className="w-4 h-4 border-2 border-stone-300 border-t-red-500 rounded-full animate-spin" /> Diagnosing your product...</div>
              </div>
            )}
            {audit && (
              <div className="w-full mt-3 p-4 border border-red-200 bg-white rounded-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5"><Zap className="w-4 h-4 text-red-500" /> Brutal Honest Audit</h4>
                  <button onClick={() => { navigator.clipboard.writeText(audit); toast.success("Copied audit!"); }} className="text-xs text-stone-400 hover:text-stone-900 transition-colors">Copy</button>
                </div>
                <p className="text-sm text-stone-700 leading-relaxed italic">"{audit}"</p>
              </div>
            )}
          </div>
          {/* Analysis View (With Tabs embedded directly on Homepage now) */}
          {analysis && !loading ? (
            <div className="bg-[#f8f6f3] p-8 min-h-[600px] border-t border-stone-200">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white border text-left border-stone-200 rounded-2xl p-5 mb-5 flex items-start flex-col sm:flex-row gap-4 shadow-sm">
                  <div className="text-3xl shrink-0">🚀</div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-stone-900 text-lg md:text-xl leading-tight">{analysis.productName}</h2>
                    <p className="text-stone-500 text-sm mt-1">{analysis.productDescription}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {analysis.categories?.map((c: string) => (
                        <span key={c} className="text-[11px] px-2.5 py-1 border border-stone-200 rounded-full text-stone-500 font-medium">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-3 py-1.5 rounded-full shrink-0">
                      <Check className="w-3.5 h-3.5" /> Context Synced
                    </span>
                  </div>
                </div>

                {/* Scorecard Component */}
                <LaunchScorecard analysis={analysis} />

                {/* Auto-generated Demo Reddit Post */}
                {postLoading && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-6 mb-5 shadow-sm animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-orange-100" />
                      <div className="h-4 bg-stone-100 rounded w-40" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-stone-100 rounded w-3/4" />
                      <div className="h-3 bg-stone-50 rounded w-full" />
                      <div className="h-3 bg-stone-50 rounded w-5/6" />
                    </div>
                    <p className="text-xs text-stone-400 mt-4">✨ Generating your first Reddit post...</p>
                  </div>
                )}
                {demoPost && !postLoading && (
                  <div className="bg-white border border-orange-200 rounded-2xl overflow-hidden mb-5 shadow-sm">
                    <div className="bg-orange-50/50 border-b border-orange-100 px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">r/</span>
                        <span className="font-semibold text-stone-900 text-sm">Your first Reddit post — ready to copy</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded">Free preview</span>
                    </div>
                    <div className="p-5">
                      {demoPost.community && <p className="text-xs font-semibold text-orange-600 mb-2">{demoPost.community}</p>}
                      {demoPost.hook && <p className="text-xs text-stone-400 italic mb-2">Hook: {demoPost.hook}</p>}
                      <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap mb-4">{demoPost.content.replace(/\\n/g, '\n')}</p>
                      <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                        <span className="text-xs text-stone-400">{demoPost.content.length} chars · Ready to post</span>
                        <button onClick={() => { navigator.clipboard.writeText(demoPost.content.replace(/\\n/g, '\n')); toast.success("Copied! Go paste it on Reddit 🚀"); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                          📋 Copy Post
                        </button>
                      </div>
                    </div>
                    <div className="bg-stone-50 border-t border-stone-100 px-5 py-3 flex items-center justify-between">
                      <p className="text-xs text-stone-500">Want 15 more posts across Reddit, LinkedIn, Twitter & WhatsApp?</p>
                      <button onClick={() => session ? (window.location.href = "/dashboard?up=launch") : signIn("google")}
                        className="text-xs font-semibold text-stone-900 bg-yellow-400 px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors whitespace-nowrap">
                        Upgrade — $9 →
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-1 p-1 bg-white border border-stone-200 rounded-xl md:rounded-2xl mb-6 overflow-x-auto shadow-sm no-scrollbar">
                  {[
                    { id: "communities", label: "Communities", free: true },
                    { id: "posts", label: "Posts", free: true },
                    { id: "calendar", label: "Calendar", free: false },
                    { id: "distribution", label: "Distribution", free: false },
                    { id: "outreach", label: "Outreach", free: false },
                    { id: "kit", label: "PH Kit", founderOnly: true },
                    { id: "improvements", label: "Improvements", free: false }
                  ].map(t => {
                    const isPaid = plan === "launch" || plan === "founder";
                    const isFounder = plan === "founder";
                    const locked = (!t.free && !isPaid) || (t.founderOnly && !isFounder);
                    return (
                      <button key={t.id} onClick={() => setTab(t.id)}
                        className={`flex items-center shrink-0 gap-1.5 px-3 py-2 md:px-4 rounded-lg md:rounded-xl text-[13px] md:text-sm font-medium transition-all whitespace-nowrap ${tab === t.id ? "bg-stone-900 text-white shadow-sm" : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"}`}>
                        {t.label}
                        {locked && <Lock className="w-3 h-3 opacity-40" />}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content Display Area */}
                <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden text-left relative min-h-[500px]">
                  <AnimatePresence mode="wait">
                    <motion.div key={tab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="w-full h-full">
                      {tab === "communities" && <CommunitiesTab analysis={analysis} isPaid={plan === "launch" || plan === "founder"} onUpgrade={() => setUpgradeModal("launch")} />}
                      {tab === "posts" && <PostsTab analysis={analysis} plan={plan} onUpgrade={() => setUpgradeModal("founder")} setAnalysis={updateAnalysis} />}
                      {tab === "calendar" && (plan === "launch" || plan === "founder") && <CalendarTab analysis={analysis} plan={plan} setAnalysis={updateAnalysis} />}
                      {tab === "distribution" && (plan === "launch" || plan === "founder") && <DistributionTab analysis={analysis} setAnalysis={updateAnalysis} />}
                      {tab === "outreach" && (plan === "launch" || plan === "founder") && <OutreachTab analysis={analysis} setAnalysis={updateAnalysis} />}
                      {tab === "kit" && plan === "founder" && <KitTab analysis={analysis} setAnalysis={updateAnalysis} />}
                      {tab === "improvements" && (plan === "launch" || plan === "founder") && <ImprovementsTab analysis={analysis} setAnalysis={updateAnalysis} />}

                      {/* Locked State Overlay */}
                      {((tab !== "communities" && tab !== "posts" && plan === "free") || (tab === "kit" && plan !== "founder")) && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 text-center">
                          <div className="bg-white border border-stone-200 shadow-xl rounded-2xl p-8 max-w-sm">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Lock className="w-6 h-6 text-stone-400" />
                            </div>
                            <h3 className="text-xl font-serif text-stone-900 mb-2">Premium Feature</h3>
                            <p className="text-sm text-stone-500 mb-6 leading-relaxed">Upgrade your plan to unlock {tab} generation and complete your launch strategy.</p>
                            <button onClick={() => setUpgradeModal(tab === "kit" ? "founder" : "launch")} className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl hover:bg-stone-800 transition-colors">
                              Upgrade to {tab === "kit" ? "Founder" : "Launch"} Plan
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Preview grid */}
              <div className="bg-[#f8f6f3] p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: "r/", name: "Reddit", sub: "Generated post preview", bg: "#FF4500" },
                  { icon: "in", name: "LinkedIn", sub: "3 formats · Best time 9 AM Tue/Thu", bg: "#0A66C2" },
                  { icon: "𝕏", name: "Twitter / X", sub: "1 viral thread · 5 reply hooks", bg: "#111" },
                  { icon: "💬", name: "WhatsApp / Telegram", sub: "8 group types · Human tone", bg: "#25D366" },
                ].map(p => (
                  <div key={p.name} className="bg-white rounded-xl border border-stone-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: p.bg }}>{p.icon}</div>
                      <span className="font-semibold text-sm text-stone-900">{p.name}</span>
                    </div>
                    <p className="text-xs text-stone-400">{p.sub}</p>
                    <div className="mt-3 h-2 bg-stone-100 rounded-full"><div className="h-full w-2/3 bg-stone-300 rounded-full" /></div>
                    <div className="mt-1.5 h-2 bg-stone-100 rounded-full"><div className="h-full w-1/2 bg-stone-200 rounded-full" /></div>
                  </div>
                ))}
              </div>
              {/* Calendar strip */}
              <div className="bg-white border-t border-stone-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">30-Day Launch Calendar</p>
                  <p className="text-xs text-stone-400">Click a day to see scheduled posts</p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 30 }, (_, i) => (
                    <div key={i} className={`w-3 h-6 rounded-sm ${i < 7 ? "bg-green-700" : i < 15 ? "bg-green-400" : i < 22 ? "bg-stone-300" : "bg-stone-100"}`} />
                  ))}
                </div>
              </div>
              {/* CTA */}
              <div className="bg-stone-900 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-white text-xl">78</span>
                  <span className="text-stone-400 text-sm">Viral Score · Like what you see?</span>
                </div>
                <a href="#pricing" className="bg-white text-stone-900 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-stone-100 transition-colors">
                  Get your launch plan →
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="max-w-5xl mx-auto px-6 py-20 border-t border-stone-200">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">Process</p>
        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-14">Five steps. <em className="italic text-green-700">One launch.</em></h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { n: "01", icon: "🔗", t: "Paste your URL", d: "No forms, no briefs. LaunchPe reads your entire site and understands your product, audience and differentiators." },
            { n: "02", icon: "🧠", t: "Audience mapped", d: "We find exactly where your users are — specific subreddits, LinkedIn groups, WhatsApp communities — ranked by relevance." },
            { n: "03", icon: "✍️", t: "Content written", d: "Platform-native posts in your voice. Reddit-safe, LinkedIn-optimised, Twitter-ready. Zero generic templates." },
            { n: "04", icon: "📅", t: "Calendar built", d: "Specific posts, specific communities, timed precisely for when your audience is most active over 30 days." },
            { n: "05", icon: "🔔", t: "Daily alerts", d: "Someone asks a question your product answers? We find it instantly and send a pre-written reply for your one-click approval." },
            { n: "06", icon: "🚀", t: "Product Hunt Kit", d: "Ready-to-submit title, tagline, topics & checklist. Includes badge templates and pre-launch community warm-up. Premium only.", dark: true },
          ].map(s => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className={`relative overflow-hidden rounded-2xl p-6 border transition-all hover:-translate-y-1 hover:shadow-md ${s.dark ? "bg-stone-900 border-stone-900" : "bg-white border-stone-200"}`}>
              <span className={`absolute top-2 left-3 font-serif text-[80px] leading-none select-none ${s.dark ? "text-stone-800" : "text-stone-100"}`}>{s.n}</span>
              <div className="text-2xl mb-3 relative z-10">{s.icon}</div>
              <h3 className={`font-semibold text-[15px] mb-2 relative z-10 ${s.dark ? "text-white" : "text-stone-900"}`}>{s.t}</h3>
              <p className={`text-sm leading-relaxed relative z-10 ${s.dark ? "text-stone-400" : "text-stone-500"}`}>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── RESULTS ── */}
      <section className="max-w-5xl mx-auto px-6 py-20 border-t border-stone-200">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">Results</p>
        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-12">Founders who <em className="italic text-green-700">went viral</em></h2>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { name: "Arjun Mehta", role: "Founder, ResumeAI.in", pl: "LinkedIn", q: "I'd been sitting on my product for 3 weeks scared to post. LaunchPe wrote my founder story in 2 minutes. That one post got 847 reposts and 1,200 signups in 4 days.", stat: "1,200 signups · 4 days · 1 post" },
            { name: "Priya Sharma", role: "Solo founder, InvoiceBot", pl: "Reddit", q: "LaunchPe found subreddits I'd never heard of — that's where my customers actually were. I would have posted in the wrong places and wondered why nothing worked.", stat: "340 upvotes · r/india · 89 customers" },
            { name: "Rahul Joshi", role: "Founder, ClassroomAI", pl: "Twitter", q: "The thread LaunchPe wrote got picked up by two edtech journalists. I spent ₹1,499. Got press coverage worth ₹5 lakhs. Best ROI on any tool I've ever used.", stat: "2.4M impressions · 3 press mentions" },
            { name: "Kavya Nair", role: "Co-founder, MediBot.in", pl: "WhatsApp", q: "The WhatsApp message template was perfect — genuine, not spammy. Sent it to 6 groups. 3 had doctors who became our first paying users that same week.", stat: "47 doctor sign-ups · 6 messages sent" },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }}
              className="bg-white border border-stone-200 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-stone-900 text-white flex items-center justify-center font-serif">{t.name[0]}</div>
                <div><div className="font-semibold text-sm text-stone-900">{t.name}</div><div className="text-xs text-stone-400">{t.role}</div></div>
                <span className="ml-auto text-xs px-2 py-1 bg-stone-100 text-stone-500 rounded-full">{t.pl}</span>
              </div>
              <p className="text-sm text-stone-500 italic leading-relaxed mb-4">"{t.q}"</p>
              <div className="text-xs font-semibold text-green-700 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full w-fit">{t.stat}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 py-20 border-t border-stone-200">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">Pricing</p>
        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">Two plans. <em className="italic text-green-700">No surprises.</em></h2>
        <p className="text-stone-500 mb-12">Pay once for a full launch, or subscribe for continuous growth.<br />Cancel anytime.</p>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
          {/* Launch Plan */}
          <div className="bg-white border border-stone-200 rounded-2xl p-8">
            <div className="text-sm text-stone-400 font-medium mb-2">Basic Launch</div>
            <div className="flex items-baseline gap-2 mb-1"><span className="font-serif text-5xl text-stone-900">$9</span><span className="text-sm text-stone-400 line-through">$19</span></div>
            <div className="text-xs font-semibold text-green-700 mb-1">LAUNCH SPECIAL</div>
            <p className="text-sm text-stone-400 mb-1">One-time · Limited time offer</p>
            <p className="text-xs text-stone-400 mb-6">Everything you need to execute one complete product launch across Reddit, LinkedIn, Twitter and WhatsApp.</p>
            <ul className="space-y-2.5 mb-8">
              {["AI reads your actual website", "10 best-match communities", "15 ready-to-post content pieces", "20-day launch calendar", "Reddit · LinkedIn · Twitter · WhatsApp", "15 regenerations per platform", "Viral score + strategy report", "Custom angle generation"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span className="text-stone-500">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => session ? (window.location.href = "/dashboard?up=launch") : signIn("google")}
              className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl hover:bg-stone-800 transition-colors">
              Get launch plan — $9
            </button>
          </div>
          {/* Founder Plan */}
          <div className="bg-stone-900 rounded-2xl p-8 relative">
            <div className="absolute top-4 right-4 text-xs font-bold bg-yellow-400 text-stone-900 px-2 py-1 rounded-full">Most popular</div>
            <div className="text-sm text-stone-400 font-medium mb-2">Premium Growth</div>
            <div className="flex items-baseline gap-2 mb-1"><span className="font-serif text-5xl text-white">$19</span></div>
            <p className="text-sm text-stone-500 mb-1">per month · Unlimited products</p>
            <p className="text-xs text-stone-500 mb-6">For founders who want continuous traction — daily alerts, unlimited launches, and real-time audience monitoring.</p>
            <ul className="space-y-2.5 mb-8">
              {["Everything in Basic", "20+ communities per product", "30-day calendar — renewed monthly", "Unlimited content regeneration", "Custom angle generation", "Product Hunt launch kit", "Pre-written reply suggestions", "Priority support"].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" /><span className="text-stone-400">{f}</span></li>
              ))}
            </ul>
            <button onClick={() => session ? (window.location.href = "/dashboard?up=founder") : signIn("google")}
              className="w-full bg-yellow-400 text-stone-900 font-semibold py-3 rounded-xl hover:bg-yellow-300 transition-colors">
              Start growing — $19/mo
            </button>
          </div>
        </div>
        <p className="mt-6 text-xs text-stone-400">Payments via Razorpay — UPI, cards, net banking supported. <strong>No hidden charges. Cancel anytime.</strong></p>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-5xl mx-auto px-6 py-20 border-t border-stone-200">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-3">FAQ</p>
        <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-12">Common <em className="italic text-green-700">questions</em></h2>
        <div className="max-w-2xl">{FAQS.map(f => <FAQ key={f.q} {...f} />)}</div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="max-w-5xl mx-auto px-6 py-24 border-t border-stone-200 text-center">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-widest mb-4">Ready to launch</p>
        <h2 className="font-serif text-4xl md:text-5xl text-stone-900 mb-6">Stop sitting on<br />your <em className="italic text-green-700">best work.</em></h2>
        <p className="text-stone-500 mb-10 text-lg">Your product deserves to be seen. Choose a plan and get your complete launch strategy in under 3 minutes.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <a href="#pricing" className="inline-flex items-center gap-2 bg-stone-900 text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-stone-800 transition-colors">
            Get started — $9 → <ArrowRight className="w-4 h-4" />
          </a>
          <a href="#demo" className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 font-medium px-6 py-3.5 rounded-xl hover:bg-white transition-colors">
            Try the demo first
          </a>
        </div>
      </section>

      {/* Upgrade Modal Global Overlay */}
      {upgradeModal && (
        <UpgradeModal plan={upgradeModal} onClose={() => setUpgradeModal(null)} onSuccess={(p) => {
          setPlan(p);
          sessionStorage.setItem("lp_plan", p);
          setUpgradeModal(null);
          toast.success(`${p === "launch" ? "Launch" : "Founder"} Plan activated! 🎉`);
          if (session?.user) {
            fetch("/api/upgrade", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: p })
            }).catch(console.error);
          }
        }} />
      )}

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="font-serif text-xl text-stone-900 mb-3 flex items-center gap-1.5">
              <span className="w-6 h-6 bg-stone-900 text-white rounded flex items-center justify-center text-xs font-bold">L</span>
              LaunchPe
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">Viral launch intelligence for Indian founders. Paste your URL, get a complete launch strategy in under 3 minutes.</p>
          </div>
          {[
            { t: "Product", l: [["Live Demo", "#demo"], ["How it Works", "#how"], ["Pricing", "#pricing"], ["FAQ", "#faq"], ["Dashboard", "/dashboard"]] },
            { t: "Platforms", l: [["Reddit", "https://reddit.com/r/indianstartups/"], ["LinkedIn", "https://linkedin.com"], ["Twitter / X", "https://twitter.com"], ["WhatsApp", "https://web.whatsapp.com"], ["Product Hunt", "https://producthunt.com"]] },
            { t: "Company", l: [["Privacy Policy", "/privacy"], ["Terms of Service", "/terms"], ["Contact Us", "/contact"], ["aniketsharma224124@gmail.com", "mailto:aniketsharma224124@gmail.com"]] },
          ].map(col => (
            <div key={col.t}>
              <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">{col.t}</div>
              <ul className="space-y-2">{col.l.map(([l, h]) => <li key={l}><a href={h} className="text-sm text-stone-500 hover:text-stone-900 transition-colors">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 max-w-5xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-stone-400">
          <span>© 2025 LaunchPe Technologies Pvt. Ltd. · Built for Indian founders 🇮🇳</span>
          <div className="flex gap-4"><a href="/privacy" className="hover:text-stone-900">Privacy</a><a href="/terms" className="hover:text-stone-900">Terms</a><a href="/contact" className="hover:text-stone-900">Contact</a></div>
        </div>
      </footer>
    </div>
  );
}
