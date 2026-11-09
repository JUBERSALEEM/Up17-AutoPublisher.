# Claymorphism UX and design system

**Status:** Batch 1 foundation IMPLEMENTED / TESTED locally; application screens IN PROGRESS. The goal is a distinctive creator workflow studio, not a generic analytics/admin template.

## 1. Experience principles

- **One video, many independent destinations.** Show shared source media, then account-specific packages and outcomes; never imply one caption/schedule/credential serves every account.
- **Tactile, calm, legible.** Soft surfaces and physical press feedback support hierarchy. Avoid neon, excessive glass, giant shadows and decorative charts.
- **Truth before polish.** Persistent demo indicator; textual state badges; unavailable metrics have explanations, not invented zeroes.
- **Phone is the primary device.** Upload, preview, correct, schedule, pause and retry without desktop-only controls.
- **Automation remains understandable.** Show why a time/content choice was recommended and what requires attention. Platform-mandated consent cannot be hidden by an automation toggle.

## 2. Semantic tokens and candidate palette

Central CSS variables, consumed by reusable components and Tailwind utilities. Palette values below are starting tokens; contrast tests must pass before acceptance. State is never communicated by color alone.

| Token | Light candidate | Dark candidate | Use |
|---|---|---|---|
| `--background` | `#F5F3FA` | `#111522` | Warm lavender / deep navy canvas |
| `--surface` | `#FAF9FD` | `#1A2030` | Standard clay surface |
| `--surface-raised` | `#FFFFFF` | `#242C40` | Raised cards and active controls |
| `--surface-inset` | `#EEEBF5` | `#151B29` | Inputs, wells and pressed controls |
| `--text` | `#20243A` | `#F4F5FB` | Primary text |
| `--muted` | `#62677D` | `#B2B9CC` | Secondary text; verify contrast |
| `--primary` | `#6246C7` | `#B6A2FF` | Primary action; pair with appropriate contrast token |
| `--secondary` | `#147D89` | `#72D5DD` | Restrained supporting accent |
| `--success` | `#24734F` | `#79D6AA` | Text/badge accent, not sole signal |
| `--warning` | `#946000` | `#F0C572` | Attention/review |
| `--danger` | `#B44747` | `#FFAAAA` | Destructive/error |
| `--border` | `#DED9EB` | `#35405A` | Subtle edge definition |

Additional required tokens: `--shadow-raised`, `--shadow-inset`, `--focus-ring`, `--primary-foreground`, semantic foreground/background pairs, spacing, radius, typography and motion. Raised shadows combine a soft ambient shadow and subtle top highlight; dark theme uses surface separation rather than enormous black glows. No more than one restrained gradient in a focal area.

## 3. Geometry, typography and motion

- Cards: 24px default radius within required 20–28px range; compact panels 20px. Buttons/badges pill-shaped; inputs 14–16px.
- Spacing scale: 4/8/12/16/24/32/48px. Mobile page gutter 16px, minimum 12px at 320px only when needed.
- Touch targets at least 44×44px, preferred 48px; adequate separation for destructive actions.
- Body 16px minimum for primary mobile content; supporting text generally 14px, never tiny critical instructions. Strong heading scale and short line lengths.
- One locally hosted modern sans family, preferably Inter or Geist, with system fallback; one Lucide icon style. Icon-only controls have accessible names and tooltips where helpful.
- Motion 120–200ms for hover/press/state changes; no looping attention animations. `prefers-reduced-motion` removes nonessential transforms/transitions.
- Focus ring always visible against raised/inset surfaces. Do not remove outlines in favor of shadow-only focus.

## 4. Primitive contract

