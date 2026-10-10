import { describe, expect, it } from 'vitest'
import { getNinjaCollection, getNewlyUnlocked, resolveCompanion } from '../../app/domain/ninjas'
import { parseMastery, type Mastery } from '../../app/domain/progress'

const record = (casts: number) => ({ casts, lastCastAt: '2026-10-10T01:00:00Z' })
const unlocked = (mastery: Mastery) =>
  getNinjaCollection(mastery)
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.ninja.id)

describe('ninja collection from real-cast progress', () => {
  it.each([
    ['ninja-04', 3],
    ['ninja-05', 5],
    ['ninja-06', 8],
    ['ninja-08', 12],
    ['ninja-09', 16],
    ['ninja-10', 20],
    ['ninja-11', 25],
    ['ninja-12', 30],
    ['ninja-13', 36],
    ['ninja-14', 42],
    ['ninja-15', 50],
    ['ninja-16', 60],
    ['ninja-17', 70],
    ['ninja-18', 80],
    ['ninja-19', 90],
    ['ninja-20', 100],
    ['ninja-21', 115],
    ['ninja-22', 130],
    ['ninja-23', 150],
    ['ninja-24', 175],
    ['ninja-25', 200],
  ])('unlocks %s at %i total real casts, never one cast early', (id, required) => {
    expect(unlocked({ fireball: record(Number(required) - 1) })).not.toContain(id)
    expect(unlocked({ fireball: record(Number(required)) })).toContain(id)
  })

  it('starts with only Naruto and exposes all 25 unique image-backed characters', () => {
    const entries = getNinjaCollection({})
    expect(entries).toHaveLength(25)
    expect(new Set(entries.map((entry) => entry.ninja.id)).size).toBe(25)
    expect(unlocked({})).toEqual(['ninja-01'])
    expect(entries[0]?.ninja.image).toBe('/images/ninja/ninja (1).png')
    expect(entries[24]?.ninja.image).toBe('/images/ninja/ninja (25).png')
  })

  it.each([
    ['fireball', 'ninja-02'],
    ['chidori', 'ninja-03'],
    ['summoning', 'ninja-07'],
  ] as const)('unlocks the associated character after the first %s cast', (jutsu, id) => {
    expect(unlocked({ [jutsu]: record(1) })).toEqual(['ninja-01', id])
  })

  it('combines casts across jutsu and unlocks exactly at a milestone', () => {
    expect(unlocked({ fireball: record(1), chidori: record(1) })).not.toContain('ninja-04')
    const entries = getNinjaCollection({
      fireball: record(1),
      chidori: record(1),
      summoning: record(1),
    })
    expect(entries.find((entry) => entry.ninja.id === 'ninja-04')).toMatchObject({
      unlocked: true,
      current: 3,
      required: 3,
    })
    expect(entries.find((entry) => entry.ninja.id === 'ninja-05')).toMatchObject({
      unlocked: false,
      current: 3,
      required: 5,
    })
  })

  it('loads historical mastery without a separate unlock record and caps visible progress', () => {
    const mastery = parseMastery(
      JSON.stringify({ fireball: record(250), chidori: record(1), summoning: record(1) }),
    )
    expect(unlocked(mastery)).toHaveLength(25)
    expect(getNinjaCollection(mastery).at(-1)).toMatchObject({ current: 200, required: 200 })
  })

  it('reports multiple newly unlocked characters but never repeats an existing reward', () => {
    const before = { fireball: record(2) }
    const after = { ...before, chidori: record(1) }
    expect(getNewlyUnlocked(before, after).map((ninja) => ninja.id)).toEqual([
      'ninja-03',
      'ninja-04',
    ])
    expect(getNewlyUnlocked(after, { ...before, chidori: record(2) })).toEqual([])
  })

  it('restores only known unlocked companions and otherwise falls back to Naruto', () => {
    expect(resolveCompanion('ninja-02', { fireball: record(1) }).id).toBe('ninja-02')
    for (const id of [null, 'ninja-02', 'ninja-99', '{broken']) {
      expect(resolveCompanion(id, {}).id).toBe('ninja-01')
    }
  })
})
