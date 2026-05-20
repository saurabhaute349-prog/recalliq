import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseEnv = {
  url: string;
  anonKey: string;
};

/**
 * Validates and returns public Supabase environment variables.
 * Safe to import from browser and server modules (public keys only).
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  return { url, anonKey };
}

/**
 * Creates a browser Supabase client for Client Components.
 * Uses @supabase/ssr singleton mode to avoid duplicate auth listeners.
 */
export function createClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseEnv();

  return createBrowserClient(url, anonKey, {
    isSingleton: true,
  });
}
