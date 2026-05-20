"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedUser } from "@/lib/meetings/queries";
import type { MeetingCategoryId } from "@/lib/meetings/organization";

export type OrgActionResult = { error?: string; ok?: boolean };

async function updateMeetingField(
  meetingId: string,
  patch: Record<string, unknown>,
): Promise<OrgActionResult> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("meetings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", meetingId)
    .eq("user_id", user.id);

  if (error) return { error: "Could not update meeting." };

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${meetingId}`);
  revalidatePath("/dashboard");

  return { ok: true };
}

export async function toggleMeetingPinned(meetingId: string, pinned: boolean) {
  return updateMeetingField(meetingId, { pinned });
}

export async function toggleMeetingFavorite(meetingId: string, favorite: boolean) {
  return updateMeetingField(meetingId, { favorite });
}

export async function toggleMeetingArchived(meetingId: string, archived: boolean) {
  return updateMeetingField(meetingId, { archived });
}

export async function setMeetingCategory(
  meetingId: string,
  category: MeetingCategoryId,
) {
  return updateMeetingField(meetingId, { category });
}
