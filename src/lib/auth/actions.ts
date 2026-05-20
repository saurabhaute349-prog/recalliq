"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/auth/errors";
import { sendWelcomeEmail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

export type AuthActionResult = {
  error?: string;
  message?: string;
};

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(input: {
  full_name: string;
  email: string;
  password: string;
}): Promise<AuthActionResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.full_name,
      },
    },
  });

  if (error) {
    return { error: getAuthErrorMessage(error.message) };
  }

  await sendWelcomeEmail({
    to: input.email,
    name: input.full_name,
  });

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return {
    message:
      "Account created. Check your email to confirm your address, then sign in.",
  };
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
