"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  variant?: "ghost" | "outline";
  showLabel?: boolean;
};

function LogoutSubmit({
  showLabel,
  variant,
  className,
}: Omit<LogoutButtonProps, "className"> & { className?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={showLabel ? "sm" : "icon-sm"}
      className={cn(
        showLabel ? "w-full justify-start gap-2 text-muted-foreground" : "",
        className,
      )}
      disabled={pending}
    >
      <LogOut className={cn("size-4", pending && "animate-pulse")} />
      {showLabel ? (pending ? "Signing out…" : "Sign out") : null}
      {!showLabel ? <span className="sr-only">Sign out</span> : null}
    </Button>
  );
}

export function LogoutButton({
  className,
  variant = "ghost",
  showLabel = true,
}: LogoutButtonProps) {
  return (
    <form action={logout} className={className}>
      <LogoutSubmit showLabel={showLabel} variant={variant} />
    </form>
  );
}
