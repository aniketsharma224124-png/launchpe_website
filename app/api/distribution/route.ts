import { NextRequest, NextResponse } from "next/server";
import { generateDistribution } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { analysis } = await req.json();
    const result = await generateDistribution(analysis || {});
    return NextResponse.json({ distribution: result });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
