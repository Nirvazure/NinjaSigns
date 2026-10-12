import { describe, expect, it } from 'vitest'
import { parsePlayerState } from '../../app/domain/cloud-state'
import { parseCatalog } from '../../app/domain/catalog'
import { JUTSUS, SEALS } from '../../supabase/seed/catalog'
import { NINJAS } from '../../supabase/seed/ninjas'
const catalog = parseCatalog({ seals: SEALS, jutsus: JUTSUS, ninjas: NINJAS })
const base = {
  userId: 'a',
  version: 1,
  displayName: '忍者',
  avatarUrl: null,
  companionId: 'ninja-01',
  unlockedIds: ['ninja-01'],
  mastery: {},
}
describe('private cloud state validation', () => {
  it('loads verified progress without reading local records', () => {
    expect(
      parsePlayerState(
        { ...base, mastery: { fireball: { casts: 2, lastCastAt: '2026-10-12T00:00:00Z' } } },
        catalog,
      ).mastery.fireball?.casts,
    ).toBe(2)
  })
  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])('rejects invalid cast count %s', (casts) => {
    expect(() =>
      parsePlayerState(
        { ...base, mastery: { fireball: { casts, lastCastAt: '2026-10-12T00:00:00Z' } } },
        catalog,
      ),
    ).toThrow()
  })
  it('rejects invalid dates, unknown jutsu and unowned companions', () => {
    expect(() =>
      parsePlayerState(
        { ...base, mastery: { fireball: { casts: 1, lastCastAt: 'invalid' } } },
        catalog,
      ),
    ).toThrow()
    expect(() =>
      parsePlayerState(
        { ...base, mastery: { unknown: { casts: 1, lastCastAt: '2026-10-12T00:00:00Z' } } },
        catalog,
      ),
    ).toThrow()
    expect(() => parsePlayerState({ ...base, companionId: 'ninja-02' }, catalog)).toThrow()
  })
})
