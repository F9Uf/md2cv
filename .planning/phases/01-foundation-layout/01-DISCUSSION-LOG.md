# Phase 1: Foundation & Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-14
**Phase:** 01-foundation-layout
**Areas discussed:** Framework & build, Mobile tab design, App shell chrome, Splitter behavior

---

## Framework & Build

| Option | Description | Selected |
|--------|-------------|----------|
| React + Vite | Most ecosystem support for CodeMirror 6 and html2pdf.js | ✓ |
| Vue 3 + Vite | Lighter, great reactivity model — fewer pre-built wrappers | |
| Vanilla JS + Vite | Zero framework overhead — more manual wiring | |

**User's choice:** React + Vite
**Notes:** No additional notes

---

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind CSS | Utility-first, fast to build responsive layouts | ✓ |
| CSS Modules | Scoped component styles, no utility overhead | |
| Plain CSS | No build-time tooling | |

**User's choice:** Tailwind CSS
**Notes:** No additional notes

---

## Mobile Tab Design

| Option | Description | Selected |
|--------|-------------|----------|
| Top | Conventional for editor-style tools | ✓ |
| Bottom | Thumb-friendly on phones, more app-like | |

**User's choice:** Top tab bar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Editor (default) | User lands ready to type — primary action | ✓ |
| Preview (default) | User sees the rendered result first | |

**User's choice:** Editor tab active by default

---

## App Shell Chrome

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — placeholder header | Reserve space for toolbar now, avoid layout reflow later | ✓ |
| No header in Phase 1 | Two panes only — toolbar added in Phase 2 | |

**User's choice:** Include placeholder header in Phase 1

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — show "md2cv" | Simple text logo in the header | ✓ |
| No branding | Utility-first, no visible app title | |

**User's choice:** Show "md2cv" branding

---

## Splitter Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| 50/50 | Equal split — simple, balanced | ✓ |
| 40/60 editor/preview | Slightly more preview space | |
| You decide | Claude picks a sensible default | |

**User's choice:** 50/50 default split

---

| Option | Description | Selected |
|--------|-------------|----------|
| Min 20% each | Prevents either pane from being hidden | ✓ |
| Min 15% each | More flexible — nearly collapses | |
| No constraints | Free drag to 0% | |

**User's choice:** Min 20% each pane

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — save to localStorage | Restores last position on reload | ✓ |
| No — reset to default | Always starts at default ratio | |

**User's choice:** Persist split ratio to localStorage

---

## Claude's Discretion

- Splitter visual styling (handle width, color, hover/drag affordance)
- Transition/animation on mobile tab switch
- Exact responsive breakpoint (mobile vs desktop)

## Deferred Ideas

None
