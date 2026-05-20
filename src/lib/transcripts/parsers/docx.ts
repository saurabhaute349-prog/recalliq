import mammoth from "mammoth";

export async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  const text = (result.value ?? "").trim();

  if (!text) {
    throw new Error(
      "No text found in this document. The file may be empty or image-only.",
    );
  }

  return text;
}
