import type Razorpay from "razorpay";

import { logBillingDev } from "@/lib/billing/dev-log";
import { getRazorpayKeyId, getRazorpayKeySecret } from "@/lib/payments/razorpay";

type RazorpayCustomer = {
  id: string;
  email?: string;
};

function isCustomerAlreadyExistsError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "error" in error &&
          typeof (error as { error?: { description?: string } }).error
            ?.description === "string"
        ? (error as { error: { description: string } }).error.description
        : String(error);

  return message.toLowerCase().includes("customer already exists");
}

async function fetchRazorpayCustomerByEmail(
  email: string,
): Promise<RazorpayCustomer | null> {
  const keyId = getRazorpayKeyId();
  const keySecret = getRazorpayKeySecret();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const url = new URL("https://api.razorpay.com/v1/customers");
  url.searchParams.set("email", email);
  url.searchParams.set("count", "10");

  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    logBillingDev("fetch-customer-by-email-failed", {
      email,
      status: response.status,
      body: await response.text(),
    });
    return null;
  }

  const body = (await response.json()) as {
    items?: RazorpayCustomer[];
  };

  const match =
    body.items?.find(
      (customer) => customer.email?.toLowerCase() === email.toLowerCase(),
    ) ?? body.items?.[0];

  return match ?? null;
}

export async function resolveRazorpayCustomerId(
  razorpay: Razorpay,
  input: {
    userId: string;
    email: string;
    name?: string | null;
    storedCustomerId?: string | null;
  },
): Promise<string> {
  if (input.storedCustomerId) {
    logBillingDev("reuse-profile-customer", {
      userId: input.userId,
      customerId: input.storedCustomerId,
    });
    return input.storedCustomerId;
  }

  logBillingDev("create-or-resolve-customer", {
    userId: input.userId,
    email: input.email,
  });

  try {
    const customer = await razorpay.customers.create({
      name: input.name?.trim() || undefined,
      email: input.email,
      notes: { user_id: input.userId },
      fail_existing: 0,
    });

    logBillingDev("customer-ready", {
      userId: input.userId,
      customerId: customer.id,
      source: "create",
    });

    return customer.id;
  } catch (error) {
    if (!isCustomerAlreadyExistsError(error)) {
      throw error;
    }

    logBillingDev("customer-exists-fetch-by-email", { email: input.email });

    const existing = await fetchRazorpayCustomerByEmail(input.email);

    if (!existing?.id) {
      throw error;
    }

    logBillingDev("customer-ready", {
      userId: input.userId,
      customerId: existing.id,
      source: "email-lookup",
    });

    return existing.id;
  }
}
