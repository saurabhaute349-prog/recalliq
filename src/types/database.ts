export type PlanType = "free" | "pro";

export type SubscriptionStatus =
  | "created"
  | "authenticated"
  | "active"
  | "pending"
  | "halted"
  | "cancelled"
  | "completed"
  | "expired";

export type Profile = {
  id: string;
  full_name: string | null;
  meetings_used: number;
  plan_type: PlanType;
  razorpay_customer_id: string | null;
  razorpay_subscription_id: string | null;
  subscription_status: SubscriptionStatus | null;
  current_period_end: string | null;
  avatar_url?: string | null;
  preferences?: Record<string, unknown> | null;
  onboarding_completed?: boolean;
  onboarding_step?: string | null;
  onboarding_progress?: Record<string, boolean> | null;
  created_at: string;
  updated_at: string;
};

export type UploadType =
  | "paste"
  | "txt"
  | "pdf"
  | "docx"
  | "srt"
  | "vtt"
  | "zoom"
  | "meet"
  | "otter"
  | "fireflies"
  | "audio";

export type MeetingCategory =
  | "sales"
  | "standup"
  | "interview"
  | "product"
  | "support"
  | "customer_call"
  | "general";

export type Meeting = {
  id: string;
  user_id: string;
  title: string;
  transcript: string;
  summary: string | null;
  participant_count: number;
  message_count: number;
  original_filename: string | null;
  upload_type: UploadType | string | null;
  transcript_raw: string | null;
  duration_seconds: number | null;
  uploaded_at: string | null;
  category?: MeetingCategory | string | null;
  archived?: boolean;
  pinned?: boolean;
  favorite?: boolean;
  is_demo?: boolean;
  created_at: string;
  updated_at: string;
};

export type MeetingCreateMetadata = {
  title?: string | null;
  originalFilename?: string | null;
  uploadType?: UploadType | string | null;
  transcriptRaw?: string | null;
  durationSeconds?: number | null;
  participantCount?: number | null;
};

export type ChatMessage = {
  id: string;
  meeting_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export type MeetingListItem = Pick<
  Meeting,
  | "id"
  | "title"
  | "summary"
  | "participant_count"
  | "message_count"
  | "created_at"
  | "category"
  | "archived"
  | "pinned"
  | "favorite"
  | "is_demo"
>;

export type MeetingDetail = Meeting;

export type BillingEventType =
  | "subscription_activated"
  | "payment_captured"
  | "renewal_success"
  | "payment_failed"
  | "subscription_cancelled";

export type BillingEventStatus =
  | "received"
  | "captured"
  | "failed"
  | "cancelled"
  | "active"
  | string;

export type MeetingType =
  | "sales"
  | "standup"
  | "interview"
  | "product"
  | "customer_call"
  | "general";

export type IntelligenceActionItem = {
  task: string;
  owner: string | null;
  deadline: string | null;
};

export type MeetingIntelligence = {
  id: string;
  meeting_id: string;
  user_id: string;
  people: string[];
  companies: string[];
  action_items: IntelligenceActionItem[];
  blockers: string[];
  deadlines: string[];
  decisions: string[];
  risks: string[];
  product_names: string[];
  priorities: string[];
  summary: string | null;
  suggested_questions: string[];
  meeting_type: MeetingType | string | null;
  created_at: string;
  updated_at: string;
};

export type MeetingTag = {
  id: string;
  meeting_id: string;
  user_id: string;
  tag: string;
  created_at: string;
};

export type FavoriteMeeting = {
  id: string;
  user_id: string;
  meeting_id: string;
  created_at: string;
};

export type BillingEvent = {
  id: string;
  user_id: string;
  type: BillingEventType;
  amount: number | null;
  currency: string;
  status: BillingEventStatus;
  razorpay_event_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};
