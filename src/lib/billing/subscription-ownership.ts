import "server-only";

type RazorpayNotes = { user_id?: string };

export type RazorpaySubscriptionWithNotes = {
  id: string;
  notes?: RazorpayNotes;
  customer_id?: string;
};

/**
 * Ensures a Razorpay subscription was created for this app user before syncing Pro.
 */
export function subscriptionBelongsToUser(
  subscription: RazorpaySubscriptionWithNotes,
  userId: string,
  profileSubscriptionId: string | null | undefined,
): boolean {
  const notesUserId = subscription.notes?.user_id?.trim();

  if (notesUserId && notesUserId !== userId) {
    return false;
  }

  if (
    profileSubscriptionId &&
    profileSubscriptionId !== subscription.id
  ) {
    return false;
  }

  return Boolean(notesUserId === userId || profileSubscriptionId === subscription.id);
}

export function subscriptionOwnershipError(): string {
  return "This subscription does not belong to your account.";
}
