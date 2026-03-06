import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = supabaseAdmin();
    const { data, error } = await admin.from("analyses")
      .select("*").or(`id.eq.${params.id},shareable_id.eq.${params.id}`).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ analysis: data.data });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
