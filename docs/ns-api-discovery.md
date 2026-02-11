# NS.com API Discovery - Complete Findings

## Architecture Overview

- **Frontend**: Next.js (React Server Components) deployed on Vercel
- **Backend API**: Django REST Framework at `api.ns.com`
- **Auth Provider**: Privy (privy.io) at `privy.ns.com`
- **Proxy**: Next.js API routes proxy to `api.ns.com` via `/api/proxy/api/v1/...`
- **Analytics**: PostHog, Ahrefs, Sentry, Mux (video), Intercom (chat)
- **Embedded Content**: Many pages embed Notion (`nsinternal.notion.site`) or Fillout forms

---

## Authentication Mechanism

### Auth Flow
1. User authenticates via **Privy** (OAuth/email) → Privy issues a JWT
2. JWT stored in `localStorage` as `privy:token`
3. On each page load, `POST /api/auth/init` is called with:
   - `Authorization: Bearer <privy-jwt>`
   - `X-CSRF-Token: <ns-csrf cookie value>`
   - `Content-Type: application/json`
4. Session maintained via `privy-session` cookie + `ns-csrf` cookie

### JWT Details
- **Algorithm**: ES256
- **Issuer**: `privy.io`
- **Audience (App ID)**: `cmf4xqkxr002mjr0bi0aaj15o`
- **Subject (User DID)**: `did:privy:cmflurrx700jjjl0buod1pkvi`
- **Session ID**: `cmlhggbxm01x2l40chvr5ejrb`
- **Expiry**: 1 hour from issuance
- **Key ID**: `btOvu3MVnkowyOi5O9Kx_tELG4_-51MMwMHA6U0uLqw`

### Cookies
| Cookie | Purpose |
|--------|---------|
| `privy-session` | Privy session identifier (value: `privy.ns.com`) |
| `ns-csrf` | CSRF protection token |
| `_ga`, `_ga_RV2XE5BM4T` | Google Analytics |
| `ph_phc_*_posthog` | PostHog analytics |
| `intercom-device-id-pjtaf6tm` | Intercom device tracking |
| `intercom-session-pjtaf6tm` | Intercom session |
| `muxData` | Mux video analytics |

### Privy Wallet
- Embedded ETH wallet: `0x98C87458aC53F1cAa91A472D1D49d9C54d4E153e`
- Connection type: `embedded` (Privy-managed)

---

## Discovered API Endpoints

### 1. Auth Endpoints

#### `POST /api/auth/init`
- **Auth Required**: Yes (Bearer JWT + CSRF)
- **Returns**: Full authenticated user profile
- **Response fields**:
  ```
  id, username, name, bio, profileImage, dateJoined, personalSite,
  twitterX, farcaster, github, linkedin, discord, discordId,
  canRefer, email, phone, points, pointsAwards, shortermPointsClaimed,
  ethereum, solana, bitcoin, zcash, telegram,
  privyEth, privySol, burnCredentials[], learnCredentials[], combines[]
  ```
- **Notable**: Exposes MORE data than visible in UI (email, phone, wallet addresses, burn/learn credentials)

#### `POST privy.ns.com/api/v1/sessions`
- **Auth**: Uses Privy session cookie
- **Purpose**: Validates/refreshes Privy session on each page load

#### `GET /api/proxy/api/v1/auth/intercom_jwt/`
- **Auth Required**: Yes (via proxy)
- **Returns**: Intercom JWT for authenticated chat support

### 2. Task Endpoints (Earn System)

All task endpoints are **publicly accessible** (no auth required for GET requests).

#### `GET /api/proxy/api/v1/tasks/`
- **Auth Required**: No (works with `credentials: omit`)
- **Returns**: Paginated list of all tasks (currently 18)
- **Default ordering**: `-total_reward`
- **Response fields per task**:
  ```
  id, title, slug, rewards[], deadline, entryType (link|video|code),
  isActive, isSettled, entryCount, topThreeEntries[], imageKey, videoKey,
  sponsor{id,username,name}, paidIn (bitcoin|usdc|sgd), totalRewards,
  instructions (markdown), visibleToStatuses[], isPrize, createdAt,
  updatedAt, order, entryLimit, tags[]
  ```

