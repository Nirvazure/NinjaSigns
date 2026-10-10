import { describe, expect, it } from 'vitest'
import { JUTSU_IDS, JUTSUS, getJutsu, withJutsuPresentation } from '../../app/domain/catalog'
import { SEAL_IDS } from '../../app/domain/types'

describe('catalog sequences', () => {
  it('keeps every approved sequence in catalog order', () => {
    expect(JUTSUS.map(({ id, sequence }) => [id, sequence])).toEqual([
      ['summoning', ['boar', 'dog', 'bird', 'monkey', 'ram']],
      ['fireball', ['snake', 'ram', 'monkey', 'boar', 'horse', 'tiger']],
      ['chidori', ['ox', 'hare', 'monkey']],
      ['body-flicker', ['tiger']],
      ['body-replacement', ['tiger', 'boar', 'ox', 'dog', 'snake']],
      ['shuriken-shadow-clone', ['ox', 'dog', 'dragon', 'rat', 'dog', 'boar', 'snake', 'tiger']],
      ['shadow-sewing', ['rat', 'bird']],
      ['mind-clone-switch', ['snake', 'ox', 'tiger', 'ram']],
      ['phoenix-sage-fire', ['rat', 'tiger', 'dog', 'ox', 'hare', 'tiger']],
      ['dragon-fire', ['snake', 'dragon', 'hare', 'tiger']],
      ['fire-dragon-flame-bullet', ['ram', 'horse', 'snake', 'dragon', 'rat', 'ox', 'tiger']],
      ['ash-pile-burning', ['snake', 'rat', 'snake', 'tiger']],
      ['great-dragon-fire', ['tiger']],
      ['intelligent-hard-work', ['rat', 'dog', 'tiger']],
      ['great-fire-annihilation', ['horse']],
      ['great-fire-destruction', ['rat', 'ox', 'dog', 'horse', 'monkey', 'boar', 'tiger']],
      ['great-breakthrough', ['tiger', 'ox', 'dog', 'hare', 'snake']],
      ['vacuum-sphere', ['rat', 'hare', 'dog']],
      ['vacuum-great-sphere', ['tiger', 'dog']],
      ['vacuum-wave', ['rat', 'snake', 'horse', 'dog']],
      ['vacuum-serial-waves', ['rat', 'snake', 'horse', 'snake', 'dog']],
      ['wind-cutter', ['tiger', 'hare', 'dog', 'ram', 'dragon']],
      ['wild-water-wave', ['dragon', 'tiger', 'hare']],
      ['water-bullet', ['tiger', 'ox', 'tiger', 'rat']],
      ['added-weight-rock', ['snake']],
      ['dropping-lid', ['snake']],
      ['false-darkness', ['snake']],
      ['black-panther', ['ram']],
    ])
  })

  it('provides unique save ids and usable basic seals for every scroll', () => {
    expect(JUTSU_IDS).toHaveLength(28)
    expect(new Set(JUTSU_IDS).size).toBe(28)
    for (const jutsu of JUTSUS) {
      expect(jutsu.sequence.length, jutsu.id).toBeGreaterThan(0)
      expect(
        jutsu.sequence.every((seal) => SEAL_IDS.includes(seal)),
        jutsu.id,
      ).toBe(true)
    }
  })

  it('provides usable initial battle power and keeps utility jutsu free of direct damage', () => {
    for (const jutsu of JUTSUS) {
      expect(Number.isInteger(jutsu.attackPower), jutsu.id).toBe(true)
      expect(jutsu.attackPower, jutsu.id).toBeGreaterThanOrEqual(0)
      expect(jutsu.attackPower, jutsu.id).toBeLessThanOrEqual(100)
    }
    for (const id of [
      'body-flicker',
      'body-replacement',
      'mind-clone-switch',
      'added-weight-rock',
    ] as const)
      expect(getJutsu(id).attackPower).toBe(0)
    expect(getJutsu('chidori').attackPower).toBeGreaterThan(getJutsu('fireball').attackPower)
    expect(getJutsu('great-fire-annihilation').attackPower).toBeGreaterThan(
      getJutsu('fireball').attackPower,
    )
  })
})

describe('jutsu presentation adapter', () => {
  it('keeps the original animated effects and their existing assets', () => {
    expect(
      JUTSUS.filter((jutsu) => ['summoning', 'fireball', 'chidori'].includes(jutsu.id)).map(
        ({ id, effect, cover, color, duration }) => ({ id, effect, cover, color, duration }),
      ),
    ).toEqual([
      {
        id: 'summoning',
        effect: 'summoning',
        cover: '/images/jutsu/summoning.png',
        color: '#367d65',
        duration: 5200,
      },
      {
        id: 'fireball',
        effect: 'fireball',
        cover: '/images/jutsu/fireball.png',
        color: '#bc493b',
        duration: 3400,
      },
      {
        id: 'chidori',
        effect: 'chidori',
        cover: '/images/jutsu/chidori.png',
        color: '#337e9c',
        duration: 3800,
      },
    ])
  })

  it('makes a business-only entry practiceable without assigning an unrelated effect', () => {
    const entry = withJutsuPresentation({
      id: 'test-business-only',
      name: '测试忍术',
      shortName: '测试忍术',
      category: '水遁',
      description: '用于检验无演出忍术的默认展示。',
      attackPower: 40,
      sequence: ['tiger', 'snake'] as const,
    })

    expect(entry).toEqual({
      id: 'test-business-only',
      name: '测试忍术',
      shortName: '测试忍术',
      category: '水遁',
      description: '用于检验无演出忍术的默认展示。',
      attackPower: 40,
      sequence: ['tiger', 'snake'],
      cover: '/images/ui/paper.svg',
      color: '#367d65',
      duration: 0,
      effect: null,
    })
  })

  it('keeps the single-seal entry effect-free', () => {
    expect(JUTSUS.find((jutsu) => jutsu.id === 'great-fire-annihilation')).toMatchObject({
      shortName: '豪火灭却',
      category: '火遁',
      sequence: ['horse'],
      cover: '/images/ui/paper.svg',
      color: '#367d65',
      duration: 0,
      effect: null,
    })
  })
})
