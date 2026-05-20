import "server-only";

import pdf from "pdf-parse";

const PDF_PARSE_ERROR = "Unable to parse PDF file";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const parsed = await pdf(buffer);
    const text = (parsed.text ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    if (!text.trim()) {
      throw new Error(PDF_PARSE_ERROR);
    }

    return text;
  } catch {
    throw new Error(PDF_PARSE_ERROR);
  }
}
