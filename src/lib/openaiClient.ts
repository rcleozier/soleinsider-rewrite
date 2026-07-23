import OpenAI from "openai";

// Configure once:
//   OPENAI_API_KEY
// Optional overrides (defaults are the cheap models on purpose):
//   OPENAI_TEXT_MODEL     default "gpt-4o-mini"
//   OPENAI_IMAGE_MODEL    default "gpt-image-1" — dall-e-2/3 are cheaper per
//                         image on paper, but most newer OpenAI projects
//                         don't have them enabled at all (confirmed: this
//                         project's key gets "model does not exist" for
//                         dall-e-2).
//   OPENAI_IMAGE_SIZE     default "1536x1024" — the landscape option. Covers
//                         crop to 16:9, so a landscape source loses far less
//                         than the 1024x1024 square. Valid gpt-image-1 values
//                         are 1024x1024, 1024x1536, 1536x1024, auto.
//   OPENAI_IMAGE_QUALITY  default "medium" — "low" produced visibly soft,
//                         mushy covers. Valid: low, medium, high, auto.
//                         gpt-image-1 only; ignored by dall-e-2/3.

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
          "Write for SEO without sounding like it: work the main subject and its natural variants " +
          "(full name, nickname, model name) into the title, the first paragraph, at least one " +
          "<h2>, and 2-3 times through the body — never stuffed, always in a sentence a human would " +
          "actually write. Prefer concrete nouns over vague ones (name the shoe, the year, the " +
          "colorway, the event) since specificity is what ranks and what readers trust. " +
          "Return strict JSON with this shape: " +
          '{"title": string (specific and search-friendly, includes the main subject by name, ' +
          "under 70 characters so it doesn't truncate in search results), " +
          '"deck": string (one-sentence hook, under 160 chars, written fresh — ' +
          "NOT copied from the opening paragraph, doubles as the meta description so it should " +
          "read like a reason to click), " +
          '"keywords": string[] (4-7 lowercase tags, specific over generic — e.g. a shoe model or ' +
          "player name rather than just \"sneakers\"), " +
          '"contentHtml": string (as HTML using ONLY these tags: ' +
          "<p> <h2> <h3> <strong> <em> <ul> <li> <a href=\"...\">. " +
          "STRUCTURE, NOT JUST LENGTH, IS THE REQUIREMENT: write 5 distinct <h2> sections, each " +
          "with 2-3 <p> paragraphs of real substance (a specific example, a concrete detail, a named " +
          "shoe/event/year) — that structure alone lands you in the 1000-1400 word range, so build " +
          "it section by section rather than estimating a total. If a section only has one thin " +
          "paragraph in it, that section needs another concrete example before you move on, not a " +
          "shorter article. " +
          "START with a body <p> lede — never an <h2>. Do NOT use generic section headings like " +
          '"Introduction", "Overview", or "Conclusion"; write specific, descriptive headings that ' +
          "themselves contain relevant keywords a reader might search for. End with a short closing " +
          "paragraph that lands the piece rather than trailing off), " +
          '"imagePrompt": string (a photorealistic editorial PHOTOGRAPH description for the cover — ' +
          "describe it as a real photo: camera framing, lighting, surface, depth of field. " +
          "Prefer detailed product/still-life or atmospheric scene photography. " +
          "No text, words, or brand logos in the image. No recognizable real people — if a person " +
          "appears, describe them generically and crop so the face is not the subject. " +
          'Do not request illustration, painting, drawing, 3D render, or CGI styles)}',
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
export async function generateArticleCoverImage(promptInput: string): Promise<Uint8Array> {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  const isGptImage = model.startsWith("gpt-image");

  // Restated here as well as in the copy prompt: without an explicit
  // photography instruction these models drift toward painterly illustration.
  const prompt =
    `${promptInput}\n\n` +
    "Style: photorealistic editorial photography, shot on a full-frame DSLR with a prime lens. " +
    "Natural realistic lighting, true-to-life colour, fine surface texture and material detail, " +
    "shallow depth of field. It must look like a real photograph, not an illustration, " +
    "painting, sketch, 3D render, or CGI. No text, watermarks, or brand logos anywhere in frame.";

  // gpt-image-1 and dall-e-* take different parameters: gpt-image-1 always
  // returns b64 and rejects `response_format` outright, while dall-e-* needs
  // it to avoid getting back a short-lived URL instead of bytes.
  const response = await getClient().images.generate(
    isGptImage
      ? {
          model,
          prompt,
          size: (process.env.OPENAI_IMAGE_SIZE || "1536x1024") as "1536x1024",
          quality: (process.env.OPENAI_IMAGE_QUALITY || "medium") as "medium",
          n: 1,
        }
      : {
          model,
          prompt,
          size: (process.env.OPENAI_IMAGE_SIZE || "512x512") as "512x512",
          response_format: "b64_json",
          n: 1,
        },
  );

  const b64 = response.data?.[0]?.b64_json;

  if (!b64) {
    throw new Error("OpenAI did not return image data.");
  }

  return Buffer.from(b64, "base64");
}
