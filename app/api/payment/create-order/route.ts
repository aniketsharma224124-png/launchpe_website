import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { plan, userId } = await req.json();
    const planData = PLANS[plan as keyof typeof PLANS];
    if (!planData) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    // Dynamic import to avoid build issues if razorpay not installed
    const Razorpay = (await import("razorpay")).default;
    const rz = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await rz.orders.create({
      amount: planData.amount,
      currency: planData.currency,
      receipt: `lp_${Date.now()}`,
    });

    if (userId) {
      const admin = supabaseAdmin();
      await admin.from("payment_orders").insert({
        user_id: userId, razorpay_order_id: order.id,
        plan: planData.plan, amount: planData.amount, status: "pending",
      });
    }

    return NextResponse.json({ orderId: order.id, amount: planData.amount, currency: planData.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
