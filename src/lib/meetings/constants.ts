export const FREE_PLAN_MEETING_LIMIT = 3;

export const FREE_PLAN_MESSAGE_LIMIT = 5;

/** Max assistant replies per user question on free plan (includes regenerate). */
export const FREE_PLAN_MAX_ASSISTANT_REPLIES_PER_QUESTION = 2;

export const MIN_TRANSCRIPT_LENGTH = 40;

/** Cap transcript size sent to the model to control cost and latency. */
export const MAX_TRANSCRIPT_CHARS = 80_000;

/** Recent turns included for conversational continuity. */
export const MAX_PRIOR_MESSAGES = 16;
