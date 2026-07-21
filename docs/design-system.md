# SoleInsider Design Plan

The editorial redesign of the SoleInsider web rewrite. This is the reference for
how pages are built — read it before adding a page or a component so new work
lands inside the system instead of beside it.

Last updated: July 21, 2026

---

## 1. Direction

Dense editorial, in the mould of a sneaker desk that publishes all day: heavy
display headlines, hairline rules instead of cards, real photography at the top
of the page, and a scannable feed underneath. Nothing floats on a shadow.

The two rules that keep it coherent:

- **Rules, not boxes.** Sections are separated by 1px hairlines and 2px section
  rules. Rounded, shadowed panels are legacy and are being removed on sight.
- **Editorial photography fills; product photography fits.** See §4.

---

## 2. Color

Blue, black, white. Nothing else carries meaning.

| Token | Value | Use |
| --- | --- | --- |
| `--color-accent` | `#0a4ca8` | Category kickers, links on hover, rank numbers, primary buttons, the `Insider` in the wordmark |
| `--color-text` | `#12110f` | Body copy, headlines, dark bands, secondary buttons |
| `--color-bg` | `#f6f7f9` | Page background behind white content |
| `--surface-soft` | `#f1eee8` | Media wells behind product shots |

The accent is defined once in `:root` and once in the dark block of
`globals.css`. Change it in those two places and it propagates everywhere —
do not hardcode blue anywhere else.

**Contrast rule:** the accent is a deep blue and measures roughly **2:1 on
black**, which fails WCAG AA. Never put accent-colored text on a dark band. On
dark backgrounds use white (`#fff`) for content and reserve the accent for
filled buttons, where it sits against its own background. This is exactly the
bug the countdown module had.

---

## 3. Typography

Two families, loaded via `next/font` in `app/layout.tsx`:

- **Fraunces** (`--font-display` → `--font-serif`) — display only. Headlines,
  section titles, product names in feeds. High-contrast and slightly quirky;
  that's the editorial voice.
- **Inter** (`--font-body` → `--font-sans`) — everything else. UI, body copy,
  labels, numbers.

> **Do not pass `axes` to the Fraunces loader.** Turbopack rejects it in dev
> regardless of the `weight` setting and the whole app fails to compile with
> `Can't resolve 'next/font/google/target.css'`. Weight-axis only.

| Role | Family | Size | Notes |
| --- | --- | --- | --- |
| Lead headline | Serif | `clamp(1.9rem, 3.2vw, 2.8rem)` | 900, `-0.025em` |
| Page masthead `h1` | Serif | `clamp(2rem, 4vw, 3.1rem)` | 900, `-0.025em` |
| Detail page `h1` | Serif | `clamp(2rem, 3.4vw, 3.2rem)` | max 15ch measure |
| Section title | Sans | `0.78rem` | 900, `0.16em` tracking, uppercase, 2px bottom rule |
| Category kicker (`.ed-cat`) | Sans | `0.66rem` | 800, `0.14em`, uppercase, accent |
| Feed headline | Serif | `1.02–1.16rem` | 800 |
| Deck | Sans | `0.92rem` | muted, 1.5 line-height |
| Byline / meta | Sans | `0.72rem` | `rgba(16,17,20,0.45)` |

Display sizes were tuned for a card layout originally and read oversized in the
editorial one — when a headline feels loud, it probably is.

---

## 4. Imagery

Two categories, two behaviors. Getting this wrong is the most visible bug in the
system.

- **Editorial photography** (article covers, lead mosaic) → `object-fit: cover`.
  Fill the frame; cropping a scene is fine.
- **Product photography** (every sneaker) → `object-fit: contain` on
  `--surface-soft` with ~6px padding. Product shots are photographed
  edge-to-edge on white, so `cover` slices the toe and heel off.

Legacy article covers point at dead imgur links (~70 of 82 fail). Every media
well carries a `SoleInsider` placeholder via `::before` so a broken cover reads
as intentional rather than as an empty grey box.

---

## 5. Layout

- **Container:** `width: min(1180px, calc(100% - 40px)); margin: 0 auto;` on
  every top-level section. There is no global wrapper — each page opts in.
- **Three-column body** (`.ed-body`): `1.35fr / 1fr / 0.78fr` — primary feed,
  secondary feed, sticky rail.
