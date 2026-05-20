export function logUploadDev(
  step: string,
  details?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV !== "development") return;
  console.log(
    `[upload/dev] ${step}`,
    details ? JSON.stringify(details) : "",
  );
}
