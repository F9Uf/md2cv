# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-15
**Phases:** 3 | **Plans:** 6 | **Sessions:** 2

### What Was Built
- Vite 5 + React 18 + TypeScript + Tailwind CSS v4 app shell with responsive split-pane and mobile tabs
- CodeMirror 6 editor + markdown-it token-walker parser with live preview and three switchable templates
- Full storage layer (localStorage auto-save/restore) + PDF export (html2pdf.js) + .md import/export

### What Worked
- Coarse granularity (2 plans per phase) kept phases focused and well-scoped — no mid-phase drift
- Human verification checkpoints caught the oklch/html2canvas crash before it was called "done"
- isInternalChange ref pattern for CodeMirror controlled sync worked cleanly on first attempt
- Initializing resumeData from the same localStorage source as markdownContent eliminated the empty-state flash

### What Was Inefficient
- REQUIREMENTS.md checkbox tracking fell behind — traceability table showed "Pending" for requirements that were actually shipped. Tracking should be updated at plan completion, not left for milestone archival.
- Two parallel style systems (templateStyles.ts + templateInlineStyles.ts) are maintenance overhead introduced by html2pdf.js's old html2canvas. Worth revisiting if upgrading PDF export library.

### Patterns Established
- `isInternalChange` ref guard for CodeMirror external prop sync
- Lazy `useState` initializer for localStorage reads (avoids extra effect on mount)
- Parallel inline-style map alongside Tailwind class map when third-party libs can't handle CSS custom properties
- Hidden off-screen DOM element (`left: -9999px`, `width: 794px`) for PDF capture via html2pdf.js

### Key Lessons
1. **Verify PDF export early** — html2canvas/html2pdf oklch incompatibility with Tailwind v4 is a known landmine. Test PDF generation before considering the plan complete.
2. **Update requirement checkboxes at plan commit time**, not at milestone archive — stale tracking creates unnecessary uncertainty at close.
3. **Vite version is pinned to Node.js engine** — document the Node.js version constraint explicitly (v20.11.0 → Vite 5 max) to avoid re-discovering it.

### Cost Observations
- Model mix: sonnet-dominant (balanced profile)
- Sessions: 2
- Notable: 6 plans executed in ~2 days; coarse granularity kept individual plans short and atomic

---

## Milestone: v1.1.0 — Support text styles & HTML

**Shipped:** 2026-04-24
**Phases:** 1 | **Plans:** 2

### What Was Built
- MarkdownIt configured with `html: true` for full HTML pass-through
- Bullet details stored as HTML strings via `md.renderInline()` — bold, italic, code, links in bullet points
- Preview.tsx and ExportTarget.tsx updated to render detail items via `dangerouslySetInnerHTML`

### What Worked
- Single-phase milestone kept scope tight and execution fast
- renderInline() was the right call — wraps no `<p>` tags, clean output for list items

### What Was Inefficient
- Verification status left as `human_needed` — carried forward until v1.2.0 close rather than resolved promptly

### Patterns Established
- `html: true` as the MarkdownIt default for personal tools (XSS accepted, no multi-user surface)
- `dangerouslySetInnerHTML` pattern for `<li>` detail items — consistent with existing `extra` field pattern

### Key Lessons
1. **Close human verification prompts at the end of the session** — leaving them as `human_needed` creates noise at milestone close.

---

## Milestone: v1.2.0 — Support render HTML with Tailwind classes

**Shipped:** 2026-04-26
**Phases:** 2 | **Plans:** 5

### What Was Built
- Token-walking parser replaced with `md.render()` — parseResume.ts reduced from ~120 lines to 5; ResumeData type eliminated
- Template styles restructured from semantic keys to HTML element tags (13-key TemplateClasses interface)
- CSS theme architecture with Tailwind v4 `@custom-variant` for scoped per-template element styles
- Tailwind Play CDN for runtime utility class resolution; DOMPurify configured with `ADD_ATTR: ['class']`

### What Worked
- Test-first (Plan 05-01 wrote failing tests before implementation) gave a clear RED → GREEN signal for the parser swap
- Discovering `@custom-variant` as the correct Tailwind v4 mechanism early prevented wasted time on `@layer base`
- Human browser verification checkpoint at plan 06-02 caught style tuning opportunities before ship

### What Was Inefficient
- DOMPurify stripping `class` attributes was caught only at verification, not during planning — should have been a noted risk in the Phase 6 plan
- `@reference "tailwindcss"` directive needed for `@apply` in separate CSS files wasn't documented in the plan; discovered during build

