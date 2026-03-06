import { NextRequest, NextResponse } from "next/server";
import { generatePosts } from "@/lib/groq";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { url, platform, tone, analysis, userId, plan } = await req.json();
    if (!url || !platform) return NextResponse.json({ error: "url and platform required" }, { status: 400 });

    // Check limit for launch plan
    if (userId && plan === "launch") {
      const admin = supabaseAdmin();
      const { data } = await admin.from("profiles").select("posts_generated").eq("id", userId).single();
      if (data && data.posts_generated >= 15) {
        return NextResponse.json({ error: "limit_reached", posts_generated: data.posts_generated }, { status: 403 });
      }
    }

    const result = await generatePosts(url, platform, tone || "Founder story", analysis || {});

    // Update count
    if (userId && plan === "launch") {
      try {
        const admin = supabaseAdmin();
        await admin.from("profiles").update({
          posts_generated: (result.posts?.length || 5),
        }).eq("id", userId);
      } catch { /* non-fatal */ }
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Posts error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
