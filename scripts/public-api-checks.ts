import assert from 'node:assert/strict'
import { parseCatalog } from '../app/domain/catalog'
import { SEALS, JUTSUS } from '../supabase/seed/catalog'
import { NINJAS } from '../supabase/seed/ninjas'

async function json(response: Response, label: string): Promise<unknown> {
  if (!response.ok) throw Error(`${label}: HTTP ${response.status}`)
  try {
    return await response.json()
  } catch {
    throw Error(`${label}: invalid JSON`)
  }
}

function rpc(url: string, key: string, name: string, args: object, fetcher: typeof fetch) {
  return fetcher(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: key,
      'Content-Profile': 'naruto_spiritism',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
    signal: AbortSignal.timeout(15000),
  })
}

async function readCatalog(url: string, key: string, fetcher: typeof fetch) {
  return parseCatalog(await json(await rpc(url, key, 'get_catalog', {}, fetcher), 'Public catalog'))
}

export async function checkPublicStatus(url: string, key: string, fetcher: typeof fetch = fetch) {
  const settings = await json(
    await fetcher(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(15000),
    }),
    'Auth settings',
  )
  if (
    !settings ||
    typeof settings !== 'object' ||
    !('external' in settings) ||
    !settings.external ||
    typeof settings.external !== 'object' ||
    !('github' in settings.external) ||
    settings.external.github !== true
  )
    throw Error('GitHub provider is not enabled.')
  const catalog = await readCatalog(url, key, fetcher)
  return {
    githubEnabled: true,
    catalog: {
      seals: catalog.seals.length,
      jutsus: catalog.jutsus.length,
      ninjas: catalog.ninjas.length,
    },
  }
}

export async function verifyPublicApi(url: string, key: string, fetcher: typeof fetch = fetch) {
  assert.deepEqual(await readCatalog(url, key, fetcher), {
    seals: SEALS,
    jutsus: JUTSUS,
    ninjas: NINJAS,
  })
  for (const [name, args] of Object.entries({
    get_my_state: {},
    record_cast: { jutsu_id: 'fireball', request_id: crypto.randomUUID() },
    select_companion: { ninja_id: 'ninja-01' },
    ensure_player: {},
    player_snapshot: { player_id: crypto.randomUUID() },
  })) {
    const response = await rpc(url, key, name, args, fetcher)
    assert.ok(
      [401, 403, 404].includes(response.status),
      `Anonymous RPC ${name} must be denied; HTTP ${response.status}`,
    )
  }
}