#### `GET /api/proxy/api/v1/tasks/{slug}/`
- **Auth Required**: No
- **Returns**: Individual task detail with full description
- **Supports query params**:
  - `entries_limit` - Number of inline entries to include
  - `entries_offset` - Offset for inline entries
- **Additional fields (vs list)**:
  ```
  description (full markdown), entries[], entriesMeta{},
  userHasEntered, reviewCount, topTenReviewers[],
  metadata, sponsorUsername, userEntryCount
  ```

#### `GET /api/proxy/api/v1/tasks/{slug}/entries/`
- **Auth Required**: No
- **Returns**: Paginated entries (default limit: 20)
- **Pagination**: `?limit=N&offset=N`
- **Response fields per entry**:
  ```
  id, task, taskId, entrant{id,username,name,profileImage},
  comment, src (submission URL), entryType, reward, place,
  createdAt, reviewCount, commentCount,
  commentsPreview[] (full comments with commenter details),
  reviewsPreview[] (full reviews with reviewer details),
  reviewers[] (all reviewers with userId/username/name/profileImage),
  userHasReviewed, isOwnEntry, assetId, uploadId,
  brandedPlaybackId, brandedAssetReady, assetReady,
  linkPreviewData{url,image,title,siteName,description},
  paidOut, isHidden
  ```
- **Notable**: Returns ALL comments and reviews inline - very data-rich

#### `GET /api/proxy/api/v1/tasks/{slug}/entries/{entry-id}/`
- **Auth Required**: No
- **Returns**: Single entry detail (same fields as above)

#### `GET /api/proxy/api/v1/tasks/{slug}/top-entries/?limit=N`
- **Auth Required**: No
- **Returns**: Top N entry summaries (name, username, userId, profileImage)

#### `POST /api/proxy/api/v1/tasks/{slug}/entries/` (Submit entry)
- **Auth Required**: Yes (CSRF protected)
- **Returns**: 403 "CSRF" without proper token

#### `POST /api/proxy/api/v1/tasks/{slug}/entries/{id}/reviews/` (Vote/review)
- **Auth Required**: Yes (CSRF protected)

#### `POST /api/proxy/api/v1/tasks/{slug}/entries/{id}/comments/` (Comment)
- **Auth Required**: Yes (CSRF protected)

### 3. Analytics/Utility Endpoints

#### `GET /api/ahrefs/loader`
- **Auth Required**: No
- **Returns**: Ahrefs analytics script loader (key: `NS5uF1m56NvRlqUoAAz7MA`)

---

## Proxy Allowlist (Blocked Endpoints)

The proxy at `/api/proxy/` has an allowlist. These paths return `403 Forbidden by proxy allowlist`:

| Blocked Path | Likely Purpose |
|-------------|---------------|
| `/api/v1/users/` | User directory/profiles |
| `/api/v1/cohorts/` | Cohort management/maps |
| `/api/v1/members/` | Member listing |
| `/api/v1/directory/` | Member directory |
| `/api/v1/events/` | Event listing |
| `/api/v1/earnings/` | Earnings data |
| `/api/v1/leaderboard/` | Leaderboard |
| `/api/v1/food/` | Food menu |
| `/api/v1/burn/` | Burn/fitness |
| `/api/v1/pgx/` | PGX data |
| `/api/v1/fellowship/` | Fellowship info |
| `/api/v1/popups/` | Popup events |
| `/api/v1/wiki/` | Wiki content |
| `/api/v1/dashboard/` | Dashboard data |
| `/api/v1/societies/` | Societies |
| `/api/v1/config/` | App config |
| `/api/v1/me/` | Current user |
| `/api/v1/auth/me/` | Auth user |
| `/api/v1/auth/user/` | Auth user info |
| `/api/v1/tasks/{slug}/votes/` | Vote data |
| `/api/v1/tasks/{slug}/results/` | Task results |
| `/api/v1/tasks/{slug}/leaderboard/` | Task leaderboard |
| `/api/v1/tasks/{slug}/winners/` | Task winners |
| `/api/v1/tasks/{slug}/submissions/` | Task submissions |

