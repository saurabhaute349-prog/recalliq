import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export async function getUserEmailAndName(userId: string): Promise<{
  email: string | null;
  name: string;
}> {
  const admin = createAdminClient();

  const [{ data: authData }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  return {
    email: authData.user?.email ?? null,
    name: profile?.full_name?.trim() || "there",
  };
}