| Component | Required behavior/states |
|---|---|
| ClayCard / Panel | Raised/inset/flat variants, semantic heading structure, optional action slot; no nested clickable cards |
| Button / IconButton | Primary/secondary/ghost/danger; hover, pressed-inset, focus, loading/disabled; stable width during async labels; 44px+ target |
| Input / Select / Textarea | Inset surface, persistent label, description/error linked by aria-describedby; character/byte counters where relevant |
| Badge / StatusBadge | Icon + text label; all connection/job/analysis states; source/freshness visible near data |
| Dialog / ConfirmAction | Accessible modal/focus trap/escape/return focus; destructive confirmation names object and consequences |
| Menu / Popover / Tabs | Keyboard support, correct roles/selected state, outside dismissal, mobile-safe positioning |
| Calendar / ScheduleItem | List alternative, keyboard reschedule, account/platform labels and timezone; drag is optional enhancement |
| Toast / Notification | Accessible announcement, actionable error link, deduplication; not the sole persistent error record |
| Empty / Loading / Error | Useful next action; skeleton matches layout; error retains context and retry; unavailable is distinct from empty |
| Chart | Real metric definition, readable axes/legend/tooltips, accessible summary/table, missing-data explanation; no ornamental data |
| DemoIndicator | Persistent shell indicator plus local **Demo data** / **Simulation** labels on sample accounts, metrics and actions |

Use native elements or an accessibility-reviewed primitive library; do not build inaccessible div-based controls. Automated axe checks supplement, not replace, keyboard/screen-reader review.

## 5. Shell and responsive navigation

All ten destinations: Overview, Video Studio, AI Content, Smart Scheduler, Publishing Queue, Creator Studio, Research Centre, Performance Lab, Accounts, Settings.

Shell includes original brand mark/wordmark, workspace selector/context, account context where relevant, notifications, theme switcher and profile menu. Demo has an explicitly simulated workspace context, not a fabricated signed-in user.

- **320–430px:** compact header; five-item bottom navigation (Overview, Video Studio, Content, Queue, More); More exposes every remaining destination and settings. Stacked cards, full-width primary actions, dialogs/sheets sized to visual viewport. No hover-only or drag-only action.
- **Tablet ~768px:** adaptive two-column bento; collapsible navigation if persistent sidebar would crowd content.
- **Desktop >=1024px:** persistent sidebar with all destinations; wider bento and optional drag-and-drop with keyboard alternative.
- Test 320, 360, 390, 430, 768 and 1440 CSS pixels; no page-level horizontal overflow. Tables/calendar may have contained, labelled scrolling only when no readable stacked alternative exists.
- Theme follows system initially, allows explicit light/dark choice and persists without flash. Account/workspace changes visibly update context and never leak previous-account content.

## 6. Screen composition and interaction inventory

| Screen | Distinctive composition | Primary interactions and necessary states |
|---|---|---|
| Overview | Workflow “upload → analyse → package → schedule” focal panel; asymmetric bento of attention, queue and recent media | Continue upload, review attention, inspect upcoming post; true empty first-run vs labelled demo; no fake connection totals |
| Video Studio | Mobile upload action first; media library with thumbnail/state; detail sheet with original/derivative lineage | File picker/drop, progress/resume explanation, search/sort/filter, preview, retry and confirmed delete; session-only demo clearly stated |
| AI Content | Source evidence rail + per-account tabs/cards; platform-shaped previews; timeline linked to evidence | Generate simulation, edit/correct, regenerate, compare versions, counters/validation, review/automation policy; unknown claims blocked |
| Smart Scheduler | Agenda-first mobile calendar; day/week/month switch; account lanes on wider screens | Filter, inspect recommendation reason/confidence, reschedule via accessible control, set windows/quiet/blackouts; sparse-data warning |
| Publishing Queue | Account-grouped operational list, attention first; attempt timeline in detail | Filter, pause/resume, cancel/reschedule, retry with eligibility explanation; failed/simulated jobs never look live |
| Creator Studio | Account selector then sourced metric panels and published-post library | Date/account/post filters, compare periods, inspect freshness/definition; unavailable/permission-limited/stale states |
| Research Centre | Topic cards with source/date/freshness and relevance rationale; saved brief drawer | Search simulation, verify source, save idea to brief, discard irrelevant trend; verified fact vs suggestion separation |
| Performance Lab | Experiment workbench with variables, sample coverage and limitations before result chart | Define experiment, choose account/metrics/window, compare supported groups, inspect uncertainty and next test; no causal badge |
| Accounts | Platform groups containing multiple distinct account cards; capability/permission matrix | Connect explanation (disabled in demo), enable/pause simulation, strategy/timezone, reauth/disconnect confirmation; no implied live OAuth |
| Settings | Grouped sections with sticky save feedback on mobile | Workspace/voice/niche/audience/language/defaults, automation/approval, frequency/windows, notifications/theme/accessibility, export/delete, services/security |

