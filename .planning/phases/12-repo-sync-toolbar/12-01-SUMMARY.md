---
phase: 12-repo-sync-toolbar
plan: "01"
subsystem: lib
tags: [github-api, fetch, unit-test, tdd]
dependency_graph:
  requires: []
  provides: [githubRepo.ts, githubRepo.test.ts]
  affects: [src/hooks/useRepoSync.ts, src/components/PickerDialog.tsx]
tech_stack:
  added: []
  patterns: [fetch-based pure module, UTF-8-safe base64, vitest vi.stubGlobal]
key_files:
  created:
    - src/lib/githubRepo.ts
    - src/lib/githubRepo.test.ts
  modified: []
decisions:
  - "authHeaders() private helper reused across all 5 functions — mirrors githubAuth.ts pattern exactly"
  - "UTF-8-safe base64 via TextEncoder/TextDecoder + btoa/atob on byte arrays, not raw strings"
  - "encodePath() splits on '/' and encodes segments independently to prevent path traversal"
  - "Error verb matches function role: repos_fetch, branches_fetch, tree_fetch, content_fetch, commit"
metrics:
  duration: "176s"
  completed: "2026-07-06"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 12 Plan 01: githubRepo.ts API Module Summary

**One-liner:** Pure fetch-based GitHub REST API module with 5 functions (list repos/branches/md-files, get/commit file content), UTF-8-safe base64, and 19 passing unit tests following the githubAuth.ts pattern.

---

## What Was Built

`src/lib/githubRepo.ts` — the data-access foundation for Phase 12 sync features:

- **5 exported interfaces:** `GitHubRepo`, `GitHubBranch`, `GitHubMdFile`, `GitHubFileContent`, `GitHubCommitResult`
- **5 exported async functions:**
  - `listUserRepos(token)` — GET `/user/repos?sort=pushed&per_page=100`, maps owner.login
  - `listBranches(token, owner, repo)` — GET `/repos/{owner}/{repo}/branches?per_page=100`
  - `listMdFiles(token, owner, repo, branch)` — GET `/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`, filters `.md` blobs only
  - `getFileContent(token, owner, repo, path, branch)` — GET contents API, decodes base64 → UTF-8
  - `commitFile(token, owner, repo, path, branch, content, message, sha)` — PUT contents API, encodes UTF-8 → base64
- **Private helpers:** `authHeaders()`, `decodeBase64()`, `encodeBase64()`, `encodePath()`

`src/lib/githubRepo.test.ts` — 19 tests covering happy-path and error-path for all 5 functions, with header/URL/method assertions.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing test stubs for githubRepo.ts | 710d64b | src/lib/githubRepo.test.ts |
| 1 (GREEN) | Implement githubRepo.ts API module | e4c7c33 | src/lib/githubRepo.ts |
| 2 | Write full githubRepo.test.ts test suite | d64b4a7 | src/lib/githubRepo.test.ts |

---

## TDD Gate Compliance

- RED gate: `test(12-01)` commit 710d64b — failing tests written before implementation
- GREEN gate: `feat(12-01)` commit e4c7c33 — implementation makes tests pass
- No REFACTOR needed — code was clean on first pass

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Surface Scan

All STRIDE mitigations from the plan's threat model are implemented:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-12-01 | Token only in `Authorization` header to hardcoded `https://api.github.com` URLs; no `console.log` of token (grep-verified: 0 matches) |
| T-12-02 | `encodePath()` encodes each path segment via `encodeURIComponent`; branch encoded with `encodeURIComponent` in all URL interpolations |
| T-12-03 | Accepted — module exposes only read + single-file PUT |

No new security surface beyond what the plan's threat model covers.

---

## Known Stubs

None — this is a pure utility module with no UI components.

---

## Self-Check: PASSED

- FOUND: src/lib/githubRepo.ts
- FOUND: src/lib/githubRepo.test.ts
- FOUND commit 710d64b (test RED)
- FOUND commit e4c7c33 (feat GREEN)
- FOUND commit d64b4a7 (feat Task 2)
