---
phase: 05-export-correctness
reviewed: 2026-04-18T00:00:00Z
depth: standard
files_reviewed: 1
files_reviewed_list:
  - src/index.css
findings:
  critical: 0
  warning: 1
  info: 2
  total: 3
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-18
**Depth:** standard
**Files Reviewed:** 1
**Status:** issues_found

## Summary

Reviewed `src/index.css`, which contains the Tailwind import and all print/screen styles for the export feature. The file is clean and purposeful. One warning relates to a fragile `background-color` value in print context that may not survive print color suppression in some browsers. Two info items cover minor style concerns.

## Warnings

### WR-01: Hardcoded hex color in print context may be suppressed by browser print settings

**File:** `src/index.css:43`
**Issue:** `background-color: #f3f4f6` is applied to `code` elements inside `#print-area` during print. Most browsers suppress background colors in print mode unless the user explicitly enables "Print backgrounds." This means the visual distinction for inline code will silently disappear in the default print/PDF output, which is the primary export path for this app.
**Fix:** Either remove the background and rely solely on font family to distinguish code, or add `-webkit-print-color-adjust: exact; print-color-adjust: exact;` to force background rendering in print:

```css
#print-area code {
  font-family: monospace;
  background-color: #f3f4f6;
  padding: 1px 3px;
  border-radius: 2px;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

## Info

### IN-01: `@page` margin may conflict with html2pdf.js or jsPDF margin settings

**File:** `src/index.css:23-26`
**Issue:** The `@page { margin: 15mm; }` rule applies when printing via the browser's native print dialog. However, if the app uses html2pdf.js or jsPDF for PDF export (as noted in CLAUDE.md), the `@page` rule has no effect on those code paths — they use their own margin configuration. If both paths are supported, the margin will be inconsistent between them without explicit parity in the JS export config.
**Fix:** Document the expected margin in both places, or ensure the JS export library is configured with an equivalent 15mm margin. This is an info-level inconsistency risk, not a bug.

### IN-02: No `page-break` or `break-inside` rules for resume content

**File:** `src/index.css:3-46`
**Issue:** The print block has no `break-inside: avoid` or `page-break-inside: avoid` rules for resume sections or entries. For multi-page resumes, section headings or job entries could be split awkwardly across pages (e.g., heading on one page, content on the next).
**Fix:** Add to the print block:

```css
#print-area h2,
#print-area h3 {
  break-after: avoid;
}

#print-area section,
#print-area .entry {
  break-inside: avoid;
}
```

Adjust selectors to match the actual DOM structure produced by the resume renderer.

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
