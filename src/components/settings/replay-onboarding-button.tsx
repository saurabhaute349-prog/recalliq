"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { resetOnboarding } from "@/lib/onboarding/actions";

export function ReplayOnboardingButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start gap-2"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await resetOnboarding();
          toast.success("Onboarding tour will show on your next visit to the dashboard.");
          router.push("/dashboard");
          router.refresh();
        });
      }}
    >
      <RotateCcw className="size-4" />
      Replay onboarding tour
    </Button>
  );
}
