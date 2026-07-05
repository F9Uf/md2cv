// Minimal structural types — api/ is not in tsc build scope and @vercel/node is not installed.
interface AuthRequest {
  method?: string
  body: { code?: string } | string | undefined
}
interface AuthResponse {
  status: (code: number) => AuthResponse
  setHeader: (name: string, value: string) => void
  json: (body: unknown) => void
  end: () => void
}

export default async function handler(req: AuthRequest, res: AuthResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method_not_allowed' }); return }

  let body: { code?: string } | undefined
  if (typeof req.body === 'string') {
    try { body = JSON.parse(req.body) } catch { res.status(400).json({ error: 'invalid_json' }); return }
  } else {
    body = req.body as { code?: string } | undefined
  }
  const code = body?.code
  if (!code) { res.status(400).json({ error: 'missing_code' }); return }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) { res.status(500).json({ error: 'server_misconfigured' }); return }

  let data: { access_token?: string; error?: string }
  try {
    const ghRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    })
    data = await ghRes.json() as { access_token?: string; error?: string }
  } catch {
    res.status(502).json({ error: 'exchange_failed' }); return
  }

  if (data.error || !data.access_token) {
    res.status(502).json({ error: data.error || 'exchange_failed' }); return
  }
  // Return ONLY the user's access token. Never echo client_secret or the raw GitHub response.
  res.status(200).json({ access_token: data.access_token })
}