Analysis timeline belongs to Video Studio detail and is consumed by AI Content. It exposes timestamp, observed fact vs estimate, evidence reference, confidence and correction action. Audio findings and clip suggestions appear alongside visual events. Demo analysis is illustrative, never represented as actual model inference.

## 7. Content and status language

Use “Not connected,” “Demo mode,” “Connected,” “Syncing,” “Needs authorisation,” “Limited permissions,” “Error,” “Disconnected.” Job labels follow the domain state machine. “Upload accepted” ≠ “analysis ready”; “publish request accepted” ≠ “published”; “unavailable” ≠ zero.

Errors explain what happened, whether work is safe to retry and the next action. Do not expose provider tokens or raw responses. Full automation means no unnecessary repeated manual review after opt-in, **except** platform consent, safety, changed claims, missing permissions or other explicit intervention rules.

## 8. PWA, accessibility and acceptance

Manifest and original icons, install instructions and public-shell offline fallback; no offline publishing or sensitive response caching. Respect safe areas and mobile keyboard overlap. Maintain heading/landmark structure, focus order and readable zoom/reflow. Target WCAG 2.2 AA contrast and operability; record automated and manual evidence.

Each screen milestone includes populated/demo, applicable loading/empty/error and unavailable states; keyboard operation; 320/360/390/430/768/1440 checks; theme checks and no overflow. Visual review checks premium clay surfaces without legibility loss. Screenshots alone do not establish accessible behavior or working integrations.


## 9. Implemented foundation — UI Batch 1 (2026-11-08)

- Source of truth: `app/globals.css`; resolution/persistence contract: `lib/themes.ts` and `components/theme`. Four complete surfaces: Clay Light (default), Clay Dark, Bento Light, Bento Dark. Explicit saved choice wins; no saved choice follows system appearance within the Clay family. System mode removes the stored choice. A pre-paint script prevents the common initial flash; storage denial retains an in-memory choice.
- Implementation token names include `--surface-raised`, `--surface-inset`, `--shadow-raised`, `--shadow-pressed`, `--shadow-popover`, `--primary-soft`, `--accent`, and semantic soft backgrounds. The proposed `--secondary` cyan role is named `--accent` in implementation; `--secondary` is a neutral supporting text role. No screen-specific palette is introduced.
- Light accent/danger text was darkened to `#0f6b75` / `#a03535` after real axe contrast failures. Unit tests read the actual CSS and check core text across all surfaces and all semantic badge pairs in all four themes.
- Local Inter Variable and Lucide icons; no font CDN. Cards/buttons/fields/badges/dialog/tabs/empty/unavailable/skeleton primitives are available. Primitive examples perform real local interactions, not simulated publishing. Full menu/toast/chart and screen-state coverage continues in later batches.
- Evidence: [Batch 1 validation](evidence/ui-batch1-validation.txt). Four-theme preview axe scans pass; this does not imply the unfinished application has passed accessibility acceptance.


## 10. Implemented shell — UI Batch 2 (2026-11-08)

