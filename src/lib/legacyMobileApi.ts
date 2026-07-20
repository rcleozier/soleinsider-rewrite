export type LegacyRelease = {
  id: string;
  name: string;
  content: string;
  sku: string;
  image: string;
  link: string;
  slug: string;
  price: string;
  views: string;
  type: string;
  stockx_highest_bid: string;
  stockx_total_dollars: string;
  stockx_lowest_ask: string;
  stockx_last_sale: string;
  stockx_deadstock_sold: string;
  stockx_sales_last_72: string;
  release_date: string;
  created_at: string;
  product_id: string;
  release_date_calendar: string;
  yes_votes: string;
  no_votes: string;
  total_votes: string;
  yes_percentage: string;
  no_percentage: string;
  image_url?: string;
  product_url?: string;
  profit?: string;
};

export type LegacyPostBody = Record<string, string>;

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

function stringifyRecord(value: unknown): LegacyPostBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, item == null ? "" : String(item)]),
  );
}
