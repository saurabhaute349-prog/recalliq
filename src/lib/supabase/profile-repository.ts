import type { PostgrestError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeProfileRow,
  type RawProfileRow,
} from "@/lib/supabase/profile-plan";
import { isMissingColumnError, logSupabaseError } from "@/lib/supabase/errors";
import type { PlanType, Profile } from "@/types/database";

const PROFILE_SELECT_VARIANTS = [
  "id, full_name, meetings_used, razorpay_customer_id, razorpay_subscription_id, subscription_status, current_period_end, created_at, updated_at, plan_type",
  "id, full_name, meetings_used, razorpay_customer_id, razorpay_subscription_id, subscription_status, current_period_end, created_at, updated_at, plan",
  "id, full_name, meetings_used, subscription_status, current_period_end, created_at, updated_at, plan_type",
  "id, full_name, meetings_used, subscription_status, current_period_end, created_at, updated_at, plan",
  "id, full_name, meetings_used, created_at, updated_at, plan_type",
  "id, full_name, meetings_used, created_at, updated_at, plan",
  "id, full_name, meetings_used, created_at, updated_at",
] as const;

const PROFILE_PLAN_SELECT_VARIANTS = [
  "plan_type, subscription_status, current_period_end, razorpay_customer_id",
  "plan, subscription_status, current_period_end, razorpay_customer_id",
  "plan_type, subscription_status, current_period_end",
  "plan, subscription_status, current_period_end",
  "plan_type, razorpay_customer_id",
  "plan, razorpay_customer_id",
  "plan_type",
  "plan",
] as const;

type ProfileClient = SupabaseClient;

async function selectWithVariants(
  client: ProfileClient,
  userId: string,
  variants: readonly string[],
  context: string,
): Promise<{ row: RawProfileRow | null; error: PostgrestError | null }> {
  let lastError: PostgrestError | null = null;

  for (const columns of variants) {
    const { data, error } = await client
      .from("profiles")
      .select(columns)
      .eq("id", userId)
      .maybeSingle();

    if (!error) {
      return { row: (data as RawProfileRow | null) ?? null, error: null };
    }

    lastError = error;

    if (!isMissingColumnError(error)) {
      logSupabaseError(context, error);
      return { row: null, error };
    }
  }

  if (lastError) {
    logSupabaseError(context, lastError);
  }

  return { row: null, error: lastError };
}

async function selectProfileRaw(
  client: ProfileClient,
  userId: string,
  context: string,
): Promise<RawProfileRow | null> {
  const { row } = await selectWithVariants(
    client,
    userId,
    PROFILE_SELECT_VARIANTS,
    context,
  );
  return row;
}

export async function fetchProfileByUserId(
  client: ProfileClient,
  userId: string,
  context = "fetchProfileByUserId",
): Promise<Profile | null> {
  const row = await selectProfileRaw(client, userId, context);
  return normalizeProfileRow(row);
}

export async function fetchProfilePlanFields(
  client: ProfileClient,
  userId: string,
  context = "fetchProfilePlanFields",
): Promise<Pick<
  Profile,
  "plan_type" | "subscription_status" | "current_period_end" | "razorpay_customer_id"
> | null> {
  const { row } = await selectWithVariants(
    client,
    userId,
    PROFILE_PLAN_SELECT_VARIANTS,
    context,
  );
  return normalizeProfileRow(row);
}

export async function insertProfileRow(
  client: ProfileClient,
  input: {
    id: string;
    full_name: string;
    meetings_used: number;
    planType?: PlanType;
  },
  context = "insertProfileRow",
): Promise<Profile | null> {
  const planType = input.planType ?? "free";
  const base = {
    id: input.id,
    full_name: input.full_name,
    meetings_used: input.meetings_used,
  };

  let { data, error } = await client
    .from("profiles")
    .insert({ ...base, plan_type: planType })
    .select(PROFILE_SELECT_VARIANTS[0])
    .single();

  if (error && isMissingColumnError(error)) {
    ({ data, error } = await client
      .from("profiles")
      .insert({ ...base, plan: planType })
      .select(PROFILE_SELECT_VARIANTS[1])
      .single());
  }

  if (error) {
    logSupabaseError(context, error);
    return null;
  }

  return normalizeProfileRow(data as RawProfileRow);
}

const BILLING_UPDATE_VARIANTS = [
  [
    "razorpay_customer_id",
    "razorpay_subscription_id",
    "subscription_status",
    "updated_at",
  ],
  ["razorpay_customer_id", "razorpay_subscription_id", "updated_at"],
  ["subscription_status", "updated_at"],
] as const;

export class BillingSchemaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingSchemaError";
  }
}

function pickPayload(
  updates: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const key of keys) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }

  return payload;
}

export async function updateProfileByUserId(
  client: ProfileClient,
  userId: string,
  updates: Record<string, unknown>,
  context = "updateProfileByUserId",
): Promise<Profile | null> {
  const { plan_type: planType, ...rest } = updates;
  const basePayload = {
    ...rest,
    updated_at: new Date().toISOString(),
  };

  if (planType !== undefined) {
    let { data, error } = await client
      .from("profiles")
      .update({ ...basePayload, plan_type: planType })
      .eq("id", userId)
      .select(PROFILE_SELECT_VARIANTS[0])
      .single();

    if (error && isMissingColumnError(error)) {
      ({ data, error } = await client
        .from("profiles")
        .update({ ...basePayload, plan: planType })
        .eq("id", userId)
        .select(PROFILE_SELECT_VARIANTS[1])
        .single());
    }

    if (error) {
      logSupabaseError(context, error);
      throw error;
    }

    return normalizeProfileRow(data as RawProfileRow);
  }

  let lastError: PostgrestError | null = null;

  for (const keys of BILLING_UPDATE_VARIANTS) {
    const payload = pickPayload(basePayload, keys);
    if (Object.keys(payload).length <= 1) continue;

    const { error } = await client.from("profiles").update(payload).eq("id", userId);

    if (!error) {
      return fetchProfileByUserId(client, userId, `${context}/reload`);
    }

    lastError = error;

    if (!isMissingColumnError(error)) {
      logSupabaseError(context, error);
      throw error;
    }
  }

  if (lastError && isMissingColumnError(lastError)) {
    throw new BillingSchemaError(
      "Billing columns are missing on profiles. Run supabase/migrations/20250517000000_profiles_billing.sql in the Supabase SQL editor, then retry checkout.",
    );
  }

  if (lastError) {
    logSupabaseError(context, lastError);
    throw lastError;
  }

  return fetchProfileByUserId(client, userId, `${context}/reload`);
}
