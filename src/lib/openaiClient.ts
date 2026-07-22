import OpenAI from "openai";

// Configure once:
//   OPENAI_API_KEY
// Optional overrides (defaults are the cheap models on purpose):
//   OPENAI_TEXT_MODEL     default "gpt-4o-mini"
//   OPENAI_IMAGE_MODEL    default "gpt-image-1" — dall-e-2/3 are cheaper per
//                         image on paper, but most newer OpenAI projects
//                         don't have them enabled at all (confirmed: this
//                         project's key gets "model does not exist" for
//                         dall-e-2). gpt-image-1 at "low" quality is the
//                         reliable cheap option instead.
//   OPENAI_IMAGE_SIZE     default "1024x1024" (gpt-image-1 doesn't offer
//                         anything smaller — 1024x1536/1536x1024/auto are
//                         the only other valid values)
//   OPENAI_IMAGE_QUALITY  default "low" — gpt-image-1 only; ignored by
//                         dall-e-2/3 if you switch OPENAI_IMAGE_MODEL back

export function isOpenAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

let client: OpenAI | null = null;

function getClient() {
  if (!isOpenAiConfigured()) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  return client;
}

export type GeneratedArticleCopy = {
  title: string;
  deck: string;
  keywords: string[];
  /** HTML restricted to the tags dbArticles.ts allows: p, h2, h3, strong, em, ul, li, a. */
  contentHtml: string;
  /** A short visual description handed to the image model — not shown to readers. */
  imagePrompt: string;
};

/**
 * Asks the text model for a full article as JSON. The prompt spells out the
 * exact allowed HTML tags because the DB layer strips anything else, and an
 * article that used <div>/<span> would silently render as plain text.
 */
export async function generateArticleCopy(brief: string): Promise<GeneratedArticleCopy> {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";

  const response = await getClient().chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.9,
    messages: [
      {
        role: "system",
        content:
          "You are a staff writer for SoleInsider, a sneaker release and culture site. " +
          "Write engaging, specific, factually careful articles — no invented quotes, no " +
          "fabricated statistics presented as fact, no claims about events after your knowledge " +
          "cutoff stated as certain. When a detail might be time-sensitive, phrase it generally. " +
          "Return strict JSON with this shape: " +
          '{"title": string, "deck": string (one-sentence hook, under 160 chars), ' +
          '"keywords": string[] (3-6 lowercase tags), ' +
          '"contentHtml": string (600-900 words as HTML using ONLY these tags: ' +
          "<p> <h2> <h3> <strong> <em> <ul> <li> <a href=\"...\">, 4-7 paragraphs, at least one <h2>), " +
          '"imagePrompt": string (a vivid, concrete visual description for a magazine-cover ' +
          "illustration — no text/words/logos in the image, no real photographs of named people)}",
      },
      { role: "user", content: brief },
    ],
  });

  const raw = response.choices[0]?.message?.content;

  if (!raw) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = JSON.parse(raw) as Partial<GeneratedArticleCopy>;

  if (!parsed.title || !parsed.contentHtml) {
    throw new Error("OpenAI response was missing required fields.");
  }

  return {
    title: parsed.title,
    deck: parsed.deck || "",
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 6) : [],
    contentHtml: parsed.contentHtml,
    imagePrompt: parsed.imagePrompt || parsed.title,
  };
}

/** Generates a cover image and returns raw PNG bytes. */
export async function generateArticleCoverImage(prompt: string): Promise<Uint8Array> {
  const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-2";
  const size = (process.env.OPENAI_IMAGE_SIZE || "512x512") as
    | "256x256"
    | "512x512"
    | "1024x1024";

  const response = await getClient().images.generate({
    model,
    prompt,
    size,
    n: 1,
    response_format: "b64_json",
  });

  const b64 = response.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI did not return image data.");
  }

  return Buffer.from(b64, "base64");
}
