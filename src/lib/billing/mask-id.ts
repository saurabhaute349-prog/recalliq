/** Masks a subscription or customer id for display (e.g. sub_abc••••xyz1). */
export function maskBillingId(id: string | null | undefined): string {
  if (!id) return "—";
  const trimmed = id.trim();
  if (trimmed.length <= 8) {
    return "••••" + trimmed.slice(-Math.min(4, trimmed.length));
  }
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