Canonical PLAN.md §7 navigation is preserved exactly: Overview, Video Studio, AI Content, Smart Scheduler, Publishing Queue, Creator Studio, Research Centre, Performance Lab, Accounts, Settings. Notifications is a persistent shell utility, not an eleventh main destination. Mapping to the requested visible areas: Video Studio supplies the library; Creator Studio supplies the video/metadata workspace; AI Content supplies gameplay analysis; Performance Lab supplies analytics/comparisons; Smart Scheduler and Publishing Queue remain separate as the brief requires.

Desktop uses a persistent grouped sidebar; below 1024px a five-slot bottom bar exposes Overview/Videos/Queue/Accounts/More. More contains all ten destinations plus Notifications and workspace context. Search is local navigation only (Ctrl/Cmd+K), not a fake global data query. Workspace/profile menus state that no authentication or additional workspace backend exists.

PWA caching is deliberately narrow: versioned `/_next/static/` assets, original icons and a data-free offline HTML fallback. Navigations are network-only with offline fallback; API/auth/query-string/media responses are never cached. Updates require an explicit user action. The offline fallback follows system light/dark rather than pretending to be the full themed application. Device-level install acceptance is not claimed from headless manifest/service-worker tests.


## 11. Core screen implementation — UI Batch 3 (2026-11-08)

Core screens use presentation-only fixtures under `features/demo`, not domain/database entities. Every sample surface carries Demo data/Simulation context; real connection counts remain zero and missing analytics are unavailable, not zero. Original schematic SVG artwork replaces real thumbnails/media and is labelled as demo artwork.

Video Studio implements local search/filter/sort, card/list views, selection and metadata details. Creator Studio edits independent per-platform browser-local drafts with validation, account selection, cover direction and optional demo timing; it never generates or publishes. Smart Scheduler provides day/week/month/agenda views and browser-local demo slots. Publishing Queue exposes independent demo job filters and attempt history with disabled live actions. Accounts shows multiple demo identities per platform, official OAuth requirements and local pause preferences without implying authorization.

Browser-local state is an explicit demo convenience, not persistence architecture. Drafts/slots/pause preferences use versioned local keys and survive reload; storage denial falls back to session memory with an honest notice. Full service contracts, real media, durable jobs and provider capabilities remain later approved phases.


## 12. Supporting screen implementation — UI Batch 4 (2026-11-08)

Settings centralizes appearance, local workspace profile, inbox category preferences, privacy export/reset and explicit automation boundaries. Preferences use a versioned local key and shared hook so the shell/dashboard reflect the saved workspace name. Reduced motion is a local override in addition to the device media query.

Notifications is a labelled demo inbox, not an event service. Read state and category visibility persist locally; no real publishing success, expiry or sync is implied. Research separates evergreen editorial prompts from unavailable live updates and stores user-authored briefs locally. AI Content shows generic timeline review points as an interface simulation, with unknown observations/confidence and no model run. Performance Lab keeps missing metrics unavailable while platform/account/date filters change only the report scope.

Local export reads only known application keys, never unrelated browser storage. Reset is confirmed and removes demo content while preserving theme/profile. These are frontend conveniences, not cloud export/deletion or security services.


## 13. Polish and verification — UI Batch 5 (2026-11-08)

The full eleven-destination surface (ten main areas plus Notifications) passes automated axe scans in Clay Light, Clay Dark, Bento Light and Bento Dark, and page-overflow/navigation checks at 320, 360, 390, 430, 768 and 1440px. Keyboard checks cover skip navigation, tab arrows/Home, dialog Escape/focus return and popover dismissal. A touch-phone journey covers mobile navigation, library search/details and local draft saving with 44px target assertions.

Reduced motion is respected both from the device media query and a saved local override. Storage denial keeps the app usable with explicit session-only notices. Coarse-pointer devices receive larger small-button/tab/toggle/checkbox targets while desktop density remains unchanged. These are automated local checks, not manual screen-reader or owner acceptance.
