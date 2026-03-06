import crypto from "crypto";

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(body).digest("hex");
  return expected === signature;
}

export const PLANS = {
  launch: { amount: 89900, currency: "INR", plan: "launch" },   // ₹899
  founder: { amount: 249900, currency: "INR", plan: "founder" }, // ₹2499
};
