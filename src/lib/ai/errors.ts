export function getGeminiErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "";
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something went wrong while generating a response.";

  const normalized = message.toLowerCase();

  if (
    normalized.includes("api key") ||
    normalized.includes("api_key") ||
    normalized.includes("unauthorized")
  ) {
    return "AI is temporarily unavailable. Please try again in a moment.";
  }

  if (
    normalized.includes("quota") ||
    normalized.includes("rate") ||
    normalized.includes("429") ||
    normalized.includes("resource_exhausted")
  ) {
    return "AI is busy right now. Please wait a moment and try again.";
  }

  if (
    normalized.includes("timeout") ||
    normalized.includes("deadline") ||
    normalized.includes("timed out")
  ) {
    return "The request took too long. Please try a shorter question.";
  }

  if (normalized.includes("safety") || normalized.includes("blocked")) {
    return "I could not answer that question based on this meeting.";
  }

  return "I could not generate a response right now. Please try again.";
}
