"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, Crown, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND } from "@/lib/brand/config";
import { formatMeetingDate } from "@/lib/meetings/format";
import {
  updateAvatarUrl,
  updateProfileName,
} from "@/lib/settings/actions";
import {
  removeAvatar,
  uploadAvatar,
} from "@/lib/storage/avatar-upload";
import { cn } from "@/lib/utils";

type ProfileSettingsProps = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  userId: string;
  isPro: boolean;
  createdAt: string;
};

export function ProfileSettings({
  email,
  displayName,
  avatarUrl: initialAvatar,
  userId,
  isPro,
  createdAt,
}: ProfileSettingsProps) {
  const initialName = displayName ?? "";
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (displayName ?? email).slice(0, 2).toUpperCase();
  const dirty = name.trim() !== initialName.trim();

  const saveName = () => {
    startTransition(async () => {
      const result = await updateProfileName(name);
      if (result.ok) toast.success("Profile updated");
      else toast.error(result.error ?? "Could not save profile");
    });
  };

  const resetForm = () => {
    setName(initialName);
  };

  const onFileChange = (file: File | undefined) => {
    if (!file || !userId) return;

    startTransition(async () => {
      const upload = await uploadAvatar(userId, file);
      if (!upload.ok) {
        toast.error(upload.error);
        return;
      }

      setAvatarUrl(upload.publicUrl);
      const result = await updateAvatarUrl(upload.publicUrl);
      if (result.ok) toast.success("Avatar updated");
      else toast.error(result.error ?? "Could not save avatar URL");
    });
  };

  const onRemoveAvatar = () => {
    if (!userId) return;
    startTransition(async () => {
      await removeAvatar(userId);
      setAvatarUrl(null);
      const result = await updateAvatarUrl(null);
      if (result.ok) toast.success("Avatar removed");
      else toast.error(result.error ?? "Could not remove avatar");
    });
  };

  return (
    <section
      className="space-y-6 rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm backdrop-blur-sm sm:p-6"
      aria-labelledby="profile-settings-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="profile-settings-heading" className="text-sm font-medium">
            Profile
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Your name and avatar appear across {BRAND.name}.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
            isPro
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {isPro && <Crown className="size-3" aria-hidden />}
          {isPro ? BRAND.proPlanName : "Free plan"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative">
          <Avatar className="size-16 border border-border shadow-sm">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="" />
            ) : (
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <button
            type="button"
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-colors hover:bg-muted"
            onClick={() => fileRef.current?.click()}
            disabled={isPending || !userId}
            aria-label="Upload avatar"
          >
            {isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Camera className="size-3.5" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            JPG, PNG, or WebP · max 5MB
          </p>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-destructive hover:text-destructive"
              disabled={isPending}
              onClick={onRemoveAvatar}
            >
              <Trash2 className="size-3.5" />
              Remove avatar
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="profile-name" className="text-xs font-medium">
            Full name
          </label>
          {isPending && !name ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isPending}
              autoComplete="name"
            />
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-email" className="text-xs font-medium">
            Email
          </label>
          <Input
            id="profile-email"
            value={email}
            readOnly
            disabled
            className="bg-muted/30"
            aria-describedby="profile-email-hint"
          />
          <p id="profile-email-hint" className="text-xs text-muted-foreground">
            Email is managed by your sign-in provider and cannot be changed here.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Account created{" "}
          <time dateTime={createdAt} className="font-medium text-foreground">
            {formatMeetingDate(createdAt)}
          </time>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={saveName} disabled={isPending || !dirty}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Save changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          disabled={isPending || !dirty}
        >
          Cancel
        </Button>
      </div>
    </section>
  );
}
