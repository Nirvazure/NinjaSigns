import { describe, expect, it } from 'vitest'
import { parseMastery } from '../../app/domain/progress'

describe('local mastery records', () => {
  it('loads a valid real-cast record', () => {
    expect(
      parseMastery('{"chidori":{"casts":2,"lastCastAt":"2026-10-09T01:00:00Z"}}').chidori?.casts,
    ).toBe(2)
  })
  it('loads a newly added jutsu without requiring a storage migration', () => {
    expect(
      parseMastery('{"great-fire-annihilation":{"casts":1,"lastCastAt":"2026-10-10T01:00:00Z"}}'),
    ).toEqual({
      'great-fire-annihilation': { casts: 1, lastCastAt: '2026-10-10T01:00:00Z' },
    })
  })
  it('restores an expanded multi-seal jutsu alongside existing progress', () => {
    expect(
      parseMastery(
        '{"shuriken-shadow-clone":{"casts":3,"lastCastAt":"2026-10-10T02:00:00Z"},"fireball":{"casts":1,"lastCastAt":"2026-10-09T01:00:00Z"}}',
      ),
    ).toEqual({
      'shuriken-shadow-clone': { casts: 3, lastCastAt: '2026-10-10T02:00:00Z' },
      fireball: { casts: 1, lastCastAt: '2026-10-09T01:00:00Z' },
    })
  })
  it('rejects a corrupted record', () => {
    expect(() => parseMastery('{"chidori":{"casts":-1}}')).toThrow('收藏记录内容无效')
  })
  it('starts empty without a saved record', () => {
    expect(parseMastery(null)).toEqual({})
  })

  it('ignores unknown ids, including malformed unknown records', () => {
    expect(
      parseMastery(
        '{"unknown-jutsu":false,"chidori":{"casts":2,"lastCastAt":"2026-10-09T01:00:00Z"}}',
      ),
    ).toEqual({ chidori: { casts: 2, lastCastAt: '2026-10-09T01:00:00Z' } })
  })

  it.each([
    null,
    false,
    0,
    [],
    { casts: 0, lastCastAt: '2026-10-09T01:00:00Z' },
    { casts: 1.5, lastCastAt: '2026-10-09T01:00:00Z' },
    { casts: 1, lastCastAt: 'not-a-date' },
    { casts: Number.MAX_SAFE_INTEGER + 1, lastCastAt: '2026-10-09T01:00:00Z' },
  ])('rejects malformed known records: %j', (record) => {
    expect(() => parseMastery(JSON.stringify({ summoning: record }))).toThrow('收藏记录内容无效')
  })

  it.each(['null', '[]', 'false', '3', '"text"'])('rejects malformed containers: %s', (raw) => {
    expect(() => parseMastery(raw)).toThrow('收藏记录格式无效')
  })
})
