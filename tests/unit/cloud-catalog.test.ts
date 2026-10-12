import { describe, expect, it } from 'vitest'
import { parseCatalog } from '../../app/domain/catalog'
import { JUTSUS, SEALS } from '../../supabase/seed/catalog'
import { NINJAS } from '../../supabase/seed/ninjas'
import { clearLegacyStorage, safeReturnPath } from '../../app/domain/auth'

const fixture = () =>
  structuredClone({ seals: [...SEALS], jutsus: [...JUTSUS], ninjas: [...NINJAS] })
describe('cloud catalog boundary', () => {
  it('accepts a database-defined jutsu and keeps repeated sequence steps', () => {
    const data = fixture()
    data.jutsus.push({ ...data.jutsus[0]!, id: 'new-jutsu', sequence: ['tiger', 'tiger'] })
    expect(parseCatalog(data).jutsus.at(-1)?.sequence).toEqual(['tiger', 'tiger'])
  })
  it('rejects missing model seals and invalid ninja references', () => {
    const missing = fixture()
    missing.seals.pop()
    expect(() => parseCatalog(missing)).toThrow()
    const broken = fixture()
    broken.ninjas[1]!.unlock = { kind: 'first-cast', jutsuId: 'missing' }
    expect(() => parseCatalog(broken)).toThrow()
  })
  it('rejects unknown effects and invalid sequences before practice starts', () => {
    const data = fixture()
    Object.assign(data.jutsus[0]!, { effect: 'unknown' })
    expect(() => parseCatalog(data)).toThrow()
    Object.assign(data.jutsus[0]!, { effect: null, sequence: [] })
    expect(() => parseCatalog(data)).toThrow()
  })
})
describe('legacy deletion and OAuth return path', () => {
  it('deletes only the three old keys and continues when one removal fails', () => {
    const removed: string[] = []
    clearLegacyStorage({
      removeItem: (key) => {
        removed.push(key)
        if (key.includes('progress')) throw Error('unavailable')
      },
    })
    expect(removed).toEqual([
      'naruto-spiritism.progress.v1',
      'naruto-spiritism.companion.v1',
      'naruto-spiritism.ninja-unlocks.v1',
    ])
  })
  it.each([
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/auth/callback',
    '/login',
    '/%2f%2fevil.example',
  ])('rejects unsafe return path %s', (path) => {
    expect(safeReturnPath(path)).toBe('/')
  })
  it('preserves a normal gallery or practice query', () => {
    expect(safeReturnPath('/gallery?tab=ninjas')).toBe('/gallery?tab=ninjas')
    expect(safeReturnPath('/?jutsu=fireball')).toBe('/?jutsu=fireball')
  })
})
