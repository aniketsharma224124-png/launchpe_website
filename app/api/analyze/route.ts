import { NextRequest, NextResponse } from "next/server";
import { analyzeProduct } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { url, userId } = await req.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });

    let u = url.trim();
    if (!u.startsWith("http")) u = "https://" + u;
    try { new URL(u); } catch { return NextResponse.json({ error: "Invalid URL" }, { status: 400 }); }

    // Scrape real website content first
    let scrapedText = "";
    try {
      const res = await fetch(u);
      const html = await res.text();
      // Remove basic script/style tags before stripping all HTML to avoid passing JS/CSS to the AI
      const cleanHtml = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
      scrapedText = cleanHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
    } catch (e) {
      console.warn("Direct scrape failed", e);
    }

    // Pass scraped context to AI
    const analysis = await analyzeProduct(u, scrapedText);
    const shareableId = Math.random().toString(36).slice(2) + Date.now().toString(36);
    let analysisId = shareableId;

    if (userId) {
      try {
        const admin = supabaseAdmin();
        const { data } = await admin.from("analyses").insert({
          user_id: userId, url: u,
          product_name: analysis.productName,
          data: { ...analysis, url: u },
          shareable_id: shareableId,
        }).select("id").single();
        if (data?.id) analysisId = data.id;
      } catch (e) { console.error("DB save (non-fatal):", e); }
    }

    return NextResponse.json({ analysisId, analysis: { ...analysis, url: u } });
  } catch (err: unknown) {
    console.error("Analyze error:", err);
    const msg = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json(
      { error: msg.includes("API") || msg.includes("key") ? "Check GROQ_API_KEY in .env.local" : msg },
      { status: 500 }
    );
  }
}
