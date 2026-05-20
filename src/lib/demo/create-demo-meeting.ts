"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isNextRedirectError } from "@/lib/api/errors";
import {
  DEMO_CHAT_EXAMPLES,
  DEMO_INTELLIGENCE,
  DEMO_MEETING_TITLE,
  DEMO_SUMMARY,
  DEMO_TRANSCRIPT,
} from "@/lib/demo/meeting-data";
import { logOnboardingDev } from "@/lib/onboarding/onboarding-dev-log";
import { markOnboardingStep } from "@/lib/onboarding/actions";
import { persistMeetingIntelligence } from "@/lib/intelligence/persist";
import { getAuthenticatedUser } from "@/lib/meetings/queries";
import { logMeetingDev } from "@/lib/meetings/meeting-dev-log";
import { isMissingColumnError } from "@/lib/supabase/errors";

export type DemoMeetingResult = { error?: string; meetingId?: string };

export async function createDemoMeeting(): Promise<DemoMeetingResult> {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    if (!user) {
      return { error: "You must be signed in." };
    }

    let existingId: string | null = null;

    const { data: existingDemo, error: demoLookupError } = await supabase
      .from("meetings")
      .select("id")
      .eq("user_id", user.id)
      .eq("is_demo", true)
      .maybeSingle();

    if (!demoLookupError && existingDemo?.id) {
      existingId = existingDemo.id;
    } else if (demoLookupError && isMissingColumnError(demoLookupError)) {
      const { data: byTitle } = await supabase
        .from("meetings")
        .select("id")
        .eq("user_id", user.id)
        .eq("title", DEMO_MEETING_TITLE)
        .maybeSingle();
      existingId = byTitle?.id ?? null;
    }

    if (existingId) {
      logOnboardingDev("demo:existing", { meetingId: existingId });
      redirect(`/meetings/${existingId}`);
    }

    const meetingId = randomUUID();
    const now = new Date().toISOString();

    const corePayload: Record<string, unknown> = {
      id: meetingId,
      user_id: user.id,
      title: DEMO_MEETING_TITLE,
      transcript: DEMO_TRANSCRIPT,
      summary: DEMO_SUMMARY,
      participant_count: 4,
      message_count: DEMO_CHAT_EXAMPLES.length,
      is_demo: true,
      category: "product",
      upload_type: "demo",
      pinned: true,
    };

    const { error: insertError } = await supabase.from("meetings").insert(corePayload);

    if (insertError) {
      if (isMissingColumnError(insertError)) {
        const { error: fallbackError } = await supabase.from("meetings").insert({
          id: meetingId,
          user_id: user.id,
          title: DEMO_MEETING_TITLE,
          transcript: DEMO_TRANSCRIPT,
          summary: DEMO_SUMMARY,
          participant_count: 4,
          message_count: DEMO_CHAT_EXAMPLES.length,
        });

        if (fallbackError) {
          return { error: "Could not create demo meeting." };
        }
      } else {
        return { error: "Could not create demo meeting." };
      }
    }

    for (const message of DEMO_CHAT_EXAMPLES) {
      await supabase.from("chat_messages").insert({
        id: randomUUID(),
        meeting_id: meetingId,
        user_id: user.id,
        role: message.role,
        content: message.content,
        created_at: now,
      });
    }

    await persistMeetingIntelligence(supabase, {
      meetingId,
      userId: user.id,
      data: DEMO_INTELLIGENCE,
    });

    await markOnboardingStep("uploadTranscript");
    await markOnboardingStep("askQuestion");

    logMeetingDev("demo:created", { meetingId });

    revalidatePath("/meetings");
    revalidatePath("/dashboard");

    redirect(`/meetings/${meetingId}`);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create demo meeting.",
    };
  }
}
