import Razorpay from "razorpay";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getRazorpayKeyId() {
  return requireEnv("RAZORPAY_KEY_ID");
}

export function getRazorpayKeySecret() {
  return requireEnv("RAZORPAY_KEY_SECRET");
}

export function getPublicRazorpayKeyId() {
  return requireEnv("NEXT_PUBLIC_RAZORPAY_KEY_ID");
}

export function getRazorpayPlanId() {
  return requireEnv("RAZORPAY_PLAN_ID");
}

let razorpayInstance: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: requireEnv("RAZORPAY_KEY_SECRET"),
    });
  }

  return razorpayInstance;
}

export function assertRazorpayServerConfig() {
  getRazorpayKeyId();
  requireEnv("RAZORPAY_KEY_SECRET");
  getRazorpayPlanId();
}