### Patterns Established
- `@custom-variant theme-X (.theme-X &)` for scoped Tailwind v4 CSS — valid alternative to `@layer base` descendant selectors
- `DOMPurify.sanitize(html, { ADD_ATTR: ['class'] })` when sanitizing user HTML that needs class passthrough
- Play CDN in `<head>` (synchronous, no defer) for runtime Tailwind class resolution

### Key Lessons
1. **Plan for DOMPurify attribute stripping** when wiring user-authored HTML through sanitization — `class`, `style`, and `href` are commonly stripped.
2. **Check Tailwind v4 `@apply` requirements upfront** — `@apply` in separate CSS files requires `@reference "tailwindcss"` directive.
3. **Test-first pays off for pipeline rewrites** — writing the HTML string contract tests before changing `parseResume.ts` made the migration mechanical and confident.

### Cost Observations
- Model mix: sonnet-dominant
- Sessions: ~4
- Notable: Phase 5 plan granularity (3 plans) was appropriate; Phase 6 (2 plans) was tight but executed cleanly

---

## Milestone: v1.3.0 — Support preview with realistic page

**Shipped:** 2026-05-21
**Phases:** 4 | **Plans:** 10

### What Was Built
- paged.js `Previewer` integrated — preview renders as real A4 page rectangles with auto multi-page flow and a live "Page X of N" pill (Phase 7)
- Four-input MarginControls strip with localStorage persistence and live `@page` reflow on margin change (Phase 8)
- ResizeObserver-driven CSS `zoom` auto-fit — desktop and mobile (≤767px) preview always fits without horizontal scroll (Phase 9)
- Unified paged.js render path for preview *and* PDF export via dedicated `<PrintMount/>` + `position: fixed; visibility: hidden` cloak; retired `templateInlineStyles.ts`, `ExportTarget`, and `html2pdf.js` (Phase 10)
- 21 dead transitive packages dropped from `package-lock.json`; tech-stack docs reconciled with the new pipeline

### What Worked
- **Three-source cross-reference at audit time** (VERIFICATION.md / human UAT / REQUIREMENTS.md traceability) caught all stale checkboxes and a stray phase directory cleanly before close — the audit format paid for itself
- **Phase 9's `pageCount !== null` gate** pattern (defer scale until after paged.js renders) was a discovery during human UAT that resolved both desktop blink and mobile feedback loop in one move
- **`PrintMount` extraction at Phase 10-03** instead of CSS-resetting `<Preview/>` chrome in `@media print` removed the bleeding-chrome bug class entirely — a small refactor that resolved an entire failure mode
- **Inline fix-during-verification** for the two Phase 10 regressions (commit `738bea4`) was the right judgment call — small, clearly belonged with Plan 10-01's core wiring, and avoided a discuss/plan/execute cycle for a ~50-line print-pipeline fix
- **Quick-task discipline** held up well: `260518-vgl` (StrictMode duplicate first-page) and `260521-m56` (preview blink on reflow) were small, focused, and committed cleanly — neither bled into the milestone scope

### What Was Inefficient
- **REQUIREMENTS.md traceability checkboxes drifted again** (PREV-01/02/03, MARG-01/02/03, ZOOM-01 all stale at audit time despite being verified) — same v1.0 lesson resurfaced for the *third* milestone. The lesson is not "remember to update checkboxes"; it's "the workflow does not enforce checkbox sync at plan complete time."
- **Stray phase 06 directory** (`06-use-html2canvas-jspdf-for-render-preview-and-exported-pdf-in/`) sat untracked in `.planning/phases/` from a v1.2 era abandoned approach — should have been deleted when that approach was discarded, not at v1.3.0 close
- **Phase 7 frontmatter `status: complete` lagged body `human_needed`** even after `07-HUMAN-UAT.md` recorded all-pass approval — the body never got reconciled
- **Phase 10 had no phase-level `10-VERIFICATION.md`** — sign-off lived only in plan-scoped `10-03-VERIFICATION.md`. The matrix is unambiguous but the artifact name breaks the per-phase convention
- **CSS `zoom` rediscovered late** — started Phase 9 with `transform: scale()` + clip container, hit blink + multi-page clipping, rewrote to CSS `zoom`. The "zoom affects layout, transform doesn't" distinction would have been worth a planning-time spike (~10 min)

