import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { plan } = await req.json();
        if (!plan || !["launch", "founder"].includes(plan)) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }

        const userId = (session.user as { id?: string }).id;
        if (!userId) {
            return NextResponse.json({ error: "No user ID" }, { status: 400 });
        }

        const admin = supabaseAdmin();
        const { error } = await admin
            .from("profiles")
            .update({ plan, updated_at: new Date().toISOString() })
            .eq("id", userId);

        if (error) throw error;

        return NextResponse.json({ success: true, plan });
    } catch (err: unknown) {
        console.error("Upgrade error:", err);
        return NextResponse.json({ error: "Upgrade failed" }, { status: 500 });
    }
}
