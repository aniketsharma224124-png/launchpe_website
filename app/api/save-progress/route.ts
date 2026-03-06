import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const { analysisId, data, userId } = await req.json();
        if (!analysisId || !userId) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

        const admin = supabaseAdmin();
        const { error } = await admin.from("analyses")
            .update({ data })
            .eq("id", analysisId)
            .eq("user_id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: unknown) {
        console.error("Save progress error:", err);
        return NextResponse.json({ error: "Save failed" }, { status: 500 });
    }
}