---

## Page-by-Page Analysis

| Page | Data Source | API Calls |
|------|-----------|-----------|
| `/` (Home) | Server-rendered (Next.js RSC) | Common auth only |
| `/earn` | Proxy API (tasks + entries) | Tasks list, top-entries per task |
| `/earn/{slug}` | Proxy API | Task detail with entries |
| `/earn/create` | Form (auth required) | Common auth only |
| `/burn` | Embedded Notion (`nsinternal.notion.site`) | Notion API calls |
| `/dashboard` | Server-rendered (static society list) | Common auth only |
| `/dashboard/{slug}` | Server-rendered | Common auth only |
| `/pgx` | Embedded Fillout form | Common auth only |
| `/visa` | Embedded Fillout form | Common auth only |
| `/pals` | Server-rendered (inline script) | Common auth only |
| `/wiki` | Embedded Notion (`nsinternal.notion.site`) | Notion API calls |
| `/popups` | Server-rendered | Common auth only |
| `/food` | Redirect to `v3.feedme.cc` (CORS blocked) | External redirect |
| `/fellowship` | Server-rendered with Mux video | Common auth only |
| `/fellowship/apply` | Embedded Fillout form | Common auth only |
| `/apply` | Application form | Common auth only |
| `/about`, `/privacy`, etc. | Static content | Common auth only |

### "Common auth" calls (every page):
1. `POST privy.ns.com/api/v1/sessions` - Session validation
2. `POST /api/auth/init` - User profile fetch (with Bearer JWT + CSRF)
3. `GET /api/proxy/api/v1/auth/intercom_jwt/` - Intercom auth
4. `GET auth.privy.io/api/v1/apps/{app_id}` - Privy app config

---

## Key Findings

### 1. Tasks/Entries Data is Fully Public
All GET endpoints under `/api/proxy/api/v1/tasks/` work without authentication. This includes:
- Full task descriptions and reward structures
- All entries with submission URLs
- All comments and reviews with user details (names, usernames, profile images)
- Review counts and vote data

### 2. Auth/Init Exposes Rich User Profile
The `/api/auth/init` endpoint returns significantly more data than shown in the UI:
- **Email and phone number**
- **All crypto wallet addresses** (ETH, SOL, BTC, ZCash)
- **Burn credentials** (workout attendance with dates and token IDs)
- **Learn credentials**
- **Combines data** (social connections)
- **Points and awards**
- **Referral capability** (`canRefer`)

### 3. Backend is Django REST Framework
- Pagination responses use DRF format (`{count, next, previous, results}`)
- Error format: `{"detail": "Not found."}`
- Backend at `api.ns.com` returns 404 for all direct requests (requires specific routing/auth from proxy)

### 4. Proxy Allowlist Limits Access
The proxy only allows task-related read endpoints and auth endpoints. Many potentially interesting endpoints (cohorts, users, leaderboard, events) are explicitly blocked.

### 5. CSRF Protection on Write Operations
All POST/mutation endpoints require both:
- Bearer JWT in Authorization header
- CSRF token in X-CSRF-Token header (from `ns-csrf` cookie)

### 6. Most Pages Use Embedded Content
The majority of pages don't fetch data from ns.com APIs. Instead:
- `/burn`, `/wiki` → Notion embeds (`nsinternal.notion.site`)
- `/pgx`, `/visa`, `/fellowship/apply` → Fillout forms
- `/food` → Redirects to `v3.feedme.cc`
- `/pals`, `/dashboard`, `/popups` → Server-side rendered (data baked into HTML)

