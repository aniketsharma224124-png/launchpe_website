import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, plan } = await req.json();

    const valid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

    const admin = supabaseAdmin();
    await admin.from("profiles").update({ plan }).eq("id", userId);
    await admin.from("payment_orders").update({
      razorpay_payment_id, status: "paid",
    }).eq("razorpay_order_id", razorpay_order_id);

    return NextResponse.json({ success: true, plan });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
