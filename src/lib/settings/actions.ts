"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/meetings/queries";
import {
  mergePreferences,
  parsePreferences,
} from "@/lib/settings/preferences";
import type { UserPreferences } from "@/lib/settings/types";
import { isSchemaMismatchError } from "@/lib/supabase/errors";

export type SettingsActionResult = {
  ok: boolean;
  error?: string;
};

export async function updateProfileName(
  fullName: string,
): Promise<SettingsActionResult> {
  const trimmed = fullName.trim();
  if (trimmed.length < 2) {
    return { ok: false, error: "Name must be at least 2 characters." };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: trimmed.slice(0, 120),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateAvatarUrl(
  avatarUrl: string | null,
): Promise<SettingsActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (isSchemaMismatchError(error)) {
      return { ok: false, error: "Avatar column missing. Run latest migrations." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateUserPreferences(
  patch: Partial<UserPreferences>,
): Promise<SettingsActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const current = parsePreferences(data?.preferences);
  const next = mergePreferences(current, patch);

  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (isSchemaMismatchError(error)) {
      return {
        ok: false,
        error: "Preferences column missing. Run supabase/migrations/20250522120000_profiles_preferences_storage.sql",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}

/** @deprecated Use loadSettingsData from @/lib/settings/queries */
export async function getSettingsProfile() {
  const { loadSettingsData } = await import("@/lib/settings/queries");
  return loadSettingsData();
}
