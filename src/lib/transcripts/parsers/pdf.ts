import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const text = (result.text ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");

    if (!text.trim()) {
      throw new Error(
        "No readable text found in this PDF. Try a text-based export instead.",
      );
    }

    return text;
  } finally {
    await parser.destroy();
  }
}
