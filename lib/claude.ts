import Anthropic from "@anthropic-ai/sdk";
import type { AiCredentialData } from "@/lib/types";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const SCAN_PROMPT = `You are extracting structured data from a photo of a construction worker's credential or safety certificate (e.g. Working at Heights, WHMIS, First Aid, Trade Certification).

Look at the image and return ONLY a JSON object with exactly these keys:
{
  "credential_type": string or null,
  "holder_name": string or null,
  "issuing_body": string or null,
  "issue_date": "YYYY-MM-DD" or null,
  "expiry_date": "YYYY-MM-DD" or null
}

If a field is not visible or not present on the document, return null for that field. Do not guess dates. Return raw JSON only, no markdown fences, no commentary.`;

function mediaTypeFromDataUrl(dataUrl: string): "image/jpeg" | "image/png" | "image/webp" {
  if (dataUrl.startsWith("data:image/png")) return "image/png";
  if (dataUrl.startsWith("data:image/webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * Sends a credential photo to Claude's vision model and returns structured,
 * human-reviewable data. Callers must still have a manager/admin confirm the
 * result before it is treated as authoritative (SRS FR26/FR27).
 */
export async function scanCredentialImage(imageDataUrl: string): Promise<AiCredentialData> {
  const mediaType = mediaTypeFromDataUrl(imageDataUrl);
  const base64Data = imageDataUrl.split(",")[1] ?? "";

  const message = await getAnthropic().messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
          { type: "text", text: SCAN_PROMPT },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";

  try {
    const cleaned = raw.trim().replace(/^```json?/i, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      credential_type: parsed.credential_type ?? null,
      holder_name: parsed.holder_name ?? null,
      issuing_body: parsed.issuing_body ?? null,
      issue_date: parsed.issue_date ?? null,
      expiry_date: parsed.expiry_date ?? null,
    };
  } catch {
    return {
      credential_type: null,
      holder_name: null,
      issuing_body: null,
      issue_date: null,
      expiry_date: null,
    };
  }
}
