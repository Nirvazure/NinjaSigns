import { JUTSU_IDS } from './jutsu-data'
import { NINJAS, type NinjaId } from './ninjas'
import type { Mastery } from './progress'

export const RETAINED_NINJAS_KEY = 'naruto-spiritism.ninja-unlocks.v1'

// 仅首次升级时保留旧规则已解锁的伙伴；后续施术不再使用累计次数规则。
const legacyMilestones = [
  3, 5, 8, 12, 16, 20, 25, 30, 36, 42, 50, 60, 70, 80, 90, 100, 115, 130, 150, 175, 200,
] as const

export function restoreRetainedNinjas(raw: string | null, mastery: Mastery): NinjaId[] {
  if (raw !== null) {
    try {
      const value: unknown = JSON.parse(raw)
      if (!Array.isArray(value)) return []
      return NINJAS.filter((ninja) => value.includes(ninja.id)).map((ninja) => ninja.id)
    } catch {
      return []
    }
  }
  const total = JUTSU_IDS.reduce((sum, id) => sum + (mastery[id]?.casts ?? 0), 0)
  let milestone = 0
  return NINJAS.filter((ninja, index) => {
    if (index === 0) return true
    if (index === 1) return (mastery.fireball?.casts ?? 0) > 0
    if (index === 2) return (mastery.chidori?.casts ?? 0) > 0
    if (index === 6) return (mastery.summoning?.casts ?? 0) > 0
    return total >= legacyMilestones[milestone++]!
  }).map((ninja) => ninja.id)
}
