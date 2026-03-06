import { NextRequest, NextResponse } from "next/server";
import { generateImprovements } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { analysis } = await req.json();
    const improvements = await generateImprovements(analysis || {});
    return NextResponse.json({ improvements });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
