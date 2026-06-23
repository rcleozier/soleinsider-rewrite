import mockData from "@/data/mobile-api.mock.json";

type Release = (typeof mockData.releases)[number];
type Comment = (typeof mockData.comments)[keyof typeof mockData.comments][number];
type SlideshowImage =
  (typeof mockData.slideshows)[keyof typeof mockData.slideshows][number];

type LegacyPostBody = Record<string, string>;

export type LegacyRelease = Release;

const releases: Release[] = structuredClone(mockData.releases);
const commentsByProduct = structuredClone(
  mockData.comments,
) as Record<string, Comment[]>;
const slideshowsByProduct = mockData.slideshows as Record<
  string,
  SlideshowImage[]
>;

const jsonHeaders = {
  "Cache-Control": "no-store",
};

export function legacyJson(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      ...jsonHeaders,
      ...init?.headers,
    },
  });
}

export function getUpcomingReleases() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return releases.filter((release) => getReleaseTimestamp(release) >= today.getTime());
}

export function getAllReleases() {
  return releases;
}

export function getReleaseBySlug(slug: string) {
  return releases.find((release) => release.slug === slug);
}

export function searchReleases(search: string | null) {
  const needle = search?.trim().toLowerCase();

  if (!needle) {
    return [];
  }

  return releases.filter((release) =>
    [release.name, release.sku, release.slug, release.type, release.content]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

export function getReleasesOnDate(date: string | null) {
  const normalizedDate = date || formatMonthDay(new Date());

  return releases.filter((release) => {
    const [, , month, day] =
      release.release_date_calendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/) ?? [];

    return month && day && `${month.padStart(2, "0")}-${day.padStart(2, "0")}` === normalizedDate;
  });
}

export function getSlideshow(productId: string | null) {
  return productId ? (slideshowsByProduct[productId] ?? []) : [];
}

export function getComments(productId: string | null) {
  return productId ? (commentsByProduct[productId] ?? []) : [];
}

export async function readLegacyPostBody(request: Request): Promise<LegacyPostBody> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => ({}));
    return stringifyRecord(body);
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
    );
  }

  const body = await request.text();
  return Object.fromEntries(new URLSearchParams(body));
}

export function leaveComment(body: LegacyPostBody) {
  const productId = body.product_id || "";
  const comment = body.comment || body.body || "";

  if (!productId || !comment.trim()) {
    return {
      success: false,
      error: "product_id and comment are required",
    };
  }

  const newComment: Comment = {
    id: String(Date.now()),
    member_id: body.member_id || "0",
    product_id: productId,
    comment: comment.trim(),
    votes_up: "0",
    votes_down: "0",
    created_at: null,
    updated_at: null,
    email: null,
    password: null,
    phone_number: null,
    carrier: null,
    member_type: null,
    verified: null,
    profile_image: null,
    bounced_email: null,
    comment_date: formatLegacyDate(new Date()),
  };

  commentsByProduct[productId] = [newComment, ...(commentsByProduct[productId] ?? [])];

  return {
    success: true,
    comment: newComment,
    deviceId: body.deviceId || body.device_id || "",
  };
}

export function voteComment(body: LegacyPostBody) {
  const productId = body.product_id || "";
  const commentId = body.comment_id || "";
  const commentVote = body.comment_vote || "";
  const comments = commentsByProduct[productId] ?? [];
  const comment = comments.find((item) => item.id === commentId);

  if (!productId || !commentId || !commentVote || !comment) {
    return {
      success: false,
      error: "product_id, comment_id, and comment_vote must match a mock comment",
    };
  }

  if (commentVote === "1" || commentVote.toLowerCase() === "up") {
    comment.votes_up = String(Number(comment.votes_up) + 1);
  } else {
    comment.votes_down = String(Number(comment.votes_down) + 1);
  }

  return {
    success: true,
    comment,
  };
}

export function copOrNot(body: LegacyPostBody) {
  const productId = body.product_id || "";
  const status = body.status || "";
  const release = releases.find((item) => item.product_id === productId || item.id === productId);

  if (!productId || !status || !release) {
    return {
      success: false,
      error: "product_id and status must match a mock release",
    };
  }

  if (status === "1" || status.toLowerCase() === "cop" || status.toLowerCase() === "yes") {
    release.yes_votes = String(Number(release.yes_votes) + 1);
  } else {
    release.no_votes = String(Number(release.no_votes) + 1);
  }

  const yesVotes = Number(release.yes_votes);
  const noVotes = Number(release.no_votes);
  const totalVotes = yesVotes + noVotes;

  release.total_votes = String(totalVotes);
  release.yes_percentage = totalVotes ? String(Math.round((yesVotes / totalVotes) * 100)) : "0";
  release.no_percentage = totalVotes ? String(100 - Number(release.yes_percentage)) : "0";

  return {
    success: true,
    product_id: release.product_id,
    member_id: body.member_id || "0",
    status,
    yes_votes: release.yes_votes,
    no_votes: release.no_votes,
    total_votes: release.total_votes,
    yes_percentage: release.yes_percentage,
    no_percentage: release.no_percentage,
  };
}

function getReleaseTimestamp(release: Release) {
  const match = release.release_date_calendar.match(
    /^(\d{4}),(\d{1,2}),(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})/,
  );

  if (!match) {
    return 0;
  }

  const [, year, month, day, hour, minute, second] = match.map(Number);
  return new Date(year, month - 1, day, hour, minute, second).getTime();
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

function formatLegacyDate(date: Date) {
  return `${formatMonthDay(date)}-${date.getFullYear()} ${String(
    date.getHours(),
  ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(
    date.getSeconds(),
  ).padStart(2, "0")}`;
}

function stringifyRecord(value: unknown): LegacyPostBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, item == null ? "" : String(item)]),
  );
}
