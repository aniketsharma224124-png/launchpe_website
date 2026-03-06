import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = supabaseAdmin();
        const { data, error } = await admin.from("analyses")
            .select("id, data")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (error || !data) {
            return NextResponse.json({ analysisId: null, analysis: null });
        }

        return NextResponse.json({ analysisId: data.id, analysis: data.data });
    } catch (err: unknown) {
        console.error("Latest analysis error:", err);
        return NextResponse.json({ error: "Failed to fetch latest analysis" }, { status: 500 });
    }
}
