import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

import { handleRazorpayWebhook } from "@/lib/billing/webhook-handler";
import type { RazorpayWebhookPayload } from "@/lib/billing/webhook-handler";
import { shouldSkipRazorpayWebhooks } from "@/lib/env/app";

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
) {
  const expected = createHmac("sha256", secret).update(body).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (shouldSkipRazorpayWebhooks()) {
    return NextResponse.json({
      received: true,
      skipped: true,
      message:
        "Webhooks are disabled in local development. Subscription state is updated via /api/billing/verify after checkout.",
    });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: RazorpayWebhookPayload;

  try {
    event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const razorpayEventId = request.headers.get("x-razorpay-event-id");

  try {
    const result = await handleRazorpayWebhook({
      event,
      razorpayEventId,
    });

    return NextResponse.json({
      received: true,
      duplicate: result.duplicate ?? false,
    });
  } catch (error) {
    console.error("[billing/webhook]", error);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 },
    );
  }
}
