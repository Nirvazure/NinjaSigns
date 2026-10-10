import { describe, expect, it } from 'vitest'
import { JUTSU_IDS } from '../../app/domain/jutsu-data'
import {
  NINJAS,
  getNinjaCollection,
  getNewlyUnlocked,
  resolveCompanion,
  type NinjaId,
} from '../../app/domain/ninjas'
import { restoreRetainedNinjas } from '../../app/domain/ninja-progress'
import { parseMastery, type Mastery } from '../../app/domain/progress'
import type { JutsuId } from '../../app/domain/types'

const record = (casts = 1) => ({ casts, lastCastAt: '2026-10-10T01:00:00Z' })
const unlocked = (mastery: Mastery, retained: readonly NinjaId[] = []) =>
  getNinjaCollection(mastery, retained)
    .filter((entry) => entry.unlocked)
    .map((entry) => entry.ninja.id)
const mastered = (ids: readonly JutsuId[]): Mastery =>
  Object.fromEntries(ids.map((id) => [id, record()]))

describe('ninja collection from mastered jutsu', () => {
  it('starts with Naruto and exposes 25 unique image-backed characters', () => {
    const entries = getNinjaCollection({})
    expect(entries).toHaveLength(25)
    expect(new Set(entries.map((entry) => entry.ninja.id)).size).toBe(25)
    expect(unlocked({})).toEqual(['ninja-01'])
    expect(entries[0]?.ninja.image).toBe('/images/ninja/ninja (1).png')
    expect(entries[24]?.ninja.image).toBe('/images/ninja/ninja (25).png')
    expect(
      NINJAS.filter((ninja) => ['first-cast', 'jutsu-set'].includes(ninja.unlock.kind)),
    ).toHaveLength(19)
    expect(NINJAS.every((ninja) => ninja.unlock.kind !== ('total-casts' as string))).toBe(true)
  })

  it.each([
    ['fireball', 'ninja-02'],
    ['chidori', 'ninja-03'],
    ['summoning', 'ninja-07'],
    ['great-breakthrough', 'ninja-06'],
    ['shadow-sewing', 'ninja-09'],
    ['body-flicker', 'ninja-11'],
    ['shuriken-shadow-clone', 'ninja-12'],
    ['phoenix-sage-fire', 'ninja-13'],
    ['ash-pile-burning', 'ninja-20'],
    ['mind-clone-switch', 'ninja-22'],
  ] as const)('unlocks the associated character on the first %s cast', (jutsu, id) => {
    expect(unlocked({})).not.toContain(id)
    expect(unlocked({ [jutsu]: record() })).toContain(id)
  })

  it.each([
    ['ninja-04', ['added-weight-rock', 'dropping-lid']],
    ['ninja-05', ['summoning', 'body-replacement']],
    ['ninja-08', ['great-breakthrough', 'wind-cutter']],
    ['ninja-10', ['body-flicker', 'body-replacement']],
    ['ninja-16', ['body-flicker', 'summoning']],
    ['ninja-17', ['wild-water-wave', 'water-bullet']],
    ['ninja-18', ['fireball', 'great-dragon-fire']],
    ['ninja-23', ['fire-dragon-flame-bullet', 'shuriken-shadow-clone']],
    ['ninja-24', ['chidori', 'false-darkness', 'black-panther']],
  ] as const)('requires every distinct jutsu in the combination for %s', (id, jutsus) => {
    for (const missing of jutsus) {
      const partial = mastered(jutsus.filter((jutsu) => jutsu !== missing))
      for (const progress of Object.values(partial)) progress.casts = 999
      const entry = getNinjaCollection(partial).find((entry) => entry.ninja.id === id)
      expect(entry).toMatchObject({
        unlocked: false,
        current: jutsus.length - 1,
        required: jutsus.length,
      })
    }
    expect(
      getNinjaCollection(mastered(jutsus)).find((entry) => entry.ninja.id === id),
    ).toMatchObject({
      unlocked: true,
      current: jutsus.length,
      required: jutsus.length,
    })
  })

  it.each([
    ['ninja-14', 4],
    ['ninja-15', 6],
    ['ninja-19', 8],
    ['ninja-21', 20],
    ['ninja-25', 12],
  ] as const)('unlocks %s through %i different jutsu, never repeated casts', (id, required) => {
    expect(unlocked(mastered(JUTSU_IDS.slice(0, required - 1)))).not.toContain(id)
    expect(unlocked(mastered(JUTSU_IDS.slice(0, required)))).toContain(id)
    expect(unlocked({ fireball: record(999) })).not.toContain(id)
  })

  it('does not let repeated or unknown jutsu advance the collection', () => {
    expect(unlocked({ fireball: record(999) })).toEqual(['ninja-01', 'ninja-02'])
    expect(
      unlocked(parseMastery(JSON.stringify({ fireball: record(), unknown: record(999) }))),
    ).toEqual(['ninja-01', 'ninja-02'])
    expect(unlocked(mastered(JUTSU_IDS))).toHaveLength(25)
    expect(getNinjaCollection(mastered(JUTSU_IDS)).at(-1)).toMatchObject({
      current: 12,
      required: 12,
    })
  })

  it('reports signature and combination rewards together and never repeats them', () => {
    const before = mastered(['false-darkness', 'black-panther'])
    const after = { ...before, chidori: record() }
    expect(getNewlyUnlocked(before, after).map((ninja) => ninja.id)).toEqual([
      'ninja-03',
      'ninja-24',
    ])
    expect(getNewlyUnlocked(after, { ...after, chidori: record(2) })).toEqual([])
    expect(getNewlyUnlocked(before, after, ['ninja-24']).map((ninja) => ninja.id)).toEqual([
      'ninja-03',
    ])
  })

  it('restores only known unlocked companions, including retained ones', () => {
    expect(resolveCompanion('ninja-02', { fireball: record() }).id).toBe('ninja-02')
    expect(resolveCompanion('ninja-04', {}, ['ninja-04']).id).toBe('ninja-04')
    for (const id of [null, 'ninja-02', 'ninja-99', '{broken'])
      expect(resolveCompanion(id, {}).id).toBe('ninja-01')
  })
})

describe('one-time retention of previously unlocked companions', () => {
  it('preserves old milestones without allowing later casts to use them', () => {
    const old = { fireball: record(3) }
    const retained = restoreRetainedNinjas(null, old)
    expect(retained).toEqual(['ninja-01', 'ninja-02', 'ninja-04'])
    const later = { fireball: record(200) }
    expect(restoreRetainedNinjas(JSON.stringify(retained), later)).toEqual(retained)
    expect(unlocked(later, retained)).toEqual(retained)
    expect(
      getNinjaCollection(old, retained).find((entry) => entry.ninja.id === 'ninja-04'),
    ).toMatchObject({ unlocked: true, current: 2, required: 2 })
  })

  it('retains all previously earned companions for a veteran player', () => {
    const old = { fireball: record(250), chidori: record(), summoning: record() }
    expect(restoreRetainedNinjas(null, old)).toHaveLength(25)
  })

  it('deduplicates saved ids and rejects malformed or unknown unlock records', () => {
    expect(restoreRetainedNinjas('["ninja-04","ninja-99","ninja-04",12]', {})).toEqual(['ninja-04'])
    for (const raw of ['{broken', '{}', 'null'])
      expect(restoreRetainedNinjas(raw, { fireball: record(250) })).toEqual([])
    expect(restoreRetainedNinjas('[]', { fireball: record(250) })).toEqual([])
  })
})
