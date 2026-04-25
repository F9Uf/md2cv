# Phase 6: Tailwind-Powered Preview Rendering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 06-tailwind-powered-preview-rendering
**Areas discussed:** Class injection approach, Tailwind runtime strategy, Scope & collision handling, Test & regression strategy

---

## Class Injection Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Post-process HTML string | DOMParser walk + class injection before dangerouslySetInnerHTML | |
| Ref + querySelectorAll after render | useEffect DOM walk, causes re-render flash | |
| Custom markdown-it renderer rules | Couples parser to template | |
| **CSS @apply with scoped selectors** | Replace TS class strings with CSS files using `.theme-* el { @apply ... }` | ✓ |

**User's choice:** Replace templateStyles.ts element keys with CSS files using scoped selectors + `@apply`. Container gets theme class, CSS cascade handles element styling — no DOM walking.

---

## CSS File Structure

| Option | Description | Selected |
|--------|-------------|----------|
| @apply Tailwind utilities | CSS file uses `@apply` inside scoped selectors | ✓ |
| Raw CSS properties | Explicit values, breaks Tailwind dependency | |

**User's choice:** `@apply` Tailwind utilities.

---

## templateStyles.ts Migration

| Option | Description | Selected |
|--------|-------------|----------|
| Replace element keys with CSS | Element keys removed from TS, CSS owns h1/h2/etc. styling | ✓ |
| Keep TS alongside CSS | Two sources of truth — rejected | |

**User's choice:** Replace — delete element-key strings from templateStyles.ts, CSS files own element styling.

---

## Tailwind Runtime Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind Play CDN script | `<script src="https://cdn.tailwindcss.com">` in index.html | ✓ |
| CSS safelist | Build-time bundle bloat, not truly arbitrary | |
| You decide | — | |

**User's choice:** Tailwind Play CDN script.

---

## Scope & Collision Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Template wins | Simpler, template is design language | |
| User classes win | Via `@layer base` for template, utility layer wins | ✓ |
| You decide | — | |

**User's choice:** User-authored utility classes win. Achieved via `@layer base` wrapping of template styles.

---

## Test & Regression Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Update snapshots + visual spot-check | Practical, no CSS unit test overhead | ✓ |
| New snapshot tests for CSS class presence | Container class assertion only | |
| You decide | — | |

**User's choice:** Update Phase 5 snapshots if output changes; visual spot-check in browser for CSS rendering.

---

## Claude's Discretion

- Single vs. multiple CSS files per theme
- Theme class naming convention
- Whether templateStyles.ts is kept or inlined

## Deferred Ideas

- ExportTarget / PDF export for new CSS style system — future milestone
- Dark mode for CodeMirror — carried forward
