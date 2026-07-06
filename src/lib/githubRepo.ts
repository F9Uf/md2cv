export interface GitHubRepo {
  full_name: string // "owner/repo"
  owner: string // login only
  name: string
  default_branch: string
  pushed_at: string
  private: boolean
}

export interface GitHubBranch {
  name: string
}

export interface GitHubMdFile {
  path: string
}

export interface GitHubFileContent {
  content: string
  sha: string
}

export interface GitHubCommitResult {
  sha: string
  commitSha: string
}

// --- Private helpers ---

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
  }
}

function decodeBase64(b64: string): string {
  const clean = b64.replace(/\n/g, '')
  const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

// --- Exported API functions ---

export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=100', {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`repos_fetch_failed_${res.status}`)
  const data = (await res.json()) as Array<{
    full_name: string
    owner: { login: string }
    name: string
    default_branch: string
    pushed_at: string
    private: boolean
  }>
  return data.map((r) => ({
    full_name: r.full_name,
    owner: r.owner.login,
    name: r.name,
    default_branch: r.default_branch,
    pushed_at: r.pushed_at,
    private: r.private,
  }))
}

export async function listBranches(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubBranch[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/branches?per_page=100`,
    { headers: authHeaders(token) },
  )
  if (!res.ok) throw new Error(`branches_fetch_failed_${res.status}`)
  const data = (await res.json()) as Array<{ name: string }>
  return data.map((b) => ({ name: b.name }))
}

export async function listMdFiles(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubMdFile[]> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers: authHeaders(token) },
  )
  if (!res.ok) throw new Error(`tree_fetch_failed_${res.status}`)
  const data = (await res.json()) as {
    tree: Array<{ type: string; path: string }>
  }
  return data.tree
    .filter((entry) => entry.type === 'blob' && entry.path.endsWith('.md'))
    .map((entry) => ({ path: entry.path }))
}

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
): Promise<GitHubFileContent> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: authHeaders(token) },
  )
  if (!res.ok) throw new Error(`content_fetch_failed_${res.status}`)
  const data = (await res.json()) as { content: string; sha: string }
  return { content: decodeBase64(data.content), sha: data.sha }
}

export async function commitFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  branch: string,
  content: string,
  message: string,
  sha: string,
): Promise<GitHubCommitResult> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}`,
    {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, content: encodeBase64(content), branch, sha }),
    },
  )
  if (!res.ok) throw new Error(`commit_failed_${res.status}`)
  const data = (await res.json()) as {
    content: { sha: string }
    commit: { sha: string }
  }
  return { sha: data.content.sha, commitSha: data.commit.sha }
}
