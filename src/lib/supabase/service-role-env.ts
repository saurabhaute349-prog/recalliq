import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadEnvConfig } from "@next/env";

let envLoaded = false;

function parseEnvFile(contents: string): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    vars[key] = value;
  }

  return vars;
}

function readEnvLocalFile(): Record<string, string> {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};

  return parseEnvFile(readFileSync(envPath, "utf8"));
}

function ensureEnvLoaded() {
  if (envLoaded) return;
  loadEnvConfig(process.cwd());
  envLoaded = true;
}

function readServiceRoleFromEnv(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim() ||
    undefined
  );
}

/** Service role key for server-side billing. */
export function getServiceRoleKey(): string {
  ensureEnvLoaded();

  let key = readServiceRoleFromEnv();

  if (!key && process.env.NODE_ENV === "development") {
    const fromFile = readEnvLocalFile();
    key =
      fromFile.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
      fromFile.SUPABASE_SECRET_KEY?.trim();

    if (key) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = key;
    }
  }

  if (!key) {
    const envPath = resolve(process.cwd(), ".env.local");
    const hasEmptyLine =
      existsSync(envPath) &&
      readFileSync(envPath, "utf8").includes("SUPABASE_SERVICE_ROLE_KEY=");

    throw new Error(
      hasEmptyLine
        ? "SUPABASE_SERVICE_ROLE_KEY is empty in .env.local. Paste your secret key on that line, save the file (Ctrl+S), then restart npm run dev."
        : "SUPABASE_SERVICE_ROLE_KEY is missing. Add it to .env.local (Supabase → Project Settings → API), save the file, then restart npm run dev.",
    );
  }

  return key;
}

export function getSupabaseProjectUrl(): string {
  ensureEnvLoaded();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  return url;
}
