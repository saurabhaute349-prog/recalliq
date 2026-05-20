export const PRO_PLAN_PRICE_INR = 19;

export const PRO_PLAN_CURRENCY = "INR" as const;

export const PRO_PLAN_LABEL = "Pro";

export const PRO_PLAN_INTERVAL = "month" as const;

/** Amount in paise for Razorpay (₹19 = 1900 paise). */
export const PRO_PLAN_AMOUNT_MINOR = PRO_PLAN_PRICE_INR * 100;

export function formatProPrice(options?: { withInterval?: boolean }): string {
  const price = `₹${PRO_PLAN_PRICE_INR}`;
  return options?.withInterval === false ? price : `${price}/month`;
}

export const PRO_PLAN_PRICE_LABEL = formatProPrice();
