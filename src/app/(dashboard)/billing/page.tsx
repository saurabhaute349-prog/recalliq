import { redirect } from "next/navigation";

import { BillingView } from "@/components/billing/billing-view";
import { hasProAccess } from "@/lib/billing/plan";
import {
  countUserAiMessages,
  getUserProfileForBilling,
} from "@/lib/billing/queries";
import { getAuthenticatedUser } from "@/lib/meetings/queries";

export default async function BillingPage() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, aiMessagesUsed] = await Promise.all([
    getUserProfileForBilling(),
    countUserAiMessages(user.id),
  ]);

  const meetingsUsed = profile?.meetings_used ?? 0;
  const isPro = hasProAccess(profile);

  return (
    <BillingView
      profile={profile}
      meetingsUsed={meetingsUsed}
      aiMessagesUsed={aiMessagesUsed}
      isPro={isPro}
    />
  );
}
