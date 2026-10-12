import type { JutsuId } from '../../app/domain/types'

export type NinjaId = `ninja-${string}`
export type NinjaUnlock =
  | { kind: 'starter' }
  | { kind: 'first-cast'; jutsuId: JutsuId }
  | { kind: 'jutsu-set'; jutsuIds: readonly JutsuId[] }
  | { kind: 'mastered-count'; required: number }
export interface NinjaDefinition {
  id: NinjaId
  name: string
  image: string
  unlock: NinjaUnlock
}
export interface NinjaCollectionEntry {
  ninja: NinjaDefinition
  unlocked: boolean
  current: number
  required: number
  condition: string
}

const names: Readonly<Record<number, string>> = {
  1: '鸣人',
  2: '佐助',
  3: '卡卡西',
  5: '纲手',
  6: '大蛇丸',
  7: '波风水门',
  8: '我爱罗',
  9: '鹿丸',
  10: '雏田',
  11: '小李',
  13: '宇智波鼬',
  16: '迈特凯',
  17: '千手扉间',
  18: '宇智波带土',
  19: '小南',
  21: '大筒木辉夜',
  24: '奇拉比',
}
const unlocks = [
  { kind: 'starter' },
  { kind: 'first-cast', jutsuId: 'fireball' },
  { kind: 'first-cast', jutsuId: 'chidori' },
  { kind: 'jutsu-set', jutsuIds: ['added-weight-rock', 'dropping-lid'] },
  { kind: 'jutsu-set', jutsuIds: ['summoning', 'body-replacement'] },
  { kind: 'first-cast', jutsuId: 'great-breakthrough' },
  { kind: 'first-cast', jutsuId: 'summoning' },
  { kind: 'jutsu-set', jutsuIds: ['great-breakthrough', 'wind-cutter'] },
  { kind: 'first-cast', jutsuId: 'shadow-sewing' },
  { kind: 'jutsu-set', jutsuIds: ['body-flicker', 'body-replacement'] },
  { kind: 'first-cast', jutsuId: 'body-flicker' },
  { kind: 'first-cast', jutsuId: 'shuriken-shadow-clone' },
  { kind: 'first-cast', jutsuId: 'phoenix-sage-fire' },
  { kind: 'mastered-count', required: 4 },
  { kind: 'mastered-count', required: 6 },
  { kind: 'jutsu-set', jutsuIds: ['body-flicker', 'summoning'] },
  { kind: 'jutsu-set', jutsuIds: ['wild-water-wave', 'water-bullet'] },
  { kind: 'jutsu-set', jutsuIds: ['fireball', 'great-dragon-fire'] },
  { kind: 'mastered-count', required: 8 },
  { kind: 'first-cast', jutsuId: 'ash-pile-burning' },
  { kind: 'mastered-count', required: 20 },
  { kind: 'first-cast', jutsuId: 'mind-clone-switch' },
  { kind: 'jutsu-set', jutsuIds: ['fire-dragon-flame-bullet', 'shuriken-shadow-clone'] },
  { kind: 'jutsu-set', jutsuIds: ['chidori', 'false-darkness', 'black-panther'] },
  { kind: 'mastered-count', required: 12 },
] as const satisfies readonly NinjaUnlock[]
export const NINJAS: readonly NinjaDefinition[] = Array.from({ length: 25 }, (_, index) => {
  const number = index + 1
  const suffix = String(number).padStart(2, '0')
  return {
    id: `ninja-${suffix}`,
    name: names[number] ?? `忍者档案 ${suffix}`,
    image: `/images/ninja/ninja (${number}).png`,
    unlock: unlocks[index]!,
  }
})
