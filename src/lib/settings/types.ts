export type NotificationPreferences = {
  productUpdates?: boolean;
  aiTips?: boolean;
  billingEmails?: boolean;
  meetingReminders?: boolean;
  /** @deprecated use billingEmails */
  emailUpdates?: boolean;
  /** @deprecated use productUpdates */
  productAnnouncements?: boolean;
  /** @deprecated use aiTips */
  aiSummaries?: boolean;
};

export type UserPreferences = {
  notifications?: NotificationPreferences;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  notifications: {
    productUpdates: true,
    aiTips: true,
    billingEmails: true,
    meetingReminders: true,
  },
};
