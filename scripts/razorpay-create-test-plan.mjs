/**
 * Creates (or reuses) a Razorpay test plan for Recalliq Pro (₹19 INR/month).
 * Reads credentials from .env.local and prints RAZORPAY_PLAN_ID to add to .env.local.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("Missing .env.local");
    process.exit(1);
  }

  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function main() {
  loadEnvLocal();

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!keyId || !keySecret) {
    console.error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local");
    process.exit(1);
  }

  const existing = process.env.RAZORPAY_PLAN_ID?.trim();
  if (existing) {
    console.log(`RAZORPAY_PLAN_ID already set: ${existing}`);
    process.exit(0);
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
  };

  const listRes = await fetch("https://api.razorpay.com/v1/plans?count=100", {
    headers,
  });

  if (!listRes.ok) {
    console.error("Could not list plans:", await listRes.text());
    process.exit(1);
  }

  const list = await listRes.json();
  const match = (list.items ?? []).find(
    (plan) =>
      plan.item?.currency === "INR" &&
      plan.item?.amount === 1900 &&
      plan.period === "monthly",
  );

  if (match?.id) {
    console.log(`Found existing INR ₹19/month plan: ${match.id}`);
    console.log(`Add to .env.local:\nRAZORPAY_PLAN_ID=${match.id}`);
    process.exit(0);
  }

  const createRes = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers,
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: "Recalliq Pro",
        amount: 1900,
        currency: "INR",
        description: "Recalliq Pro — ₹19/month",
      },
      notes: { app: "meetingmind", env: "test" },
    }),
  });

  const created = await createRes.json();

  if (!createRes.ok) {
    console.error("Could not create plan:", created);
    process.exit(1);
  }

  console.log(`Created test plan: ${created.id}`);
  console.log(`Add to .env.local:\nRAZORPAY_PLAN_ID=${created.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
