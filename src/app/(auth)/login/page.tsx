"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import { login } from "@/lib/auth/actions";
import { getOAuthErrorMessage } from "@/lib/auth/oauth-errors";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { handleGoogleSignIn, isGoogleLoading } = useGoogleAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const oauthError = new URLSearchParams(window.location.search).get("error");
    if (!oauthError) {
      return;
    }

    const message = getOAuthErrorMessage(oauthError);
    setAuthError(message);
    toast.error(message);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);

    const result = await login(values);

    if (result?.error) {
      setAuthError(result.error);
      toast.error(result.error);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to access your meeting memory."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New to Recalliq?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create an account
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
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={cn("h-10", errors.password && "border-destructive")}
            {...register("password")}
          />
        </AuthField>

        <AuthSubmitButton loading={isSubmitting}>Sign in</AuthSubmitButton>
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
