"use client";

import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export type AvatarUploadResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image."));
    };
    img.src = url;
  });
}

async function compressImage(file: File, maxSize = 512): Promise<Blob> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not compress image."));
        else resolve(blob);
      },
      file.type === "image/png" ? "image/png" : "image/jpeg",
      0.85,
    );
  });
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<AvatarUploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: "Use JPG, PNG, or WebP." };
  }

  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image must be under 5MB." };
  }

  try {
    const blob = await compressImage(file);
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${userId}/avatar.${ext}`;

    const supabase = createClient();
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, {
        upsert: true,
        contentType: blob.type,
        cacheControl: "3600",
      });

    if (error) {
      return { ok: false, error: error.message };
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    return { ok: true, publicUrl };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Upload failed.",
    };
  }
}

export async function removeAvatar(userId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createClient();
  const { data: list } = await supabase.storage.from("avatars").list(userId);

  if (list?.length) {
    const paths = list.map((item) => `${userId}/${item.name}`);
    const { error } = await supabase.storage.from("avatars").remove(paths);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}
