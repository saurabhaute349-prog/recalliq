const LOCAL_APP_URL = "http://localhost:3000";

function normalizeOrigin(url: string): string {
  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  const { protocol, host } = new URL(withProtocol);
  return `${protocol}//${host}`;
}

function isLocalHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

export function isLocalOrigin(url: string): boolean {
  try {
    const { hostname } = new URL(
      url.startsWith("http") ? url : `http://${url}`,
    );
    return isLocalHostname(hostname);
  } catch {
    return false;
  }
}

/** True when the app must not use tunnel/production URLs (local SaaS testing). */
export function isLocalhostOnlyMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_LOCALHOST_ONLY === "true" ||
    process.env.LOCALHOST_ONLY === "true"
  );
}

export function isLocalDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Canonical app origin for redirects, OAuth callbacks, and email links.
 * Defaults to http://localhost:3000 in development.
 */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) {
    if (
      isLocalhostOnlyMode() &&
      !isLocalOrigin(explicit) &&
      explicit.includes("ngrok")
    ) {
      return LOCAL_APP_URL;
    }

    return normalizeOrigin(explicit);
  }

  if (isLocalDevelopment() || isLocalhostOnlyMode()) {
    return LOCAL_APP_URL;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return normalizeOrigin(vercel.startsWith("http") ? vercel : `https://${vercel}`);
  }

  return LOCAL_APP_URL;
}

/**
 * Razorpay webhooks require a public URL. On localhost, Pro activation uses
 * POST /api/billing/verify after checkout instead.
 */
export function shouldSkipRazorpayWebhooks(): boolean {
  if (process.env.NODE_ENV !== "development") {
    return false;
  }

  if (process.env.ENABLE_RAZORPAY_WEBHOOKS === "true") {
    return false;
  }

  return true;
}
