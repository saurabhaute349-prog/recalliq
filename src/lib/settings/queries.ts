import { countUserAiMessages } from "@/lib/billing/queries";
import { getAuthenticatedUser, getUserProfile } from "@/lib/meetings/queries";
import { parsePreferences } from "@/lib/settings/preferences";
import { DEFAULT_PREFERENCES } from "@/lib/settings/types";
import { isMissingColumnError, logSupabaseError } from "@/lib/supabase/errors";
import type { Profile } from "@/types/database";

export type SettingsProfileData = {
  user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>["user"]>;
  profile: Profile;
  preferences: ReturnType<typeof parsePreferences>;
  aiMessagesUsed: number;
};

/**
 * Loads settings data with column fallbacks so missing migrations never blank the page.
 */
export async function loadSettingsData(): Promise<SettingsProfileData | null> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const profile = await getUserProfile();
  if (!profile) {
    return null;
  }

  let merged: Profile = { ...profile };
  let preferences = DEFAULT_PREFERENCES;

  const { data: avatarRow, error: avatarError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!avatarError && avatarRow) {
    merged = {
      ...merged,
      avatar_url: (avatarRow as { avatar_url?: string | null }).avatar_url ?? null,
    };
  } else if (avatarError && !isMissingColumnError(avatarError)) {
    logSupabaseError("loadSettingsData/avatar", avatarError);
  }

  const { data: prefsRow, error: prefsError } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (!prefsError && prefsRow) {
    preferences = parsePreferences(
      (prefsRow as { preferences?: unknown }).preferences,
    );
  } else if (prefsError && !isMissingColumnError(prefsError)) {
    logSupabaseError("loadSettingsData/preferences", prefsError);
  }

  const aiMessagesUsed = await countUserAiMessages(user.id);

  return {
    user,
    profile: merged,
    preferences,
    aiMessagesUsed,
  };
}
