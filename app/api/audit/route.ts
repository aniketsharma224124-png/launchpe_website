import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { groq } from "@/lib/groq";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const { url, analysis } = body;

        if (!url || !analysis) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Rate limiting or access checks can be added here
        // But audit is free for all users as per requirements

        const c = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
            temperature: 0.8,
            max_tokens: 300,
            messages: [
                {
                    role: "system",
                    content: "You are a brutally honest, highly experienced startup advisor and roast master. Your job is to look at a product analysis and write a 1-paragraph, punchy, direct critique of what's holding it back. Don't be mean, be constructively ruthless. Call out bad positioning, broad targeting, weak value props, or obvious flaws. Start immediately, no fluff. Return ONLY valid JSON in format: {\"audit\": \"the paragraph\"}."
                },
                {
                    role: "user",
                    content: `Write a brutal honest audit for this product based on its landing page analysis: 
Product: ${analysis.productName}
URL: ${url}
Description: ${analysis.productDescription}
Scores: Landing Page (${analysis.launchReadiness.landingPage.score}/10: ${analysis.launchReadiness.landingPage.reason}), Community Fit (${analysis.launchReadiness.communityFit.score}/10), Content (${analysis.launchReadiness.contentStrategy.score}/10), Distribution (${analysis.launchReadiness.distribution.score}/10).
Example format: "Your landing page buries the value prop in paragraph 3. Your target audience is too broad — 'everyone who needs invoices' is not a customer. Your pricing page has no anchor. Fix these three things before spending a rupee on distribution."
Write exactly one short paragraph. Be punchy. Return exactly: {"audit": "[text]"} `
                }
            ]
        });

        const auditResponse = JSON.parse(c.choices[0]?.message?.content || "{\"audit\": \"Your landing page needs work before you scale distribution.\"}");
        const audit = auditResponse.audit;

        return NextResponse.json({ audit });
    } catch (error) {
        console.error("Audit Generation Error:", error);
        return NextResponse.json({ error: "Failed to generate audit" }, { status: 500 });
    }
}
