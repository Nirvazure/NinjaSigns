import { describe, expect, it } from 'vitest'
import {
  PlayerSession,
  type PlayerGateway,
  type PlayerState,
} from '../../app/domain/player-session'

const state = (userId = 'a', version = 0): PlayerState => ({
  userId,
  version,
  displayName: userId,
  avatarUrl: null,
  companionId: 'ninja-01',
  mastery: {},
  unlockedIds: ['ninja-01'],
})
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
function gateway(overrides: Partial<PlayerGateway> = {}): PlayerGateway {
  return {
    load: async () => state(),
    cast: async () => ({ state: state('a', 1), newlyUnlocked: [] }),
    companion: async () => state('a', 1),
    ...overrides,
  }
}
describe('account-owned cloud state', () => {
  it('records an authenticated cast even if the initial state could not be loaded', async () => {
    const session = new PlayerSession(
      gateway({
        load: async () => {
          throw Error('offline')
        },
      }),
    )
    await session.setAccount('a')
    expect(session.state).toBeNull()
    await session.recordCast('fireball', 'stable-id')
    expect(session.state?.version).toBe(1)
    expect(session.error).toBe('')
  })
  it('clears an initial load error after a successful refresh', async () => {
    let calls = 0
    const session = new PlayerSession(
      gateway({
        load: async () => {
          if (++calls === 1) throw Error('offline')
          return state()
        },
      }),
    )
    await session.setAccount('a')
    expect(session.error).toContain('offline')
    await session.retry()
    expect(session.error).toBe('')
    expect(session.state?.userId).toBe('a')
  })
  it('does not record guest practice', async () => {
    const session = new PlayerSession(
      gateway({
        cast: async () => {
          throw Error('must not call')
        },
      }),
    )
    expect(await session.recordCast('fireball', 'request-1')).toEqual([])
    expect(session.state).toBeNull()
    expect(session.pending).toEqual([])
  })
  it('clears the old account immediately and ignores its late load', async () => {
    const first = deferred<PlayerState>()
    let calls = 0
    const session = new PlayerSession(
      gateway({ load: () => (++calls === 1 ? first.promise : Promise.resolve(state('b'))) }),
    )
    const old = session.setAccount('a')
    const next = session.setAccount('b')
    expect(session.state).toBeNull()
    await next
    first.resolve(state('a', 10))
    await old
    expect(session.state?.userId).toBe('b')
  })
  it('does not replace newer state with an older response', async () => {
    const cast = deferred<{ state: PlayerState; newlyUnlocked: string[] }>()
    const session = new PlayerSession(
      gateway({
        cast: () => cast.promise,
        companion: async () => ({ ...state('a', 2), companionId: 'ninja-02' }),
      }),
    )
    await session.setAccount('a')
    const pending = session.recordCast('fireball', 'request-1')
    await session.selectCompanion('ninja-02')
    cast.resolve({ state: state('a', 1), newlyUnlocked: ['ninja-02'] })
    await pending
    expect(session.state?.companionId).toBe('ninja-02')
    expect(session.state?.version).toBe(2)
  })
  it('retries with the original request ID and keeps failed state unsaved', async () => {
    const requests: string[] = []
    const session = new PlayerSession(
      gateway({
        cast: async (_id, request) => {
          requests.push(request)
          if (requests.length === 1) throw Error('network unavailable')
          return {
            state: {
              ...state('a', 1),
              mastery: { fireball: { casts: 1, lastCastAt: '2026-10-12T00:00:00Z' } },
            },
            newlyUnlocked: ['ninja-02'],
          }
        },
      }),
    )
    await session.setAccount('a')
    expect(await session.recordCast('fireball', 'stable-id')).toEqual([])
    expect(session.state?.mastery).toEqual({})
    expect(session.pending).toHaveLength(1)
    expect(await session.retry()).toEqual(['ninja-02'])
    expect(requests).toEqual(['stable-id', 'stable-id'])
    expect(session.state?.mastery.fireball?.casts).toBe(1)
    expect(session.pending).toEqual([])
  })
  it('cannot apply a cast or retain retries after signing out', async () => {
    const cast = deferred<{ state: PlayerState; newlyUnlocked: string[] }>()
    const session = new PlayerSession(gateway({ cast: () => cast.promise }))
    await session.setAccount('a')
    const request = session.recordCast('fireball', 'request-1')
    await session.setAccount(null)
    cast.resolve({ state: state('a', 1), newlyUnlocked: ['ninja-02'] })
    expect(await request).toEqual([])
    expect(session.state).toBeNull()
    expect(session.pending).toEqual([])
  })
  it('shows failed companion changes without claiming they were saved', async () => {
    const session = new PlayerSession(
      gateway({
        companion: async () => {
          throw Error('offline')
        },
      }),
    )
    await session.setAccount('a')
    await session.selectCompanion('ninja-02')
    expect(session.state?.companionId).toBe('ninja-01')
    expect(session.error).toContain('offline')
    expect(session.pending).toHaveLength(1)
  })
})