### 7. Cohort Data Not Accessible via API
The `/api/v1/cohorts/` endpoint is blocked by the proxy allowlist. Cohort data appears to be entirely server-rendered and not exposed through client-side API calls.

---

## Notion Embedded Content (Public API Access)

Both Notion-embedded pages (`/burn` and `/wiki`) are **publicly accessible without authentication** via Notion's unofficial API. Content can be scraped server-side with no cookies or tokens required.

### Notion Space
- **Space ID**: `7a608cec-40d3-46d7-9c98-4b88c7fef057`
- **Domain**: `nsinternal` (internal.ns.com)

### Scraping API

#### `POST https://nsinternal.notion.site/api/v3/loadCachedPageChunkV2`
- **Auth Required**: No
- **Request body**:
  ```json
  {
    "page": { "id": "<page-id>" },
    "limit": 30,
    "cursor": { "stack": [] },
    "chunkNumber": 0,
    "verticalColumns": false
  }
  ```
- **Returns**: Full page content as a `recordMap` containing blocks, their properties, and rich text content
- **Pagination**: Increment `chunkNumber` for additional chunks; response includes cursor info for next page
- **Response size**: ~100-220KB per page depending on content

#### `POST https://nsinternal.notion.site/api/v3/getPublicPageData`
- **Auth Required**: No
- **Request body**:
  ```json
  {
    "type": "block-space",
    "name": "page",
    "blockId": "<page-id>",
    "requestedOnPublicDomain": false,
    "showMoveTo": false,
    "saveParent": false,
    "projectManagementLaunch": false,
    "configureOpenInDesktopApp": false,
    "mobileData": { "isPush": false }
  }
  ```
- **Returns**: Page metadata including `publicAccessRole`, `requireLogin`, space info, and page properties

### Known Page IDs

#### Burn
- **Page ID**: `1f1ce828-e747-8097-a35d-efa4a797fa97`
- **Title**: "Welcome To NS Burn"
- **Public access**: `publicAccessRole: "reader"`, `requireLogin: false`
- **Embedded on ns.com via**: Direct iframe to `nsinternal.notion.site`
- **Content**: ~221KB via API

#### Wiki
- **Root Page ID**: `1cf95087-93a7-45b4-a25d-ec99f85b8ba4`
- **Embedded on ns.com via**: `notioniframe.com` proxy (`notioniframe.com/notion/26bncdt59cv`)
- **Known subpages** (discoverable by fetching root and extracting child page blocks):

| Subpage | Page ID |
|---------|---------|
| Visas | `1339cdd3-f006-815a-84d2-dafbb98ce729` |
| Air Travel | `1339cdd3-f006-8181-9f78-c575dabbefe2` |
| (more discoverable recursively from root) | |

### Notes
- Content is fetched from Notion's **unofficial** API (`/api/v3/`), not the official Notion API
- The `nsinternal.notion.site` domain suggests internal content, but public read access is enabled on these pages
- Child pages can be discovered by parsing `page` type blocks from the parent's `recordMap`
- CORS blocks browser-side fetches from ns.com to nsinternal.notion.site, but server-side fetches work without restriction

---

## External Services

| Service | Domain | Purpose |
|---------|--------|---------|
| Privy | `privy.ns.com`, `auth.privy.io` | Authentication & wallet |
| Notion | `nsinternal.notion.site` | Burn calendar, Wiki |
| Fillout | `server.fillout.com`, `forms.fillout.com` | PGX, Visa, Fellowship forms |
| FeedMe | `v3.feedme.cc` | Food menu |
| Mux | `stream.mux.com` | Video hosting/streaming |
| Intercom | `api-iam.intercom.io` | Chat support |
| PostHog | `us.i.posthog.com` | Product analytics |
| Sentry | `o4509591673569280.ingest.us.sentry.io` | Error tracking |
| Ahrefs | `analytics.ahrefs.com` | SEO analytics |
| WalletConnect | `explorer-api.walletconnect.com` | Wallet connection |
