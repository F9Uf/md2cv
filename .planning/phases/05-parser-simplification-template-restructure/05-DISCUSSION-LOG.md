# Phase 5: Parser Simplification & Template Restructure - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-25
**Phase:** 05-parser-simplification-template-restructure
**Areas discussed:** Parser output shape, Preview.tsx changes in Phase 5, Template style keys, Regression strategy

---

## Parser Output Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Raw HTML string | `parseResume()` returns `md.render(markdown)` directly. Preview uses `dangerouslySetInnerHTML`. | ✓ |
| Keep ResumeData, regen HTML internally | Still return structured ResumeData but use `md.render()` chunks internally instead of token-walking. | |

**User's choice:** Raw HTML string
**Notes:** Clean break — no token-walking, no structured type.

---

## Preview.tsx Changes in Phase 5

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal stub — just render HTML | Preview becomes a thin wrapper rendering the HTML string. Element-level class application deferred to Phase 6. | ✓ |
| Full rewrite now | Phase 5 also does DOM post-processing to apply Tailwind classes per element tag. | |

**User's choice:** Minimal stub — just render HTML
**Notes:** Phase 5 only applies `container` class; Phase 6 wires up the full element-keyed map.

---

## Template Style Keys

| Option | Description | Selected |
|--------|-------------|----------|
| MD-generated tags + container | `container`, `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `code`, `pre`, `a`, `blockquote`, `hr` | ✓ |
| Just visible resume elements | Only `h1`, `h2`, `h3`, `ul`, `li`, `p`, `container` — minimal set | |

**User's choice:** MD-generated tags + container
**Notes:** Full set of markdown-it output tags covered upfront.

---

## Regression Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Manual side-by-side check | Visual comparison in dev server, no automated tests | |
| Claude's discretion | Planner decides approach | |
| Existing unit test + new snapshots | Update parseResume.test.ts + create snapshot tests per template before implementing | ✓ |

**User's choice:** Use existing unit tests where possible and create snapshot tests for each template before implementation (test-first).
**Notes:** Snapshot tests created as regression baseline before any code changes.

---

## Deferred Ideas

None — discussion stayed within phase scope.
