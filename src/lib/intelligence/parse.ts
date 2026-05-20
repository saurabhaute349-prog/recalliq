import type {
  IntelligenceActionItem,
  MeetingIntelligence,
  MeetingType,
} from "@/types/database";

type RawIntelligence = {
  people?: unknown;
  companies?: unknown;
  action_items?: unknown;
  blockers?: unknown;
  deadlines?: unknown;
  decisions?: unknown;
  risks?: unknown;
  product_names?: unknown;
  priorities?: unknown;
  meeting_type?: unknown;
  summary?: unknown;
};

function asStringArray(value: unknown, max = 20): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function asActionItems(value: unknown): IntelligenceActionItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const task = typeof row.task === "string" ? row.task.trim() : "";
      if (!task) return null;
      return {
        task: task.slice(0, 300),
        owner:
          typeof row.owner === "string" && row.owner.trim()
            ? row.owner.trim().slice(0, 80)
            : null,
        deadline:
          typeof row.deadline === "string" && row.deadline.trim()
            ? row.deadline.trim().slice(0, 80)
            : null,
      };
    })
    .filter((item): item is IntelligenceActionItem => item !== null)
    .slice(0, 15);
}

function normalizeMeetingType(value: unknown): MeetingType {
  const raw = typeof value === "string" ? value.toLowerCase() : "general";
  const allowed: MeetingType[] = [
    "sales",
    "standup",
    "interview",
    "product",
    "customer_call",
    "general",
  ];
  return allowed.includes(raw as MeetingType) ? (raw as MeetingType) : "general";
}

export function parseIntelligenceJson(raw: string): Partial<MeetingIntelligence> | null {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(cleaned) as RawIntelligence;

    return {
      people: asStringArray(parsed.people),
      companies: asStringArray(parsed.companies),
      action_items: asActionItems(parsed.action_items),
      blockers: asStringArray(parsed.blockers),
      deadlines: asStringArray(parsed.deadlines),
      decisions: asStringArray(parsed.decisions),
      risks: asStringArray(parsed.risks),
      product_names: asStringArray(parsed.product_names),
      priorities: asStringArray(parsed.priorities),
      meeting_type: normalizeMeetingType(parsed.meeting_type),
      summary:
        typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 2000) : null,
      suggested_questions: [],
    };
  } catch {
    return null;
  }
}
