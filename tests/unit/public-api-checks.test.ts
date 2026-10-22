import { describe, expect, it, vi } from 'vitest'
import { checkPublicStatus, verifyPublicApi } from '../../scripts/public-api-checks'
import { SEALS, JUTSUS } from '../../supabase/seed/catalog'
import { NINJAS } from '../../supabase/seed/ninjas'

const url = 'https://public-check.test'
const key = 'sb_publishable_test'
const catalog = () => structuredClone({ seals: SEALS, jutsus: JUTSUS, ninjas: NINJAS })

function api(options: { github?: boolean; privateStatus?: number; data?: unknown } = {}) {
  return vi.fn<typeof fetch>(async (input, init) => {
    const headers = new Headers(init?.headers)
    expect(headers.get('apikey')).toBe(key)
    expect(headers.has('authorization')).toBe(false)
    expect(init?.signal).toBeInstanceOf(AbortSignal)
    if (String(input) === `${url}/auth/v1/settings`) {
      return Response.json({ external: { github: options.github ?? true } })
    }
    expect(headers.get('Content-Profile')).toBe('naruto_spiritism')
    expect(init?.method).toBe('POST')
    if (String(input) === `${url}/rest/v1/rpc/get_catalog`) {
      return Response.json(options.data ?? catalog())
    }
    return new Response(null, { status: options.privateStatus ?? 403 })
  })
}

describe('public API checks without database credentials', () => {
  it('reports GitHub and the complete public catalog', async () => {
    await expect(checkPublicStatus(url, key, api())).resolves.toEqual({
      githubEnabled: true,
      catalog: { seals: 12, jutsus: 28, ninjas: 25 },
    })
  })
  it('rejects a disabled GitHub provider', async () => {
    await expect(checkPublicStatus(url, key, api({ github: false }))).rejects.toThrow(/GitHub/)
  })
  it('reports HTTP failures without trying to parse HTML or exposing response bodies', async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => new Response('private upstream body', { status: 502 }),
    )
    await expect(checkPublicStatus(url, key, fetcher)).rejects.toThrow(/Auth settings: HTTP 502/)
  })
  it('rejects malformed JSON and aborted requests', async () => {
    await expect(checkPublicStatus(url, key, async () => new Response('<html>'))).rejects.toThrow(
      /invalid JSON/,
    )
    await expect(
      checkPublicStatus(url, key, async () => {
        throw new DOMException('timed out', 'TimeoutError')
      }),
    ).rejects.toThrow(/timed out/)
  })
  it.each([401, 403, 404])('accepts private RPC denial HTTP %i', async (privateStatus) => {
    await expect(verifyPublicApi(url, key, api({ privateStatus }))).resolves.toBeUndefined()
  })
  it.each([200, 500])('fails when a private RPC returns HTTP %i', async (privateStatus) => {
    await expect(verifyPublicApi(url, key, api({ privateStatus }))).rejects.toThrow(
      /get_my_state.*must be denied/,
    )
  })
  it('checks every private RPC, not just the first', async () => {
    const fetcher = api()
    await verifyPublicApi(url, key, fetcher)
    expect(fetcher.mock.calls.map(([input]) => String(input).split('/').at(-1))).toEqual([
      'get_catalog',
      'get_my_state',
      'record_cast',
      'select_companion',
      'ensure_player',
      'player_snapshot',
    ])
  })
  it('rejects a valid catalog with drifted seed data', async () => {
    const data = catalog()
    data.jutsus[0]!.name = 'changed name'
    await expect(verifyPublicApi(url, key, api({ data }))).rejects.toThrow()
  })
})
