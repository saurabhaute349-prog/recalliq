"use server";

import { revalidatePath } from "next/cache";

import { logOnboardingDev } from "@/lib/onboarding/onboarding-dev-log";
import type {
  OnboardingChecklistKey,
  OnboardingProgress,
  OnboardingStep,
} from "@/lib/onboarding/types";
import {
  isChecklistComplete,
  ONBOARDING_CHECKLIST_KEYS,
} from "@/lib/onboarding/types";
import { getAuthenticatedUser } from "@/lib/meetings/queries";
import {
  isSchemaMismatchError,
  logSupabaseError,
} from "@/lib/supabase/errors";

export type OnboardingState = {
  completed: boolean;
  step: OnboardingStep;
  progress: OnboardingProgress;
  dismissed: boolean;
};

function parseProgress(raw: unknown): OnboardingProgress {
  if (!raw || typeof raw !== "object") return {};

  const obj = raw as Record<string, unknown>;
  const progress: OnboardingProgress = {};

  for (const key of ONBOARDING_CHECKLIST_KEYS) {
    const value = obj[key];
    if (value === true || value === "true") {
      progress[key] = true;
    }
  }

  return progress;
}

function mergeProgress(
  existing: OnboardingProgress,
  key: OnboardingChecklistKey,
): OnboardingProgress {
  return { ...existing, [key]: true };
}

export async function getOnboardingState(): Promise<OnboardingState | null> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed, onboarding_step, onboarding_progress")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    if (isSchemaMismatchError(error)) {
      logOnboardingDev("get-state:schema-missing");
      return {
        completed: false,
        step: "welcome",
        progress: {},
        dismissed: false,
      };
    }
    logSupabaseError("getOnboardingState", error);
    return null;
  }

  const progress = parseProgress(data?.onboarding_progress);
  return {
    completed: Boolean(data?.onboarding_completed),
    step: (data?.onboarding_step as OnboardingStep) ?? "welcome",
    progress,
    dismissed: Boolean(data?.onboarding_completed),
  };
}

async function updateProfileOnboarding(
  userId: string,
  patch: Record<string, unknown>,
  logContext: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await getAuthenticatedUser();

  logOnboardingDev(`${logContext}:before`, { patch });

  const { data, error } = await supabase
    .from("profiles")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("onboarding_completed, onboarding_step, onboarding_progress")
    .maybeSingle();

  if (error) {
    if (isSchemaMismatchError(error)) {
      logOnboardingDev(`${logContext}:schema-missing`, {
        code: error.code,
        message: error.message,
      });
      return { ok: false, error: "schema_missing" };
    }

    logOnboardingDev(`${logContext}:db-error`, {
      code: error.code,
      message: error.message,
    });
    logSupabaseError(logContext, error);
    return { ok: false, error: error.message };
  }

  if (!data) {
    logOnboardingDev(`${logContext}:no-row`);
    return { ok: false, error: "profile_not_found" };
  }

  logOnboardingDev(`${logContext}:after`, {
    progress: parseProgress(data.onboarding_progress),
    completed: data.onboarding_completed,
    step: data.onboarding_step,
  });

  return { ok: true };
}

export async function markOnboardingStep(
  key: OnboardingChecklistKey,
): Promise<{ ok: boolean; skipped?: boolean }> {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false };

  const { data, error: readError } = await supabase
    .from("profiles")
    .select("onboarding_completed, onboarding_step, onboarding_progress")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) {
    if (isSchemaMismatchError(readError)) {
      logOnboardingDev("mark-step:schema-missing-read", { key });
      return { ok: false, skipped: true };
    }
    logOnboardingDev("mark-step:read-failed", {
      key,
      code: readError.code,
      message: readError.message,
    });
    return { ok: false };
  }

  const currentProgress = parseProgress(data?.onboarding_progress);

  logOnboardingDev("mark-step:before", {
    key,
    progress: currentProgress,
    completed: Boolean(data?.onboarding_completed),
  });

  if (currentProgress[key] === true) {
    logOnboardingDev("mark-step:skipped-duplicate", { key, progress: currentProgress });
    return { ok: true, skipped: true };
  }

  const progress = mergeProgress(currentProgress, key);
  const completed =
    Boolean(data?.onboarding_completed) || isChecklistComplete(progress);
  const step: OnboardingStep = completed
    ? "complete"
    : ((data?.onboarding_step as OnboardingStep) ?? "welcome");

  const { data: updated, error: writeError } = await supabase
    .from("profiles")
    .update({
      onboarding_progress: progress,
      onboarding_completed: completed,
      onboarding_step: step,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("onboarding_completed, onboarding_step, onboarding_progress")
    .maybeSingle();

  if (writeError) {
    if (isSchemaMismatchError(writeError)) {
      logOnboardingDev("mark-step:schema-missing-write", {
        key,
        code: writeError.code,
        message: writeError.message,
      });
      return { ok: false };
    }
    logOnboardingDev("mark-step:db-error", {
      key,
      code: writeError.code,
      message: writeError.message,
    });
    return { ok: false };
  }

  if (!updated) {
    logOnboardingDev("mark-step:no-row-written", { key });
    return { ok: false };
  }

  const finalProgress = parseProgress(updated.onboarding_progress);

  logOnboardingDev("mark-step:success", {
    key,
    completed: Boolean(updated.onboarding_completed),
    progress: finalProgress,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return { ok: true };
}

export async function setOnboardingWizardStep(
  step: OnboardingStep,
): Promise<{ ok: boolean }> {
  const { user } = await getAuthenticatedUser();
  if (!user) return { ok: false };

  const result = await updateProfileOnboarding(
    user.id,
    { onboarding_step: step },
    "set-wizard-step",
  );

  if (result.ok) {
    revalidatePath("/dashboard");
  }

  return { ok: result.ok };
}

export async function dismissOnboarding(): Promise<{ ok: boolean }> {
  const { user } = await getAuthenticatedUser();
  if (!user) return { ok: false };

  const current = await getOnboardingState();

  const result = await updateProfileOnboarding(
    user.id,
    {
      onboarding_progress: current?.progress ?? {},
      onboarding_completed: true,
      onboarding_step: "complete",
    },
    "dismiss",
  );

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
  }

  return { ok: result.ok };
}

export async function resetOnboarding(): Promise<{ ok: boolean }> {
  const { user } = await getAuthenticatedUser();
  if (!user) return { ok: false };

  const result = await updateProfileOnboarding(
    user.id,
    {
      onboarding_completed: false,
      onboarding_step: "welcome",
      onboarding_progress: {},
    },
    "reset",
  );

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
  }

  return { ok: result.ok };
}

export async function completeOnboarding(): Promise<{ ok: boolean }> {
  const { user } = await getAuthenticatedUser();
  if (!user) return { ok: false };

  const result = await updateProfileOnboarding(
    user.id,
    {
      onboarding_completed: true,
      onboarding_step: "complete",
    },
    "complete",
  );

  if (result.ok) {
    revalidatePath("/dashboard");
    revalidatePath("/settings");
  }

  return { ok: result.ok };
}
