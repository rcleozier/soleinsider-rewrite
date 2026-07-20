import {
  isAuthorizedIngestRequest,
  payloadFromRequest,
  saveTempReleaseFromPayload,
} from "@/lib/tempReleaseIngest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isAuthorizedIngestRequest(request)) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await payloadFromRequest(request);
    const result = await saveTempReleaseFromPayload(payload);

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unable to save release.",
      },
      { status: 400 },
    );
  }
}
