import { getPublicAppUrl } from "@/lib/env/public";

export function getOAuthCallbackUrl(next = "/dashboard"): string {
  const url = new URL("/auth/callback", getPublicAppUrl());
  url.searchParams.set("next", next);
  return url.toString();
}
