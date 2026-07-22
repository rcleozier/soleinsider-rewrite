# SoleInsider API v1 — Sports

Mobile-facing JSON API that fuses live ESPN sports data with the SoleInsider
sneaker archive. Built for the mobile app; the web pages use the same
underlying libraries.

Base path: `/api/v1`
Last updated: July 22, 2026

---

## Relationship to the legacy `/mobileapi` routes

**The legacy `/mobileapi/*` endpoints are unchanged and still live.** Nothing in
this document replaces them. They keep their original contract (bare arrays,
all-string values) because the shipped mobile app depends on it.

All new work goes under `/api/v1`. The two differ deliberately:

| | `/mobileapi/*` (legacy) | `/api/v1/*` (new) |
| --- | --- | --- |
| Response shape | bare array or object | `{ success, data, meta }` envelope |
| Errors | often `200` with empty body | real status codes + `error` object |
| Types | everything stringified (`"0"`, `"215"`) | real numbers, `null` for absent |
| Versioning | none | path-versioned |

---

## Response envelope

Every endpoint returns the same wrapper.

**Success**
```json
{
  "success": true,
  "data": { },
  "meta": { "generatedAt": "2026-07-22T12:04:28.427Z" }
}
```

**Error**
```json
{
  "success": false,
  "error": { "message": "Unknown league \"cricket\".", "status": 404 },
  "meta": { "generatedAt": "2026-07-22T12:06:54.012Z" }
}
```

`meta` always carries `generatedAt` plus endpoint-specific counts. Errors use
real HTTP status codes — check `response.ok` or `success`, not the body length.

### Caching
Responses set `Cache-Control: public, s-maxage=<n>, stale-while-revalidate=<n*5>`.

| Endpoint | `s-maxage` |
| --- | --- |
| `/sports/leagues` | 3600 |
| `/sports/leagues/{league}` | 120 |
| `/sports/games/{league}/{gameId}` | 120 |
| `/releases/{productId}` | 300 |

---

## `GET /api/v1/sports/leagues`

Every supported league. Cheap and near-static — cache aggressively on device.

```bash
curl https://soleinsider.com/api/v1/sports/leagues
```

```json
{
  "success": true,
  "data": {
    "leagues": [
      {
        "slug": "nba",
        "label": "NBA",
        "sport": "basketball",
        "logo": "https://a.espncdn.com/i/teamlogos/leagues/500/nba.png",
        "links": { "scoreboard": "/api/v1/sports/leagues/nba" }
      }
    ]
  },
  "meta": { "generatedAt": "...", "count": 11 }
}
```

### Supported league slugs

| Slug | Label | Sport |
| --- | --- | --- |
| `nba` | NBA | basketball |
| `nfl` | NFL | football |
| `mlb` | MLB | baseball |
| `nhl` | NHL | hockey |
| `wnba` | WNBA | basketball |
| `mens-college-basketball` | NCAAM | basketball |
| `womens-college-basketball` | NCAAW | basketball |
| `college-football` | NCAAF | football |
| `usa.1` | MLS | soccer |
| `eng.1` | PREMIER LEAGUE | soccer |
| `uefa.champions` | UCL | soccer |

> The three NCAA entries have no distinct badge on ESPN, so `logo` falls back to
> a generic sport icon. NCAAM and NCAAW intentionally share one.

---

## `GET /api/v1/sports/leagues/{league}`

Today's scoreboard for one league, plus a sneaker tie-in computed across every
team on the board.

```bash
curl https://soleinsider.com/api/v1/sports/leagues/nba
```

**404** if the slug isn't supported; the error body includes
`availableLeagues` so the client can recover without a second request.

### `data.games[]`

```json
{
  "id": "401898388",
  "league": { "slug": "nba", "label": "NBA" },
  "name": "Memphis Grizzlies at Atlanta Hawks",
  "headline": null,
  "startTime": "2026-10-05T23:00Z",
  "status": { "state": "pre", "detail": "10/5 - 7:00 PM EDT", "isLive": false, "isFinal": false },
  "venue": "State Farm Arena",
  "broadcast": null,
  "teams": [ /* see team object */ ],
  "matchup": { "away": { }, "home": { } },
  "links": {
    "detail": "/api/v1/sports/games/nba/401898388",
    "web": "/sports/nba/401898388"
  }
}
```

`teams` is ESPN's raw order. **Use `matchup.away` / `matchup.home` for display** —
don't assume index 0 is the away side.

`status.state` is one of `pre` | `in` | `post`. Prefer the `isLive` / `isFinal`
booleans over string comparison.

### Team object

```json
{
  "name": "Memphis Grizzlies",
  "abbreviation": "MEM",
  "logo": "https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/mem.png",
  "score": null,
  "record": "34-6",
  "isHome": false
}
```

> `score` is `null` before tip-off, a number afterwards. ESPN reports `"0"` for
> both sides on scheduled games; that's normalized to `null` here so a fixture
> never renders as a 0–0 result. `record` is frequently `null` in preseason.

### `data.sneakers`

The tie-in, in two parts.

```json
{
  "signatureAthletes": [
    {
      "athlete": "Ja Morant",
      "line": "Nike Ja",
      "releases": [ /* release objects */ ]
    }
  ],
  "releasingOnGameDay": [ /* release objects */ ]
}
```

- **`signatureAthletes`** — athletes with a signature/PE line whose team is on
  today's board, each with their most recent releases from the archive.
  Matching is league-scoped: `MIN`, `CLE`, `BOS` and others exist in multiple
  leagues, so an NBA player will never surface on an MLB board.
