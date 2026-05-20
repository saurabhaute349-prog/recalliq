"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  ChevronRight,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { RecalliqLogo } from "@/components/brand";
import { BRAND } from "@/lib/brand/config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassCard } from "@/components/ui/premium/glass-card";
import { createDemoMeeting } from "@/lib/demo/create-demo-meeting";
import {
  completeOnboarding,
  dismissOnboarding,
  setOnboardingWizardStep,
} from "@/lib/onboarding/actions";
import {
  countCompletedSteps,
  ONBOARDING_CHECKLIST_KEYS,
  type OnboardingProgress,
  type OnboardingStep,
} from "@/lib/onboarding/types";
import { fadeIn } from "@/lib/motion";
import { cn } from "@/lib/utils";

const CHECKLIST_LABELS: Record<(typeof ONBOARDING_CHECKLIST_KEYS)[number], string> = {
  uploadTranscript: "Upload your first transcript",
  askQuestion: "Ask your first AI question",
  openSearch: "Try global search",
  visitDashboard: "Explore your dashboard",
  visitBilling: "View upgrade options",
};

type OnboardingWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: OnboardingStep;
  progress: OnboardingProgress;
};

export function OnboardingWizard({
  open,
  onOpenChange,
  step: initialStep,
  progress,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [isPending, startTransition] = useTransition();

  const completedCount = countCompletedSteps(progress);

  const goToStep = (next: OnboardingStep) => {
    setStep(next);
    void setOnboardingWizardStep(next);
  };

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissOnboarding();
      onOpenChange(false);
      toast.success("Onboarding dismissed. Replay anytime from Settings.");
    });
  };

  const handleTryDemo = () => {
    startTransition(async () => {
      const result = await createDemoMeeting();
      if (result?.error) {
        toast.error(result.error);
      }
    });
  };

  const handleFinish = () => {
    startTransition(async () => {
      await completeOnboarding();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <RecalliqLogo size="sm" />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleDismiss}
              aria-label="Dismiss onboarding"
            >
              <X className="size-4" />
            </Button>
          </div>
          <DialogTitle className="mt-4 text-left text-xl">
            Welcome to {BRAND.name}
          </DialogTitle>
          <DialogDescription className="text-left">
            Turn meeting transcripts into searchable AI memory in minutes.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div key="welcome" {...fadeIn} className="space-y-4 px-6 py-5">
              <GlassCard>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Paste or upload a transcript, then ask questions grounded in what
                  was actually said — action items, decisions, owners, and more.
                </p>
              </GlassCard>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => goToStep("demo")}>
                  Get started
                  <ChevronRight className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleDismiss}
                  disabled={isPending}
                >
                  Skip tour
                </Button>
              </div>
            </motion.div>
          )}

          {step === "demo" && (
            <motion.div key="demo" {...fadeIn} className="space-y-4 px-6 py-5">
              <GlassCard className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="size-4 text-primary" />
                  Try Demo Meeting
                </p>
                <p className="text-sm text-muted-foreground">
                  Explore a realistic product sync with pre-loaded AI answers, action
                  items, and smart suggestions — no upload required.
                </p>
              </GlassCard>
              <Button
                className="w-full"
                onClick={handleTryDemo}
                disabled={isPending}
              >
                {isPending ? "Creating demo…" : "Open demo meeting"}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => goToStep("upload")}
              >
                I&apos;ll upload my own transcript
              </Button>
            </motion.div>
          )}

          {step === "upload" && (
            <motion.div key="upload" {...fadeIn} className="space-y-4 px-6 py-5">
              <GlassCard className="flex items-start gap-3">
                <Upload className="mt-0.5 size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Upload your first transcript</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Supports TXT, PDF, DOCX, SRT, and VTT from Zoom, Meet, or Otter.
                  </p>
                </div>
              </GlassCard>
              <Button className="w-full" asChild>
                <Link href="/new" onClick={() => onOpenChange(false)}>
                  Go to upload
                </Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => goToStep("checklist")}>
                Continue
              </Button>
            </motion.div>
          )}

          {step === "checklist" && (
            <motion.div key="checklist" {...fadeIn} className="space-y-4 px-6 py-5">
              <p className="text-sm text-muted-foreground">
                {completedCount} of {ONBOARDING_CHECKLIST_KEYS.length} complete
              </p>
              <ul className="space-y-2">
                {ONBOARDING_CHECKLIST_KEYS.map((key) => {
                  const done = Boolean(progress[key]);
                  return (
                    <li
                      key={key}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                        done
                          ? "border-primary/20 bg-primary/5"
                          : "border-border bg-muted/20",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 items-center justify-center rounded-full border",
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : null}
                      </span>
                      {CHECKLIST_LABELS[key]}
                    </li>
                  );
                })}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <Link href="/search" onClick={() => onOpenChange(false)}>
                    <Search className="size-4" />
                    Search
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/billing" onClick={() => onOpenChange(false)}>
                    Upgrade
                  </Link>
                </Button>
              </div>
              <Button className="w-full" onClick={handleFinish}>
                Finish setup
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
