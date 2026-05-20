import { NextResponse } from "next/server";

import { getOAuthErrorMessage } from "@/lib/auth/oauth-errors";
import { getAppBaseUrl } from "@/lib/email/urls";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appUrl = getAppBaseUrl();
  const next = safeNextPath(requestUrl.searchParams.get("next"));
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, appUrl));
    }
  }

  const loginUrl = new URL("/login", appUrl);
  const oauthError =
    requestUrl.searchParams.get("error_description") ??
    requestUrl.searchParams.get("error");

  loginUrl.searchParams.set(
    "error",
    getOAuthErrorMessage(
      oauthError ?? "Could not sign in with Google. Please try again.",
    ),
  );

  return NextResponse.redirect(loginUrl);
}
