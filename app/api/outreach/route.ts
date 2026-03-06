import { NextRequest, NextResponse } from "next/server";
import { generateOutreach } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { url, analysis } = await req.json();
    const result = await generateOutreach(url, analysis || {});
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
