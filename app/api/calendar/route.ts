import { NextRequest, NextResponse } from "next/server";
import { generateCalendar } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const { url, plan, days } = await req.json();
    const d = days || (plan === "founder" ? 30 : 15);
    const result = await generateCalendar(url, plan || "launch", d);
    return NextResponse.json({ calendar: result });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
