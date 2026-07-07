# md2cv

A personal single-page web app that lets you write your resume in Markdown and instantly see it rendered as a styled resume. Runs entirely in the browser — optionally sync your resume files with a GitHub repo.

![md2cv preview](./preview.png)

## What it does

- **Write in Markdown** — uses a familiar syntax to describe your resume structure
- **Live preview** — see the rendered resume update in real time as you type
- **Multiple templates** — switch between styled resume templates
- **Export to PDF** — download your resume directly from the browser
- **GitHub sync** — sign in with GitHub to browse a repo's file tree, edit and switch between resume files, and commit changes back — with conflict detection and unsaved-changes protection

## Markdown structure

The parser maps Markdown elements to resume sections:

| Markdown | Resume element |
|----------|---------------|
| `# Name` | Your name / header |
| `## Section` | Section heading (Experience, Education, etc.) |
| `### Entry` | Job title, degree, or other entry |
| `- bullet` | Detail or description |

## Tech stack

- **React + Vite** — UI framework and build tool
- **TypeScript** — type safety throughout
- **Tailwind CSS** — utility-first styling
- **CodeMirror** — in-browser Markdown editor
- **markdown-it** — Markdown parsing
- **paged.js + browser print** — paginated DOM rendered in-browser, exported via the browser's native Save-as-PDF
- **GitHub REST API** — repo file tree, file contents, and commits for the sync feature
- **Vercel serverless function** (`api/github-auth.ts`) — the only server-side piece, used solely to exchange the GitHub OAuth code for an access token without exposing the client secret in the browser

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### GitHub sync setup (optional)

To use the GitHub sync feature locally, create a GitHub OAuth App and set its credentials as environment variables (see `.env.example`):

```bash
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Without these, md2cv still works fully as a local, client-side Markdown editor — GitHub sign-in just won't be available.

## Build

```bash
npm run build
```

Output is in `dist/` — a fully static site you can host anywhere.
