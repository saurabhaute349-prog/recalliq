import { NextResponse } from "next/server";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiFailure = { ok: false; error: string; limitReached?: boolean };

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data } satisfies ApiSuccess<T>, init);
}

export function jsonError(
  message: string,
  status = 400,
  extra?: { limitReached?: boolean },
) {
  return NextResponse.json(
    { ok: false, error: message, ...extra } satisfies ApiFailure,
    { status },
  );
}
