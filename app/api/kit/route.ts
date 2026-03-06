import { NextRequest, NextResponse } from "next/server";
import { generateKit } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { analysis } = await req.json();
    const kit = await generateKit(analysis || {});
    return NextResponse.json({ kit });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
