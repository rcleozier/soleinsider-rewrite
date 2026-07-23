/**
 * Envelope shared by every /api/v1 endpoint. The legacy /mobileapi routes
 * return bare arrays with no error contract; new endpoints always return
 * `{ success, data | error, meta }` so clients can branch on one shape.
 */
export type ApiMeta = Record<string, unknown>;

/**
 * `cacheSeconds` controls a shared/CDN cache — pass 0 (the default for any
 * endpoint that reads the Authorization header or a session cookie) to get
 * `private, no-store` instead, since a public cache doesn't know to vary its
 * key on those and could otherwise serve one member's data to another.
 */
export function apiSuccess<T>(data: T, meta: ApiMeta = {}, cacheSeconds = 0) {
  return Response.json(
    {
      success: true,
      data,
      meta: { generatedAt: new Date().toISOString(), ...meta },
    },
    {
      headers: {
        "cache-control": cacheSeconds > 0
          ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 5}`
          : "private, no-store",
      },
    },
  );
}

export function apiError(
  message: string,
  status = 400,
  extra: Record<string, unknown> = {},
) {
  return Response.json(
    {
      success: false,
      error: { message, status, ...extra },
      meta: { generatedAt: new Date().toISOString() },
    },
    { status },
  );
}