- **`releasingOnGameDay`** — everything in the archive dropping on that calendar
  date, regardless of athlete.

Both arrays are frequently empty and that is a valid response — the athlete map
currently covers **NBA and WNBA only**, so MLB/NHL/NFL/soccer boards return
`signatureAthletes: []`. Render the section conditionally.

---

## `GET /api/v1/sports/games/{league}/{gameId}`

Full match detail. Same sneaker tie-in, but scoped to the two teams in this
game and returning more per athlete (6 releases vs 3).

```bash
curl https://soleinsider.com/api/v1/sports/games/nba/401898388
```

**404** for an unknown league slug or a `gameId` that league doesn't have.

### `data.game`

Everything from the list shape, plus:

| Field | Type | Notes |
| --- | --- | --- |
| `neutralSite` | `boolean` | |
| `venue` | `object \| null` | `{ name, city, state, image, indoor }` |
| `venue.indoor` | `boolean \| null` | `null` when ESPN omits it — it does for indoor-only sports like basketball. **Don't treat `null` as "outdoor".** |
| `broadcasts` | `string[]` | |
| `odds` | `array` | See below |
| `leaders` | `array` | `{ team, category, athlete, headshot, position, value }` |
| `injuries` | `array` | `{ team, athlete, position, status, detail }` |
| `lastFive` | `array` | `{ team, games: ["W","L",…] }` |
| `tickets` | `array` | `{ name, link }` — affiliate links; render with `rel="nofollow noopener"` |

### Odds object

```json
{
  "provider": "ESPN BET",
  "details": "MEM -3.5",
  "spread": -3.5,
  "overUnder": 224.5,
  "favorite": "home",
  "moneyline": { "home": -160, "away": 135 }
}
```

`meta.hasOdds` tells you whether the array is populated without inspecting it.

> ⚠️ **Odds are usually empty.** ESPN returns no lines until sportsbooks post
> them, typically near tip-off, and returned nothing across every league during
> development. The parsing follows ESPN's documented shape but **has not been
> verified against a populated response** — treat the first live odds payload as
> unproven and check field-by-field.

---

## `GET /api/v1/releases/{productId}`

A single release with gallery and related products. This is the target of every
`links.api` emitted elsewhere in the API.

```bash
curl https://soleinsider.com/api/v1/releases/24671
```

```json
{
  "success": true,
  "data": {
    "release": { /* release object, images.gallery populated */ },
    "related": [ /* up to 8 release objects */ ]
  },
  "meta": { "relatedCount": 8, "galleryCount": 4 }
}
```

---

## Release object

Returned identically everywhere a sneaker appears.

```json
{
  "productId": "24671",
  "name": "Lebron James x Nike Air Force 1 Low Beijing",
  "slug": "lebron-james-x-nike-air-force-1-low-beijing",
  "brand": "Nike",
  "type": "sneakers",
  "sku": "IQ5373-100",
  "colorway": null,
  "description": "The LeBron James x Nike Air Force 1 Low Beijing…",
  "price": { "retail": 200, "formatted": "$200" },
  "releaseDate": {
    "iso": "2026-07-01",
    "display": "July 1st, 2026",
    "timestamp": 1782864000000
  },
  "images": {
    "primary": "https://soleinsider.s3.us-east-1.amazonaws.com/thumb_ipad_….png",
    "gallery": []
  },
  "votes": { "cop": 0, "drop": 0, "total": 0, "copPercentage": 0 },
  "links": {
    "web": "https://soleinsider.com/lebron-james-x-nike-air-force-1-low-beijing/24671",
    "api": "/api/v1/releases/24671",
    "path": "/lebron-james-x-nike-air-force-1-low-beijing/24671"
  }
}
```

| Field | Notes |
| --- | --- |
| `price.retail` | `null` when unknown; `formatted` is `"TBA"` in that case |
| `releaseDate.iso` | `null` if the stored date can't be parsed |
| `colorway` | Best-effort parse from the product name; often `null` |
| `description` | HTML-stripped. `null` for most products — only ~17k of 24.6k rows have any body text |
| `images.gallery` | Empty except on `/releases/{productId}` |
| `votes` | Counts from `release_interest`; mostly `0` outside popular products |

Images are served from S3 (`soleinsider.s3.us-east-1.amazonaws.com`), or the
`S3_PUBLIC_HOSTNAME` domain if configured.

---

## Data-quality caveats worth coding against

These are properties of the underlying data, not bugs in the API:

1. **Odds are almost always empty** — see the warning above.
2. **`signatureAthletes` is NBA/WNBA-only** — the athlete→team map is hardcoded
   in `src/lib/sportsSneakers.ts` and needs updating when players change teams.
3. **Many `releaseDate` values are epoch-zero placeholders** in the archive, so
   some releases report dates around 1969–1970.
4. **`description` is null for most products.**
5. **ESPN's API is undocumented and unversioned.** Every field is treated as
   optional; if ESPN changes shape, endpoints degrade to empty arrays rather
   than erroring.

---

## Implementation map

| Concern | File |
| --- | --- |
| Response envelope | `src/lib/api/response.ts` |
| Release serializer | `src/lib/api/serializers.ts` |
| Sports payloads + tie-in | `src/lib/api/sportsApi.ts` |
| ESPN reader | `src/lib/espn.ts` |
| Athlete → sneaker matching | `src/lib/sportsSneakers.ts` |
| Routes | `src/app/api/v1/**/route.ts` |