- **Breakpoints:** `1180px` (rail drops below, becomes two columns), `900px`
  (single column, strip goes 2-up), `560px` (feed rows tighten, decks hide).

### Shared building blocks

| Class | What it is |
| --- | --- |
| `.editorial-home` | Page shell. Sets the white background and link resets |
| `.ed-masthead` | Page title block over a 2px rule |
| `.ed-mosaic` / `.ed-lead` / `.ed-side` | Lead story + two secondaries |
| `.ed-strip` | Four-across strip between hairlines |
| `.ed-body` / `.ed-column` / `.ed-rail` | Three-column body with sticky rail |
| `.ed-row` | Feed row: kicker, headline, deck, meta, square thumb right |
| `.ed-module` | Boxed rail module |
| `.cal-rows` | Schedule rows: date, thumb, body, right-aligned price |
| `.ed-more` | Pill CTA, black → accent on hover |

Reuse these before writing new CSS. `/calendar`, `/search`, and `/on-this-day`
all share `.cal-rows`; `/articles`, `/sports`, and the homepage share `.ed-body`.

---

## 6. Pages

| Route | Pattern |
| --- | --- |
| `/` | Mosaic → strip → three-column (Dropping next / Popular / rail) |
| `/articles` | Masthead → mosaic → strip → feed + sections rail |
| `/calendar` | Masthead → month jump chips → month-grouped `.cal-rows` |
| `/search` | Masthead → search panel → `.cal-rows` results |
| `/on-this-day` | Masthead → month/day picker → year-grouped `.cal-rows` |
| `/sports` | Masthead → league chips → scoreboard + sneaker tie-in rail |
| `/app` | Masthead → store cards → stats → features → steps → CTA band |
| `/privacy`, `/terms` | Masthead → `.legal-body` prose column |
| `/[slug]/[productId]` | Gallery + detail column → related → comments |

**Removed:** `/market-data` (rendered a table of zeros — every `stockx_*` column
is empty), `/sneaker-history`. `/download` permanently redirects to `/app`.

---

## 7. Chrome

**Nav** (`.nav`) — sticky. Black ticker strip, wordmark left, centered uppercase
links with an animated accent underline and a real `aria-current` state, search
icon + "Get the app" pill right. Collapses to a toggle drawer under 1080px.

**Footer** (`.footer`) — black. Brand block with CTA and store links, three link
columns, rule-separated bottom bar with Privacy and Terms only.

---

## 8. Data rules

The site is **DB-only**. `legacyMobileApi` exports types and helpers, not
fixtures. Every page reads through `dbReleases` / `dbArticles` / `dbMobileApi`.

> **Filter dates in SQL, never in the page.** Ordering the whole table by
> `release_date ASC` and taking a page returns the *oldest* rows — many are
> epoch-zero placeholders. This is why the calendar once rendered
> "December 1969". Use `getDbUpcomingReleases` (`release_date >= CURRENT_DATE`).

### Known data debt

- Many `releases.release_date` values are epoch-zero placeholders.
- `description` is populated for only 459 of 24,629 products; `content` for
  17,278. Sparse products render a thin detail page — that is data, not layout.
- All `stockx_*` columns are `0`/empty.
- ~70 of 82 legacy article covers are dead imgur links.
- Duplicate products exist (two `Air Jordan 8 "Chrome"` rows, different SKUs).
- 12 `/mobileapi/*` routes return `emptyLegacyCollection()` stubs.

---

## 9. Open work

- **Accounts** — Google OAuth + email/password on the existing `members` table,
  with `user_sessions` and `favorites`. Blocked on a production migration
  approval and Google OAuth credentials.
- Brand archive pages (`/air-jordan-releases` et al.) still use the pre-redesign
  card layout and show the epoch-date bug.
- Dead CSS from the old design (`.site-header`, `.release-card`,
  `.calendar-card`, `.market-data-*`) is still in `globals.css`.
- `ArticleCard`, `ReleaseCard`, `CountdownModule`, and `getDbCalendarReleases`
  are now unused or nearly so.
- `/search` caps at 60 results with no pagination.
- The sports athlete→team map is hardcoded and needs updating when players move.
- Privacy and Terms copy has **not been legally reviewed**.
