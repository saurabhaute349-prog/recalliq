/** Client-safe localhost origin for OAuth redirect construction. */
export const LOCAL_APP_URL = "http://localhost:3000";

function normalizeOrigin(url: string): string {
  const withProtocol = url.startsWith("http") ? url : `https://${url}`;
  const { protocol, host } = new URL(withProtocol);
  return `${protocol}//${host}`;
}

/**
 * Canonical public origin for OAuth redirects and metadata.
 * Prefer NEXT_PUBLIC_APP_URL in production; falls back to browser origin on the client.
 */
export function getPublicAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) {
    try {
      return normalizeOrigin(explicit);
    } catch {
      return LOCAL_APP_URL;
    }
  }

  if (process.env.NEXT_PUBLIC_LOCALHOST_ONLY === "true") {
    return LOCAL_APP_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return normalizeOrigin(vercel);
  }

  return LOCAL_APP_URL;
}
