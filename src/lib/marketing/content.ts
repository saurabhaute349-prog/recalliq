import type { LucideIcon } from "lucide-react";
import {
  Brain,
  MessageSquare,
  Search,
  Sparkles,
  Target,
  Users,
  Zap,
} from "lucide-react";

export const MARKETING_STATS = [
  { label: "Transcripts processed", value: "12k+" },
  { label: "Questions answered", value: "48k+" },
  { label: "Teams onboarded", value: "320+" },
] as const;

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload transcript",
    description:
      "Drop .txt, PDF, DOCX, or subtitles from Zoom, Meet, Otter, or Fireflies.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "AI extracts intelligence",
    description:
      "Action items, decisions, blockers, and people—structured from the conversation.",
    icon: Brain,
  },
  {
    step: "03",
    title: "Ask questions forever",
    description:
      "Chat with the meeting like a colleague who remembers every detail.",
    icon: MessageSquare,
  },
] as const;

export type MarketingFeature = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  bullets: string[];
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    id: "memory",
    title: "AI Meeting Memory",
    description:
      "Turn transcripts into durable, searchable memory your team can return to weeks later.",
    icon: Brain,
    bullets: ["Persistent summaries", "Participant tracking", "Context that compounds"],
  },
  {
    id: "chat",
    title: "Ask Questions About Any Meeting",
    description:
      "Plain-language questions with answers grounded in what people actually said.",
    icon: MessageSquare,
    bullets: ["Speaker-aware replies", "Follow-up threads", "No generic fluff"],
  },
  {
    id: "actions",
    title: "Extract Action Items Automatically",
    description:
      "Owners, deadlines, and blockers pulled from dialogue—not buried in bullet noise.",
    icon: Target,
    bullets: ["Structured action items", "Deadline detection", "Blocker highlights"],
  },
  {
    id: "search",
    title: "Search Across All Conversations",
    description:
      "One search bar across every meeting you have stored. Like Google for spoken context.",
    icon: Search,
    bullets: ["Full-text search", "Command palette", "Instant snippets"],
  },
  {
    id: "intelligence",
    title: "Smart Meeting Intelligence",
    description:
      "People, companies, risks, and priorities—extracted and ready for your dashboard.",
    icon: Zap,
    bullets: ["Entity extraction", "Smart suggestions", "Meeting-type detection"],
  },
  {
    id: "knowledge",
    title: "Team Knowledge Base",
    description:
      "Organize, pin, favorite, and archive meetings as your company memory grows.",
    icon: Users,
    bullets: ["Pin & favorites", "Categories", "Demo onboarding flow"],
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "We stopped rewatching recordings. Recalliq answers who said what in seconds.",
    name: "Priya N.",
    role: "Product Manager",
    company: "Northline",
  },
  {
    quote:
      "Action items land in our standups without someone retyping the transcript.",
    name: "Marcus T.",
    role: "Founder",
    company: "Helix Labs",
  },
  {
    quote:
      "Search across six months of client calls changed how our agency onboards.",
    name: "Elena R.",
    role: "Agency Lead",
    company: "Studio K",
  },
] as const;

export const LOGO_PLACEHOLDERS = [
  "Northline",
  "Helix Labs",
  "Studio K",
  "Parcel",
  "Waypoint",
  "Aster",
] as const;

export const FAQ_ITEMS = [
  {
    q: "What file formats do you support?",
    a: ".txt, .pdf, .docx, .srt, and .vtt—including exports from Zoom, Google Meet, Otter, and Fireflies.",
  },
  {
    q: "Is my data private?",
    a: "Meetings are stored in your Supabase project with row-level security. Only you can access your transcripts.",
  },
  {
    q: "How does the free plan work?",
    a: "Free includes 3 meetings per month with full AI chat. Upgrade to Pro for unlimited meetings and questions.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel from billing settings. You keep access through the end of your billing period.",
  },
] as const;

export const PRICING_PLANS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "",
    description: "For individuals exploring AI meeting memory.",
    features: [
      "3 meetings per month",
      "Full transcript chat",
      "Intelligence extraction",
      "Global search",
    ],
    cta: "Get Started Free",
    href: "/signup",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For teams who live in meetings and need recall on demand.",
    features: [
      "Unlimited meetings",
      "Unlimited AI questions",
      "Priority responses",
      "Pin, favorite & organize",
      "Export-ready memory",
    ],
    cta: "Upgrade to Pro",
    href: "/signup",
    highlighted: true,
    badge: "Most Popular",
  },
] as const;

export const COMPARISON_ROWS = [
  { feature: "Meetings per month", free: "3", pro: "Unlimited" },
  { feature: "AI questions", free: "Limited per meeting", pro: "Unlimited" },
  { feature: "Intelligence extraction", free: true, pro: true },
  { feature: "Global search", free: true, pro: true },
  { feature: "Command palette", free: true, pro: true },
  { feature: "Priority AI", free: false, pro: true },
  { feature: "Organization tools", free: "Basic", pro: "Full" },
] as const;