### Patterns Established
- **Two-Previewer pattern:** on-screen `<Preview/>` (full chrome) + off-screen `<PrintMount/>` (minimal mount) both running their own paged.js `Previewer` instances — single source of truth for paged.js rendering, zero on-screen chrome in PDFs
- **`position: fixed; visibility: hidden` cloak** instead of `left: -9999px` for off-screen elements that must remain reachable by the browser print engine (the negative-offset technique removes the element from print flow)
- **`@page { margin: 0 }` in `@media print`** when paged.js's per-page margins are already baked into `.pagedjs_page` — prevents the browser's print engine from double-gutterring
- **`pageCount !== null` gate on layout-affecting scale** — paged.js measures the natural A4 size first; auto-fit zoom applies after pagination resolves
- **Hardcoded reference width (793.7px for A4)** to break ResizeObserver feedback loops when an ancestor `transform`/`zoom` makes `getBoundingClientRect()` lie

### Key Lessons
1. **Verify the *full* path that ships** — preview-looks-right is not the same as PDF-looks-right. The Phase 10 regressions (bleeding chrome, `left: -9999px`) only surfaced when an actual PDF was generated and opened. Verification must hit the real Save-as-PDF dialog, not just the screen render.
2. **Decouple "off-screen for paged.js measurement" from "off-screen for the user"** — those are two different requirements, and a single CSS technique can satisfy one while breaking the other. `position: fixed; visibility: hidden` separates them cleanly.
3. **Spike CSS `zoom` vs `transform: scale` before committing to one** — they look interchangeable but `zoom` affects layout (so clip containers and ResizeObservers behave correctly), while `transform` is paint-only (so layout coordinates lie). 10-minute spike would have saved Phase 9's first-attempt rewrite.
4. **The third recurrence of the same lesson is a workflow signal, not a memory issue** — REQUIREMENTS.md checkbox drift has now appeared at v1.0, v1.2.0, and v1.3.0 close. Worth a small workflow change at plan-completion time (e.g., `gsd-sdk query requirements.mark-complete REQ-IDs` in the plan-close template).
5. **Inline fix-during-verification is acceptable when the fix is small, the bug clearly belongs to the plan being verified, and you re-run the full verification matrix after** — the alternative (defer to gap-closure plan) is expensive for ~50-line fixes.

### Cost Observations
- Model mix: opus-dominant for plan/discuss; sonnet-dominant for execute (balanced profile)
- Sessions: ~5 (Phase 7 context → exec, Phase 8/9/10 each context → exec, plus 10-03 verification + bug-fix cycle)
- Notable: Two regressions caught at verification time (cost ~25 minutes including re-verify) were cheaper than a full gap-closure phase would have been (~1 hour minimum)

---

## Milestone: v1.4.0 — Support GitHub repository

**Shipped:** 2026-07-06
**Phases:** 3 | **Plans:** 18

### What Was Built
- Vercel serverless function (`api/github-auth.ts`) for GitHub OAuth token exchange — client secret stays server-side; `VITE_AUTH_ENDPOINT` env var makes host portable (Phase 11)
- `useGitHubAuth` hook + 5-state header auth UI — signed-out / loading / signed-in with avatar/dropdown / error / dismissible-error (Phase 11)
- `githubRepo.ts` (5 async functions) + `useRepoSync` hook — auto-pull on load, keep-local/take-remote conflict modal, manual commit+push, dirty dot indicator (Phase 12)
- PickerDialog (repo → branch → file) + CommitDialog + toolbar regrouping — GitHub sync grouped with import/export; PDF stays separate (Phase 12)
- `buildFileTree` + `useRepoTree` + `FileSidebar` — VS Code-style nested folder tree, auto-expand on active file, `DirtySwitchDialog` interception for safe switching (Phase 13)

### What Worked
- **One-hook-per-concern discipline** — `useGitHubAuth` owns auth state, `useRepoSync` owns sync state, `useRepoTree` owns tree state; clean interfaces between them
- **TDD for pure data functions** (`buildFileTree`, `pathsToExpand`, githubRepo API module) — red-green-refactor gave high confidence in the most complex logic before any UI was wired
- **Human-verify checkpoints at the end of each phase** caught real integration issues (WR-01, WR-02, WR-03 from Phase 13) before they became cross-phase bugs
- **Code-review step surfacing WR-xx items** gave a structured channel to surface deferred-but-real issues; pattern held cleanly across all three phases

