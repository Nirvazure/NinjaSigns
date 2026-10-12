import { test as base, expect, type Page } from '@playwright/test'
import { PGlite } from '@electric-sql/pglite'
import { readFile } from 'node:fs/promises'
export const accountA = '00000000-0000-0000-0000-000000000001'
export const accountB = '00000000-0000-0000-0000-000000000002'
const api = 'https://tfvzcuksahcofooqqezx.supabase.co'
type CloudState = {
  userId: string
  version: number
  companionId: string
  unlockedIds: string[]
  mastery: Record<string, { casts: number; lastCastAt: string }>
}
function user(id: string) {
  return {
    id,
    aud: 'authenticated',
    role: 'authenticated',
    email: `${id}@example.com`,
    app_metadata: { provider: 'github', providers: ['github'] },
    user_metadata: { name: id === accountA ? '修炼者 A' : '修炼者 B' },
    created_at: '2026-10-12T00:00:00Z',
    identities: [],
  }
}
function session(id: string) {
  const expires_at = Math.floor(Date.now() / 1000) + 3600
  const encode = (data: unknown) => Buffer.from(JSON.stringify(data)).toString('base64url')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, aud: 'authenticated', exp: expires_at, iat: expires_at - 3600, iss: `${api}/auth/v1` })}.test-signature`
  return {
    access_token: token,
    refresh_token: `refresh-${id}`,
    expires_in: 3600,
    expires_at,
    token_type: 'bearer',
    user: user(id),
  }
}
export class Backend {
  constructor(
    readonly db: PGlite,
    readonly page: Page,
  ) {}
  failCast = 0
  failCompanion = 0
  failCatalog = 0
  delayCast = 0
  oauth = false
  oauthRequests: URL[] = []
  exchanges: Record<string, unknown>[] = []
  requests: string[] = []
  logoutScopes: string[] = []
  async rpc(name: string, args: Record<string, unknown> = {}, id: string | null = accountA) {
    return this.db.transaction(async (tx) => {
      await tx.exec(`set local role ${id ? 'authenticated' : 'anon'}`)
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [id ?? ''])
      const methods: Record<string, { sql: string; params: unknown[] }> = {
        get_catalog: { sql: 'select naruto_spiritism.get_catalog() as result', params: [] },
        get_my_state: { sql: 'select naruto_spiritism.get_my_state() as result', params: [] },
        record_cast: {
          sql: 'select naruto_spiritism.record_cast($1,$2) as result',
          params: [args.jutsu_id, args.request_id],
        },
        select_companion: {
          sql: 'select naruto_spiritism.select_companion($1) as result',
          params: [args.ninja_id],
        },
      }
      const query = methods[name]
      if (!query) throw Error('Unknown RPC')
      return (await tx.query<{ result: CloudState }>(query.sql, query.params)).rows[0]!.result
    })
  }
  async signIn(id = accountA) {
    const value = `base64-${Buffer.from(JSON.stringify(session(id))).toString('base64url')}`
    await this.page
      .context()
      .addCookies([
        { name: 'naruto-spiritism-auth', value, url: 'http://127.0.0.1:3000', sameSite: 'Lax' },
      ])
  }
  async seed(jutsus: string[], id = accountA) {
    for (const jutsu_id of jutsus)
      await this.rpc('record_cast', { jutsu_id, request_id: crypto.randomUUID() }, id)
  }
  async state(id = accountA) {
    return this.rpc('get_my_state', {}, id)
  }
  async install() {
    await this.page.route(`${api}/auth/v1/**`, async (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/authorize') && this.oauth) {
        this.oauthRequests.push(url)
        const callback = new URL(url.searchParams.get('redirect_to')!)
        callback.searchParams.set('code', 'test-oauth-code')
        await route.fulfill({ status: 302, headers: { location: callback.toString() } })
        return
      }
      if (url.pathname.endsWith('/token') && this.oauth) {
        this.exchanges.push(route.request().postDataJSON())
        await route.fulfill({ json: session(accountA) })
        return
      }
      if (url.pathname.endsWith('/logout')) {
        this.logoutScopes.push(url.searchParams.get('scope') ?? '')
        await route.fulfill({ status: 204 })
        return
      }
      const authorization = route.request().headers().authorization
      let id = accountA
      if (authorization?.startsWith('Bearer ')) {
        try {
          id = JSON.parse(
            Buffer.from(authorization.slice(7).split('.')[1]!, 'base64url').toString(),
          ).sub
        } catch {
          /* Anonymous key. */
        }
      }
      await route.fulfill({ json: url.pathname.endsWith('/user') ? user(id) : { keys: [] } })
    })
    await this.page.route(`${api}/rest/v1/rpc/**`, async (route) => {
      const request = route.request()
      const name = new URL(request.url()).pathname.split('/').at(-1)!
      const args = request.postDataJSON() ?? {}
      const authorization = request.headers().authorization
      let id: string | null = null
      try {
        const sub = JSON.parse(
          Buffer.from(authorization!.slice(7).split('.')[1]!, 'base64url').toString(),
        ).sub
        if ([accountA, accountB].includes(sub)) id = sub
      } catch {
        /* anon */
      }
      if (name === 'record_cast') this.requests.push(args.request_id)
      if (
        (name === 'record_cast' && this.failCast-- > 0) ||
        (name === 'select_companion' && this.failCompanion-- > 0) ||
        (name === 'get_catalog' && this.failCatalog-- > 0)
      ) {
        await route.fulfill({
          status: 503,
          json: { message: 'test network unavailable', code: 'TEST503' },
        })
        return
      }
      try {
        const data = await this.rpc(name, args, id)
        if (name === 'record_cast' && this.delayCast) {
          const delay = this.delayCast
          this.delayCast = 0
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
        await route.fulfill({ json: data })
      } catch (error) {
        await route.fulfill({
          status: 403,
          json: { message: error instanceof Error ? error.message : 'denied' },
        })
      }
    })
  }
}
export const test = base.extend<{ backend: Backend }>({
  backend: [
    async ({ page }, use) => {
      const db = await PGlite.create()
      await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
      insert into auth.users(id,email,raw_user_meta_data) values ('${accountA}','a@example.com','{"name":"修炼者 A"}'),('${accountB}','b@example.com','{"name":"修炼者 B"}');`)
      for (const name of ['202610120001_schema.sql', '202610120002_catalog.sql'])
        await db.exec(await readFile(`supabase/migrations/${name}`, 'utf8'))
      const backend = new Backend(db, page)
      await backend.install()
      await use(backend)
      await db.close()
    },
    { auto: true },
  ],
})
export { expect }
