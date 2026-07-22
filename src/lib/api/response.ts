/**
 * Envelope shared by every /api/v1 endpoint. The legacy /mobileapi routes
 * return bare arrays with no error contract; new endpoints always return
 * `{ success, data | error, meta }` so clients can branch on one shape.
 */
export type ApiMeta = Record<string, unknown>;

export function apiSuccess<T>(data: T, meta: ApiMeta = {}, cacheSeconds = 60) {
  return Response.json(
    {
      success: true,
      data,
      meta: { generatedAt: new Date().toISOString(), ...meta },
    },
    {
      headers: {
        "cache-control": `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 5}`,
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
