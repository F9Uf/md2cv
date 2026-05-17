---
name: create-pr
description: >
  Create a GitHub pull request from the current branch (or a new branch if on main/dev/develop).
  Uses git diff and commit history to write a structured PR description with Why/What/Impact sections.
  Assigns the PR to the authenticated user. Returns the PR URL when done.
  Trigger: /create-pr
---

# /create-pr

Create a GitHub pull request with a clear, structured description derived from git history and context.

## Usage

```
/create-pr                        # create PR from current branch → main
/create-pr --base develop         # create PR targeting develop
/create-pr --base staging         # create PR targeting a custom base branch
```

## Step-by-step instructions

### Step 1 — Determine the source branch

Run `git branch --show-current` to get the current branch name.

- If the branch is `main`, `dev`, or `develop`: ask the user what branch name to use, OR derive a name from the recent commits (e.g., `feat/add-pdf-export`), create that branch with `git checkout -b <name>`, then push it.
- Otherwise: use the current branch as-is.

### Step 2 — Determine the base (target) branch

- If the user passed `--base <branch>`, use that.
- Otherwise default to `main`.

### Step 3 — Gather context

Run these commands in parallel:

```bash
git log origin/main..HEAD --oneline           # commits on this branch
git diff origin/main...HEAD --stat            # files changed
git diff origin/main...HEAD                   # full diff for description context
```

Also incorporate any context the user provided in their message (feature description, ticket number, etc.).

### Step 4 — Identify the GitHub repo

Run:
```bash
git remote get-url origin
```

Parse `owner` and `repo` from the remote URL (handles both HTTPS and SSH formats).

### Step 5 — Get authenticated user login

Use the `mcp__github__get_me` tool to retrieve the authenticated user's login. Save it as `<my_login>`.

### Step 6 — Draft the PR title and description

**Title:** one concise imperative sentence ≤72 chars (e.g., `feat: add PDF export with template switching`).

**Description template** (fill in from git diff + commits + user context):

```markdown
## Why Changes?
- <bullet: the problem or motivation — why this work was needed>
- <bullet: additional context, linked issue if any>

## What Changes?
- <bullet: key file or component changed and what was done>
- <bullet: repeat per logical group of changes>
- <bullet: note any removed or renamed things>

## Impact or Testing/Verification
- <bullet: how to verify the change works>
- <bullet: affected areas, regressions to watch, manual steps>
- <bullet: automated tests added/updated if any>
```

Rules for the description:
- All bullet points, no prose paragraphs
- Be specific: name files, functions, or components where relevant
- Keep each bullet ≤120 chars
- If a section has nothing meaningful to say, write a single `- N/A` bullet rather than omitting the section

### Step 7 — Create the pull request via GitHub MCP

Use `mcp__github__create_pull_request` with:
- `owner`: parsed from remote URL
- `repo`: parsed from remote URL
- `title`: drafted title
- `body`: drafted description
- `head`: source branch name
- `base`: target branch from Step 2
- `assignees`: [ `<my_login>` ]

If the tool returns an error that the branch doesn't exist on remote, push it first:
```bash
git push -u origin <branch>
```
Then retry the MCP call.

### Step 8 — Return the PR URL

Print the pull request URL to the user as the final output. Example:

```
Pull request created: https://github.com/owner/repo/pull/42
```

## Edge cases

- **Dirty working tree**: if `git status` shows uncommitted changes, warn the user and ask whether to commit them first or proceed with only pushed commits.
- **No commits ahead of base**: tell the user there are no changes to open a PR for and stop.
- **Branch already has an open PR**: the MCP call will fail — surface the existing PR URL from the error message.
- **Private repo / no push access**: surface the error clearly, don't retry silently.
