"use client";

import { toast } from "sonner";

import { getOAuthErrorMessage } from "@/lib/auth/oauth-errors";
import { getOAuthCallbackUrl } from "@/lib/auth/oauth-urls";
import { createClient } from "@/lib/supabase/client";

export async function signInWithGoogle(): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getOAuthCallbackUrl("/dashboard"),
    },
  });

  if (error) {
    const message = getOAuthErrorMessage(error.message);
    toast.error(message);
    return { error: message };
  }

  return {};
}
