// Administrative token stays in .env; only append this application's redirect URLs.
export {}
const token = process.env.SUPABASE_ACCESS_TOKEN
if (!token)
  throw Error(
    'SUPABASE_ACCESS_TOKEN is required to configure Auth callback URLs (a public/service-role Key cannot manage project configuration).',
  )
const apiUrl = new URL(process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
const projectRef = apiUrl.hostname.split('.')[0]
if (!/^[a-z]{20}$/.test(projectRef!)) throw Error('A hosted Supabase project URL is required.')
const origins = (process.env.APP_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => {
    const url = new URL(origin.trim())
    if (
      (url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    )
      throw Error(
        'APP_ORIGINS must contain exact HTTPS origins (HTTP is allowed for localhost only).',
      )
    return `${url.origin}/auth/callback**`
  })
const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
async function config() {
  const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw Error(`Auth config read failed: HTTP ${response.status}`)
  return response.json() as Promise<{ uri_allow_list?: string; external_github_enabled?: boolean }>
}
const before = await config()
if (!before.external_github_enabled)
  throw Error('The shared GitHub Provider is not enabled; configure it in YQYHub first.')
const existing = (before.uri_allow_list || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)
const urls = [...new Set([...existing, ...origins])]
if (origins.some((url) => !existing.includes(url))) {
  const response = await fetch(endpoint, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ uri_allow_list: urls.join(',') }),
    signal: AbortSignal.timeout(20000),
  })
  if (!response.ok) throw Error(`Auth config update failed: HTTP ${response.status}`)
}
const after = await config()
const saved = (after.uri_allow_list || '').split(',').map((url) => url.trim())
if (!urls.every((url) => saved.includes(url)))
  throw Error('Auth callback configuration verification failed.')
console.log('Verified application callback URLs:', origins)