### What Was Inefficient
- **REQUIREMENTS.md traceability checkboxes drifted again** — all 13 requirements showed "Pending" at milestone close despite all being shipped; same lesson as v1.0 / v1.3.0. Structural workflow fix still deferred.
- **`useRepoSync` grew to ~300 lines** during Phase 12 without a refactor pause — splitting into `useRepoConfig` + `useRepoActions` would have kept the hook testable; deferred to tech debt

### Patterns Established
- **`VITE_AUTH_ENDPOINT` env-var abstraction** for serverless function location — lets the token-exchange host change without touching app source
- **`DirtySwitchDialog` interception at navigation time** — check for unsaved changes when the user clicks a file, not at commit time; prevents accidental content loss
- **`buildFileTree` folders-first ordering** with implied intermediate folder creation — handles GitHub's flat tree API response reliably
- **`pathsToExpand(filePath)`** helper pattern — derives ancestor folder paths for auto-seeding expand state; separable from tree rendering

### Key Lessons
1. **OAuth web flow for SPAs needs a server-side exchange step** — client-only OAuth exposes the client secret; Vercel serverless function is the minimal correct shape.
2. **`useRepoSync` complexity signals a split-hook boundary** — when a hook exceeds ~200 lines and covers distinct concerns (persistence vs. network actions), plan a refactor phase.
3. **REQUIREMENTS.md checkbox drift is a workflow problem, not a discipline problem** — this is the 4th milestone with the same observation. Worth adding `gsd-sdk query requirements.mark-complete` to the plan-completion template.
4. **Human-verify checkpoints at phase boundaries are effective bug filters** — WR-01/02/03 were all real issues that would have reached production without them.

### Cost Observations
- Model mix: sonnet-dominant (balanced profile)
- Sessions: ~4 (Phase 11 discuss+plan+execute, Phase 12 execute, Phase 13 execute, milestone close)
- Notable: 18 plans executed across 3 phases in ~2 days; wave-based parallelization kept individual sessions focused

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 2 | 3 | Initial project — baseline established |
| v1.1.0 | 1 | 1 | Inline HTML/markdown rendering in bullets |
| v1.2.0 | ~4 | 2 | Parser rewrite + Tailwind CSS runtime |
| v1.3.0 | ~5 | 4 | paged.js preview + unified PDF pipeline; html2pdf.js retired |
| v1.4.0 | ~4 | 3 | GitHub OAuth + repo sync + VS Code-style file tree sidebar |

### Cumulative Quality

| Milestone | Tests | LOC (src TS/TSX) | Notes |
|-----------|-------|-----------|-------|
| v1.0 | 0 | ~1,100 | Baseline |
| v1.1.0 | 0 | ~1,100 | Minimal code change |
| v1.2.0 | 15 | ~633 | Parser simplification reduced LOC significantly |
| v1.3.0 | 15 | ~990 | +`<MarginControls/>`, +`<PrintMount/>`, rewired Preview/App/CSS for paged.js — net +357 LOC |
| v1.4.0 | ~30 | ~3,651 | +GitHub OAuth, API lib, sync hook, tree components — net +2,660 LOC |

### Top Lessons (Verified Across Milestones)

1. Test PDF/canvas-based exports early — third-party rendering libraries have CSS compatibility constraints that surface late. (v1.0 → v1.3.0)
2. Keep requirement tracking live during execution — stale checkboxes create unnecessary review work at milestone close. (v1.0, v1.2.0, v1.3.0, **v1.4.0 — fourth recurrence; workflow change needed**)
3. Close human verification prompts within the same session — leaving them open carries noise into future milestone close. (v1.1.0)
4. DOMPurify strips `class` and other attributes by default — plan for this when sanitizing user-authored HTML that needs passthrough. (v1.2.0)
5. Decouple "off-screen for the print engine" from "off-screen for the user" — different requirements, different CSS techniques. (v1.3.0)
6. Spike CSS layout-affecting properties (`zoom`, `display: contents`, container queries) before committing — they often look interchangeable with paint-only counterparts (`transform`, `visibility`) but break differently. (v1.3.0)
7. OAuth SPAs need a server-side token exchange step — the client secret cannot be in the browser bundle; a minimal serverless function is the correct boundary. (v1.4.0)
8. When a hook exceeds ~200 lines across distinct concerns, plan a refactor phase — the complexity signals a split-hook boundary that will compound if deferred further. (v1.4.0)
