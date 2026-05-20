"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { RecalliqLogo } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  footer: ReactNode;
  trustMessage?: string;
};

export function AuthShell({
  children,
  title,
  description,
  footer,
  trustMessage = "Your meeting memory stays private. We never train on your transcripts without permission.",
}: AuthShellProps) {
  return (
    <div className="flex min-h-[calc(100dvh-1px)] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center transition-opacity hover:opacity-80"
        >
          <RecalliqLogo size="sm" />
        </Link>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-6">{footer}</div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
          {trustMessage}
        </p>
      </div>
    </div>
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export function AuthField({ id, label, error, children }: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <Separator />
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
        or
      </span>
    </div>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

type GoogleAuthButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
};

export function GoogleAuthButton({
  disabled,
  loading,
  onClick,
}: GoogleAuthButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-10 w-full"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <GoogleIcon className="size-4" />
      )}
      Continue with Google
    </Button>
  );
}

type SubmitButtonProps = {
  children: ReactNode;
  loading?: boolean;
  className?: string;
};

export function AuthSubmitButton({
  children,
  loading,
  className,
}: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      className={cn("h-10 w-full", className)}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Please wait
        </>
      ) : (
        children
      )}
    </Button>
  );
}
