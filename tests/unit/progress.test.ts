import { describe, expect, it } from 'vitest'
import { parseMastery } from '../../app/domain/progress'

describe('local mastery records', () => {
  it('loads a valid real-cast record', () => {
    expect(
      parseMastery('{"chidori":{"casts":2,"lastCastAt":"2026-10-09T01:00:00Z"}}').chidori?.casts,
    ).toBe(2)
  })
  it('rejects a corrupted record', () => {
    expect(() => parseMastery('{"chidori":{"casts":-1}}')).toThrow('收藏记录内容无效')
  })
  it('starts empty without a saved record', () => {
    expect(parseMastery(null)).toEqual({})
  })
})
