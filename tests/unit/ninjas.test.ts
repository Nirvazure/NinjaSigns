import { describe, expect, it } from 'vitest'
import { getNinjaCollection } from '../../app/domain/ninjas'
import { parseCatalog } from '../../app/domain/catalog'
import { JUTSUS, SEALS } from '../../supabase/seed/catalog'
import { NINJAS } from '../../supabase/seed/ninjas'
const catalog = parseCatalog({ seals: SEALS, jutsus: JUTSUS, ninjas: NINJAS })
const record = { casts: 99, lastCastAt: '2026-10-12T00:00:00Z' }
describe('ninja gallery follows committed cloud ownership', () => {
  it('never infers an unlock from an uncommitted mastery record', () => {
    const entries = getNinjaCollection(catalog, { fireball: record }, ['ninja-01'])
    expect(entries.filter((e) => e.unlocked).map((e) => e.ninja.id)).toEqual(['ninja-01'])
    expect(entries.find((e) => e.ninja.id === 'ninja-02')).toMatchObject({
      unlocked: false,
      current: 1,
      condition: '首次成功施放豪火球之术',
    })
  })
  it('keeps earned cloud unlocks when the current rule is not satisfied', () => {
    const entries = getNinjaCollection(catalog, {}, ['ninja-01', 'ninja-04'])
    expect(entries.find((e) => e.ninja.id === 'ninja-04')).toMatchObject({
      unlocked: true,
      current: 2,
      required: 2,
    })
  })
  it('shows distinct jutsu progress and readable combination requirements', () => {
    const entries = getNinjaCollection(catalog, { 'added-weight-rock': record, fireball: record }, [
      'ninja-01',
    ])
    expect(entries.find((e) => e.ninja.id === 'ninja-04')).toMatchObject({
      current: 1,
      required: 2,
      condition: '掌握加重岩之术、落盖之术',
    })
    expect(entries.find((e) => e.ninja.id === 'ninja-14')).toMatchObject({
      current: 2,
      required: 4,
    })
  })
})
