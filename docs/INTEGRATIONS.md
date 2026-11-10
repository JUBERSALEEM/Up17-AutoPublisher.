# Official integration capability and approval register

**Research date:** 2026-11-08 UTC; **implementation update:** 2026-11-10 UTC. **Implementation status:** server-only OAuth broker implemented and database-tested, LIVE-NOT-RUN / BLOCKED for every provider. This is documentation research plus reviewed adapter code, not a live API capability test. Recheck official sources, app eligibility and granted scopes before each integration milestone; do not turn a documented endpoint into a promise of production access.

Evidence classes: **DOC** = official documentation read/search result; **LIVE-NOT-RUN** = requires authorized app/account; **CONFLICT** = official pages/search extracts disagree; **ACCESS-LIMITED** = official page could not be fully fetched in this environment. No unofficial scraping, browser automation or commercial research-API assumption is allowed.

## Batch D implementation boundary — 2026-11-10

`lib/connections/providers.ts` uses the official Google OAuth web-server flow, Instagram Business Login and TikTok Login Kit authorization URLs. It requests YouTube `youtube.readonly` + `youtube.upload`, Instagram `instagram_business_basic` + `instagram_business_content_publish`, and TikTok `user.info.basic` + `video.publish`. Google uses base64url S256 PKCE; Instagram explicitly has no PKCE verifier; TikTok uses hex SHA256 S256. Token exchange, identity lookup, refresh and revocation use official endpoints only. Current references: [Google web-server OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps), [Instagram Platform overview](https://developers.facebook.com/docs/instagram-platform/overview/), [Instagram Access Token](https://developers.facebook.com/docs/instagram-platform/reference/access_token/), [Instagram Refresh Access Token](https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/), [TikTok Login Kit](https://developers.tiktok.com/doc/login-kit-desktop/) and [TikTok Direct Post prerequisites](https://developers.tiktok.com/docs/en/content-posting-api-get-started).

The hosted rollback broker fixture verifies state/binding, single-use attempts, actor/workspace checks, encrypted synthetic credentials, refresh leases, health, disconnect and browser-write denial. It does not call a provider. Live connections require the owner to create the apps, configure exact redirect URIs, complete review/audit, supply secrets and test with real accounts; see [Batch D report](BATCH_D_CONNECTIONS_REPORT.md) and [owner setup](OWNER_SETUP.md). Publishing remains disabled and no capability/eligibility result is claimed.

## 1. YouTube — proposed first live integration

### Candidate capabilities and scopes

YouTube Data API v3 supports authorized video upload and metadata operations; `videos.insert` accepts media upload and requires one of `youtube.upload`, `youtube`, `youtubepartner` or `youtube.force-ssl` [1](https://developers.google.com/youtube/v3/docs/videos/insert). Start with the narrowest workable combination, not broad account access by default. `youtube.readonly` reads account data; non-monetary analytics uses `yt-analytics.readonly` [2](https://developers.google.com/identity/protocols/oauth2/scopes). Additional comment/thumbnail operations need capability-specific scope checks; a upload-only token must not be shown as able to edit everything.

| Product action | Candidate official surface | Gate / limitation |
|---|---|---|
| Connect channel(s) | Google OAuth server code flow; enumerate/select authorized channels | Verify actual channel identity and granted scopes; OAuth verification/consent requirements are LIVE-NOT-RUN |
| Upload original/variant | Data API `videos.insert`, resumable media session | Persist session URI securely server-side; reconcile interrupted upload; account/channel limits may differ from project quota |
| Metadata/visibility/schedule | `videos.insert` / `videos.update` | `publishAt` requires private video never previously published; updates can erase omitted mutable fields, so read/merge carefully [1](https://developers.google.com/youtube/v3/docs/videos/update) |
| Thumbnail | `thumbnails.set` | Account eligibility and current size/format rules need live verification; do not promise custom Shorts thumbnail parity |
| Pinned comment | No pin operation in documented comment resource methods; suggestion only initially | Comment posting and pinning are distinct. Do not claim automatic pinning; the documented methods do not establish a pin capability [1](https://developers.google.com/youtube/v3/docs/comments) |
| Channel/video analytics | Analytics API v2 targeted reports | Views, estimated watch time, average duration and supported subscriber/traffic dimensions depend on report/filter combination [1](https://developers.google.com/youtube/analytics/channel_reports) |
| Bulk/reach/retention reports | Reporting API | Reporting supports bulk reach reports (thumbnail impressions/CTR); availability differs from targeted Analytics and not every Studio report is exposed [1](https://developers.google.com/youtube/reporting) |

### Quota and approval uncertainty

The current official upload reference retrieved in Phase 0 states a default **100 upload calls/day**, one unit in a separate Video Uploads bucket; the official overview likewise describes separate upload/search budgets and 10,000 units for other endpoints [1](https://developers.google.com/youtube/v3/docs/videos/insert) [1](https://developers.google.com/youtube/data/getting-started). Older articles still quote 1,600 units/upload. Do not hard-code either historical blog number: read the approved project's actual quotas and recheck revision history at M7.2/M9.3.

**CONFLICT:** older guidance says unaudited projects force private uploads, while the current official `videos.insert` page retrieved now says unverified API projects are **not** restricted to private viewing [1](https://developers.google.com/youtube/v3/docs/videos/insert). Treat public publishing eligibility as unresolved until verified for the owner's actual project; OAuth verification, API compliance review and quota needs must still be checked. Never use the newer wording to bypass an approval gate or publish publicly during testing.

Thumbnail sources also conflict: an older reference says 2 MB, while the official revision history reports an increase to 50 MB in September 2026 [2](https://developers.google.com/youtube/data/revision_history). Verify current endpoint/account behavior before validation constants are committed.

### Test gate

Authorized test channel; private upload first; confirm video ID/processing/visibility and metadata without overwriting omitted fields; interrupted-session resume; scope denial; quota/rate-limit handling; Analytics report with source timestamps; Reporting job availability. Public posting needs separate owner approval and verified project eligibility. No YouTube API performs AI gameplay understanding.

## 2. Instagram Reels — second live integration

Meta currently documents Unified Login, Instagram Login and Facebook Login paths. Unified Login is described as recommended for new integrations; Instagram Login supports professional Business/Creator accounts without requiring a Facebook Page, while Facebook Login uses a linked Page [1](https://developers.facebook.com/docs/instagram-platform/). Choose the path after an approved app/account eligibility spike; do not assume all paths/scopes/metrics are identical.

For Instagram Login, publishing documentation lists `instagram_business_basic` and `instagram_business_content_publish`; Facebook Login lists `instagram_basic`, `instagram_content_publish`, `pages_read_engagement` and conditional Business Manager permissions [5](https://developers.facebook.com/docs/instagram-platform/content-publishing/). Request only the chosen path's required scopes. Personal/consumer accounts are not a supported fallback. Page Publishing Authorization and linked-Page task requirements apply where relevant, not universally to every login path.

### Reels workflow and constraints

Create a `REELS` media container using a fetchable video URL or a supported resumable upload path, wait for processing eligibility, then publish the container and save its returned ID [5](https://developers.facebook.com/docs/instagram-platform/content-publishing/). URL-pull media must be publicly reachable at attempt time. Resumable upload availability is login-path dependent. Store container ID and status across worker restarts; a container ID is not a published post ID.

The current media reference specifies MOV/MP4, H264/HEVC, AAC, 3 seconds–15 minutes and 300 MB maximum for Reels, with detailed codec/frame/bitrate/cover rules [2](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media). These are source snapshots, not permanent constants; validate current account/API rules before release. Cover support includes `cover_url`/frame offset; feed cropping differs from Reel aspect ratio. Do not promise unsupported music, alt-text or interaction features.

**CONFLICT:** the current publishing guide says 100 API-published posts per moving 24 hours, while the `media_publish` reference says 50 [5](https://developers.facebook.com/docs/instagram-platform/content-publishing/) [1](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media_publish). Query `content_publishing_limit` for the actual account/app quota and defer rather than hard-code 100. Containers expire after 24 hours; the media reference also documents a rolling container-creation cap [2](https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media). Schedule from our durable job, not by creating distant-future containers.

### Analytics and research

Media insights expose different fields by product type/login path; Reels candidates include reach, likes, comments, shares, saved/interaction and watch-time-related metrics, with some marked estimated/in development [1](https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights). Do not assume YouTube-equivalent retention, traffic sources or CTR. Some older examples use deprecated impressions/follower metrics; the exact current account-insights endpoint returned no usable content in this audit. Audience activity remains **LIVE-NOT-RUN / verify endpoint and eligibility**; use conservative account post-performance fallback when unavailable.

Hashtag/business discovery is path- and permission-limited. It is not a general keyword-volume/trend feed. No scraping or unauthorized competitor collection.

### Test gate

Approved Meta app/access level and professional test account; chosen login path; partial scopes; container processing/error/expiry; public media URL cleanup or verified resumable path; quota lookup; account-specific publish ID; supported insight retrieval and missing-metric state. App Review/Business Verification requirements are owner/platform dependencies, not tasks silently completed by code.

## 3. TikTok — third live integration

TikTok Direct Post uses `video.publish`; draft/inbox upload uses `video.upload`. Profile/stat/video read scopes are separate (`user.info.basic`, `user.info.profile`, `user.info.stats`, `video.list`) [1](https://developers.tiktok.com/docs/en/tiktok-api-scopes). Display API reads the authorizing creator's profile/videos; it is not arbitrary competitor search [2](https://developers.tiktok.com/docs/en/display-api-overview?enter_method=left_navigation).

Direct Post sequence: query current creator info, render required consent/metadata UX, initialize `FILE_UPLOAD` or verified `PULL_FROM_URL`, transfer media, poll publish status and persist the real terminal result [2](https://developers.tiktok.com/docs/en/content-posting-api-get-started). Privacy must match returned options; duration must respect the creator-info maximum. Cover timestamp and comment/duet/stitch settings are supported only as documented/returned [1](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post).

**Audit restriction:** official Direct Post guidance says unaudited clients are private-only; sharing guidelines describe a five-user/24-hour cap and private accounts with `SELF_ONLY` visibility [1](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post) [3](https://developers.tiktok.com/docs/en/content-sharing-guidelines). Public automatic publishing is blocked until the actual client passes required audit. A draft upload is not a published post and must be labelled accordingly.

**Automation conflict:** guidelines require current creator info, editable content, a manually selected privacy value with no default, required disclosure/consent and explicit send action [3](https://developers.tiktok.com/docs/en/content-sharing-guidelines). The product cannot promise unattended per-video TikTok publishing while ignoring these rules. D-016 proposes preserving required per-post consent/privacy steps; investigate any officially approved recurring authorization behavior with TikTok before relaxing them. No browser automation workaround.

**ACCESS-LIMITED:** TikTok pages were found through official-domain search extracts, but direct page fetches returned HTTP 403. Re-read the current guidelines in an authorized browser/integration spike before implementation. Do not treat third-party summaries as authoritative permission to automate.

TikTok Research Tools are for approved independent/academic non-profit research, not a default commercial creator trend source. The official overview requires application/approval and terms compliance [1](https://developers.tiktok.com/docs/en/about-research-api). This product does **not** assume eligibility. Use approved lawful sources or owner-provided research; otherwise show research unavailable.

### Test gate

Approved developer app/products/scopes and private test creator; current creator-info UX; missing/partial scope; unaudited restriction; upload chunk/status reconciliation; verified URL ownership if used; quota/rate limits; terminal success only; disconnect/refresh. Analytics limited to actually returned profile/video fields; no assumed audience-hour data.

## 4. Other provider ports — no provider selected

| Port | Planned contract | Unresolved approval |
|---|---|---|
| Object storage | Create scoped resumable intent, verify completion, signed read/delete, platform delivery object | Supabase project/storage authorization; emulator capability proof |
| Queue | Enqueue/lease/heartbeat/complete/retry/dead-letter with idempotency | Local pg-boss evaluation; worker host/budget |
| Video/audio analysis | Versioned structured observations with timestamps/evidence/confidence/unknowns | Multimodal provider, data terms, evaluation set, per-job cost ceiling |
| Language generation | Account/platform schema, grounded claim references, versioned output | Provider/budget; no training on creator content without permission |
| Research | Query permitted sources, return attribution/freshness/relevance and save brief | Lawful source/license and budget; no source connected |
| Notifications | In-app first; optional email/push port later | No external delivery provider authorized |
| Observability | Redacted structured logs/traces/metrics and alerts | Hosting/error-tracking provider and privacy review |

## 5. Integration definition of done

A connection is not “working” because an SDK compiles or a mock passes. Record official source/version/date, owner resource authorization, app review state, granted scopes, test account identity redacted as appropriate, exact test commands/scenarios, sanitized response evidence, supported limitations and failure/refresh/revoke results. Update capability flags and traceability only from that evidence. Each platform can remain blocked independently without misrepresenting the others.
