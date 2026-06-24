import mockData from "@/data/mobile-api.mock.json";
import { getProductImageUrl } from "@/lib/productImages";

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
const savedTokens: { id: string; application: string; token: string }[] = [];

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

  return releases
    .filter((release) => getReleaseTimestamp(release) >= today.getTime())
    .map(withReleaseUrls);
}

export function getAllReleases() {
  return releases;
}

export function getRecentlyAddedReleases() {
  return releases
    .slice()
    .sort((a, b) => Number(b.product_id) - Number(a.product_id))
    .slice(0, 20)
    .map(withReleaseUrls);
}

export function getReleaseDatesUnformatted(type = "sneakers") {
  return releases
    .filter((release) => release.type === type)
    .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))
    .map(withReleaseUrls);
}

export function getCombinedReleaseDates() {
  return releases
    .filter((release) => ["sneakers", "clothing"].includes(release.type))
    .sort((a, b) => getReleaseTimestamp(a) - getReleaseTimestamp(b))
    .map(withReleaseUrls);
}

export function getPastReleaseDates() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  return releases
    .filter((release) => getReleaseTimestamp(release) < twoDaysAgo.getTime())
    .sort((a, b) => getReleaseTimestamp(b) - getReleaseTimestamp(a))
    .slice(0, 35)
    .map(withReleaseUrls);
}

export function getReleaseBySlug(slug: string) {
  return releases.find((release) => release.slug === slug);
}

export function getReleaseBySlugAndId(slug: string, productId: string) {
  return releases.find(
    (release) => release.slug === slug && release.product_id === productId,
  );
}

export function searchReleases(search: string | null) {
  const needle = search?.trim().toLowerCase();

  if (!needle) {
    return [];
  }

  return releases
    .filter((release) =>
      [release.name, release.sku, release.slug, release.type, release.content]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    )
    .map(withReleaseUrls);
}

export function getReleasesOnDate(date: string | null) {
  const normalizedDate = date || formatMonthDay(new Date());

  return releases
    .filter((release) => {
      const [, , month, day] =
        release.release_date_calendar.match(/^(\d{4}),(\d{1,2}),(\d{1,2})/) ?? [];

      return month && day && `${month.padStart(2, "0")}-${day.padStart(2, "0")}` === normalizedDate;
    })
    .map(withReleaseUrls);
}

export function getSlideshow(productId: string | null) {
  return productId
    ? (slideshowsByProduct[productId] ?? []).map((image) => ({
        ...image,
        image_url: getProductImageUrl(image.image),
      }))
    : [];
}

export function getProduct(productId: string | null) {
  const release = productId
    ? releases.find((item) => item.product_id === productId || item.id === productId)
    : undefined;

  return release ? [withReleaseUrls(release)] : [];
}

export function getProducts() {
  return releases.slice(0, 20).map(withReleaseUrls);
}

export function getRandomProduct() {
  const release = releases[Math.floor(Math.random() * releases.length)];

  return release ? withReleaseUrls(release) : null;
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

  if (!productId || comment.trim().length < 2 || comment === "undefined") {
    return false;
  }

  const memberId = body.member_id || "0";
  const existing = (commentsByProduct[productId] ?? []).find(
    (item) =>
      item.member_id === memberId &&
      item.comment?.trim().toLowerCase() === comment.trim().toLowerCase(),
  );

  if (existing) {
    return true;
  }

  const newComment: Comment = {
    id: String(Date.now()),
    member_id: memberId,
    product_id: productId,
    comment: comment.trim(),
    votes_up: "1",
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

  return true;
}

export function voteComment(body: LegacyPostBody) {
  const productId = body.product_id || "";
  const commentId = body.comment_id || "";
  const commentVote = body.comment_vote || "";
  const comments = commentsByProduct[productId] ?? [];
  const comment = comments.find((item) => item.id === commentId);

  if (!productId || !commentId || !commentVote || !comment) {
    return comments;
  }

  if (commentVote === "0" || commentVote.toLowerCase() === "down") {
    comment.votes_down = String(Number(comment.votes_down) + 1);
  } else {
    comment.votes_up = String(Number(comment.votes_up) + 1);
  }

  return commentsByProduct[productId] ?? [];
}

export function copOrNot(body: LegacyPostBody) {
  const productId = body.product_id || "";
  const status = body.status || "";
  const release = releases.find((item) => item.product_id === productId || item.id === productId);

  if (!productId || !status || !release) {
    return false;
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

  return true;
}

export function showBanner() {
  return false;
}

export function saveToken(body: LegacyPostBody) {
  const token = body.token || "";
  const application = body.application || "";

  if (!token || savedTokens.some((item) => item.token === token)) {
    return false;
  }

  savedTokens.push({
    id: String(Date.now()),
    application,
    token,
  });

  return true;
}

export function getTokens(body: LegacyPostBody) {
  const application = body.application || "";

  return savedTokens.filter((item) => item.application === application);
}

export function getStatsMostSales() {
  return releases
    .filter((release) => Number(release.stockx_lowest_ask) > 0)
    .sort((a, b) => Number(b.stockx_sales_last_72) - Number(a.stockx_sales_last_72))
    .slice(0, 50)
    .map(withReleaseUrls);
}

export function getStatsMostProfit() {
  return releases
    .map((release) => ({
      ...release,
      profit: String(Number(release.stockx_lowest_ask) - Number(release.price)),
    }))
    .filter((release) => Number(release.stockx_lowest_ask) > 0)
    .sort((a, b) => Number(b.profit) - Number(a.profit))
    .slice(0, 25)
    .map(withReleaseUrls);
}

export function getStatsMostLiked() {
  return releases
    .slice()
    .sort((a, b) => Number(b.yes_votes) - Number(a.yes_votes))
    .slice(0, 35)
    .map(withReleaseUrls);
}

export function getStockxTrending() {
  return [];
}

export function getSneakerStories() {
  return [];
}

export function getMessages() {
  return [];
}

export function getRaffles() {
  return [];
}

export function getNews() {
  return [];
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

function withReleaseUrls<T extends Release>(release: T) {
  return {
    ...release,
    image_url: getProductImageUrl(release.image),
    product_url: `https://soleinsider.com/${release.slug}/${release.product_id}`,
  };
}
