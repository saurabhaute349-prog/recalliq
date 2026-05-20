import { logSupabaseError } from "@/lib/supabase/errors";
import { getAuthenticatedUser } from "@/lib/meetings/queries";
import { fetchProfileByUserId } from "@/lib/supabase/profile-repository";
import type { Profile } from "@/types/database";

export async function getUserProfileForBilling(): Promise<Profile | null> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  return fetchProfileByUserId(supabase, user.id, "getUserProfileForBilling");
}

export async function countUserAiMessages(userId: string): Promise<number> {
  const { supabase } = await getAuthenticatedUser();

  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user");

  if (error) {
    logSupabaseError("countUserAiMessages", error);
    return 0;
  }

  return count ?? 0;
}
