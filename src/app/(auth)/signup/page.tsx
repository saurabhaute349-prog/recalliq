"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  AuthDivider,
  AuthField,
  AuthShell,
  AuthSubmitButton,
  GoogleAuthButton,
} from "@/components/auth/auth-ui";
import { useGoogleAuth } from "@/hooks/use-google-auth";
import { signup } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const signupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { handleGoogleSignIn, isGoogleLoading } = useGoogleAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setAuthError(null);
    setAuthMessage(null);

    const result = await signup({
      full_name: values.name,
      email: values.email,
      password: values.password,
    });

    if (result?.error) {
      setAuthError(result.error);
      toast.error(result.error);
      return;
    }

    if (result?.message) {
      setAuthMessage(result.message);
      toast.success(result.message);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Start turning meetings into memory you can search and trust."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {authError ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {authError}
          </p>
        ) : null}

        {authMessage ? (
          <p
            className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-foreground"
            role="status"
          >
            {authMessage}
          </p>
        ) : null}

        <AuthField id="name" label="Full name" error={errors.name?.message}>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Morgan"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={cn("h-10", errors.name && "border-destructive")}
            {...register("name")}
          />
        </AuthField>

        <AuthField id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={cn("h-10", errors.email && "border-destructive")}
            {...register("email")}
          />
        </AuthField>

        <AuthField
          id="password"
          label="Password"
          error={errors.password?.message}
        >
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn("h-10", errors.password && "border-destructive")}
            {...register("password")}
          />
        </AuthField>

        <AuthSubmitButton loading={isSubmitting}>
          Create account
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <GoogleAuthButton
        disabled={isSubmitting}
        loading={isGoogleLoading}
        onClick={handleGoogleSignIn}
      />
    </AuthShell>
  );
}
