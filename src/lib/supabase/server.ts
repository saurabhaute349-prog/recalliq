import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/client";

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers.
 *
 * Always create a new client per request — never cache or share across requests.
 * Cookie writes may throw in Server Components; session refresh should run in middleware.
 */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll can fail in Server Components when cookies are read-only.
          // Middleware is responsible for persisting refreshed sessions.
        }
      },
    },
  });
}
