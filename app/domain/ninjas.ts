import { getJutsu } from './catalog'
import type { Mastery } from './progress'
import type { JutsuId } from './types'

export type NinjaId = `ninja-${string}`
export type NinjaUnlock =
  | { kind: 'starter' }
  | { kind: 'first-cast'; jutsuId: JutsuId }
  | { kind: 'total-casts'; required: number }
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

export const COMPANION_KEY = 'naruto-spiritism.companion.v1'
export const NINJA_MILESTONES = [
  3, 5, 8, 12, 16, 20, 25, 30, 36, 42, 50, 60, 70, 80, 90, 100, 115, 130, 150, 175, 200,
] as const
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
const specialUnlocks: Readonly<Record<number, NinjaUnlock>> = {
  1: { kind: 'starter' },
  2: { kind: 'first-cast', jutsuId: 'fireball' },
  3: { kind: 'first-cast', jutsuId: 'chidori' },
  7: { kind: 'first-cast', jutsuId: 'summoning' },
}
let milestoneIndex = 0
export const NINJAS: readonly NinjaDefinition[] = Array.from({ length: 25 }, (_, index) => {
  const number = index + 1
  const suffix = String(number).padStart(2, '0')
  return {
    id: `ninja-${suffix}`,
    name: names[number] ?? `忍者档案 ${suffix}`,
    image: `/images/ninja/ninja (${number}).png`,
    unlock: specialUnlocks[number] ?? {
      kind: 'total-casts',
      required: NINJA_MILESTONES[milestoneIndex++]!,
    },
  }
})

export function getNinjaCollection(mastery: Mastery): NinjaCollectionEntry[] {
  const total = Object.values(mastery).reduce((sum, record) => sum + record.casts, 0)
  return NINJAS.map((ninja) => {
    const rule = ninja.unlock
    const required = rule.kind === 'total-casts' ? rule.required : 1
    const value =
      rule.kind === 'starter'
        ? 1
        : rule.kind === 'first-cast'
          ? (mastery[rule.jutsuId]?.casts ?? 0)
          : total
    const condition =
      rule.kind === 'starter'
        ? '初始伙伴'
        : rule.kind === 'first-cast'
          ? `首次成功施放${getJutsu(rule.jutsuId).shortName}`
          : `累计成功施术 ${required} 次`
    return {
      ninja,
      unlocked: value >= required,
      current: Math.min(value, required),
      required,
      condition,
    }
  })
}

export function getNewlyUnlocked(before: Mastery, after: Mastery): NinjaDefinition[] {
  const owned = new Set(
    getNinjaCollection(before)
      .filter((entry) => entry.unlocked)
      .map((entry) => entry.ninja.id),
  )
  return getNinjaCollection(after)
    .filter((entry) => entry.unlocked && !owned.has(entry.ninja.id))
    .map((entry) => entry.ninja)
}

export function resolveCompanion(id: string | null, mastery: Mastery): NinjaDefinition {
  return (
    getNinjaCollection(mastery).find((entry) => entry.ninja.id === id && entry.unlocked)?.ninja ??
    NINJAS[0]!
  )
}
