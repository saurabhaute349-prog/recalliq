import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getServiceRoleKey,
  getSupabaseProjectUrl,
} from "@/lib/supabase/service-role-env";

/**
 * Service-role client for trusted server operations (billing verification).
 * Never import this module from client components.
 */
export function createAdminClient() {
  return createClient(getSupabaseProjectUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
