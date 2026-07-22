// Kept out of adminReleases.ts: a "use server" file may only export async
// functions, so the shared result type lives here instead.
export type CreateReleaseResult =
  | { success: true; slug: string; productId: number }
  | { success: false; error: string };
