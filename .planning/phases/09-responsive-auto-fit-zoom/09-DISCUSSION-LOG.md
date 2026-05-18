# Phase 9: Responsive Auto-Fit Zoom - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 09-responsive-auto-fit-zoom
**Areas discussed:** Scaling mechanism, Pane-width detection, Mobile (tab view) behavior

---

## Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Scaling mechanism | transform: scale() vs CSS zoom — standards, GPU acceleration, layout-flow tradeoffs | ✓ |
| Pane-width detection | ResizeObserver on Preview vs lifting split-pane ratio + window.resize | ✓ |
| Mobile (tab view) behavior | Same auto-fit as desktop, or special-cased on small viewports | ✓ |
| Scale floor / overflow handling | Minimum-scale floor for very narrow panes vs scale-infinitely | |

**Note:** Scale floor was not selected — defaults to "no floor" per Claude's discretion. Split-pane already enforces 20% min preview width and mobile floor is ~360px, both keep the page legible.

---

## Scaling mechanism

| Option | Description | Selected |
|--------|-------------|----------|
| `transform: scale()` | Web-standard, GPU-accelerated, smooth during drag. Leaves unscaled height in document flow — needs a height-compensation trick. Used by most resume/PDF tools (Overleaf, Google Docs print preview). | ✓ |
| `zoom` CSS property | Changes layout flow naturally (no empty-space problem). Historically non-standard; Firefox added support only in 2024 (FF 126+). Cleaner code if minimum Firefox support is fine. | |
| Hybrid: zoom + transform fallback | Use zoom where supported, transform: scale() otherwise. Most flexibility, more branches. Overkill for a personal tool. | |

**User's choice:** `transform: scale()`
**Notes:** Standards-conformant + ubiquitous browser support justified the choice despite the height-flow workaround.

---

## Vertical Flow Handling (follow-up to scaling mechanism)

| Option | Description | Selected |
|--------|-------------|----------|
| Compensated wrapper height | Wrap `.pagedjs_pages` in a div whose height = `natural-height × scale`, set in the same ResizeObserver loop. `transform-origin: top center` on the inner element. Canonical pattern. | ✓ |
| Negative margin trick | `transform-origin: top left` + negative `margin-bottom = naturalHeight × (1 - scale)`. Less code, more fragile. | |
| Accept the empty space | Don't compensate. Visually shrunk preview with gray void below. Simplest, but feels broken. | |

**User's choice:** Compensated wrapper height
**Notes:** Preserves accurate scrollbar and avoids the "blank void" UX. Computed in the same ResizeObserver callback that sets the transform.

---

## Pane-width detection

| Option | Description | Selected |
|--------|-------------|----------|
| ResizeObserver inside Preview | Preview.tsx observes its own outer container. Fires for split-pane drag and window resize. Fully self-contained — SplitPane, App, Preview stay decoupled. | ✓ |
| Lift split ratio + window resize | Move ratio state to App, pass as prop to Preview, also listen to window.resize. Two effect dependencies, more coupling. | |
| Both — belt and suspenders | ResizeObserver + window.resize fallback. Redundant since ResizeObserver already covers window resize. | |

**User's choice:** ResizeObserver inside Preview
**Notes:** Keeps Phase 9 surgical — App.tsx, SplitPane.tsx, and useSplitPane are untouched.

---

## Mobile (tab view) behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Same logic as desktop | ResizeObserver on Preview works identically regardless of parent (SplitPane vs MobileTabs). ~0.45 scale on 360px viewports, no horizontal scroll. | ✓ |
| Mobile-tuned floor | Same logic + minimum scale (e.g., 0.5) on small viewports; allow horizontal scroll below the floor. Adds a media-query branch. | |
| Mobile shows 1:1 with horizontal scroll | Skip auto-fit on mobile, show A4 at 100% and let user pinch-zoom / scroll. Desktop-doc feel on mobile. | |

**User's choice:** Same logic as desktop
**Notes:** ZOOM-01 says "no horizontal scrollbar" without device qualification — same rule on both surfaces.

---

## Claude's Discretion

- Optional CSS `transition` on the transform for resize polish
- Exact wrapper-vs-direct-style implementation for D-03
- Defensive `@media print` transform reset in `pages.css`
- ResizeObserver callback throttling / rAF batching (only if judder observed)
- `min-height: 0` / flex-shrink tweaks on Preview outer container if needed
- No scale floor — the gray area was not selected for discussion

## Deferred Ideas

- Scale floor / "too narrow" message
- Visible scale-percentage indicator ("75%" pill)
- Manual zoom controls (ZOOM-02 — future requirement)
- Paper-size-aware scaling (PAPER-01 — future requirement)
- Print-time transform safety rule (becomes more relevant in Phase 10)
