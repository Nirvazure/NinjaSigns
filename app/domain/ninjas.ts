import type { Catalog } from './catalog'
import type { Mastery } from './progress'
export type NinjaId = string
export type NinjaUnlock =
  | { kind: 'starter' }
  | { kind: 'first-cast'; jutsuId: string }
  | { kind: 'jutsu-set'; jutsuIds: readonly string[] }
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
export function getNinjaCollection(
  catalog: Catalog,
  mastery: Mastery,
  unlockedIds: readonly string[],
): NinjaCollectionEntry[] {
  const mastered = new Set(
    catalog.jutsus.filter((j) => (mastery[j.id]?.casts ?? 0) > 0).map((j) => j.id),
  )
  const owned = new Set(unlockedIds)
  const name = (id: string) => catalog.jutsus.find((j) => j.id === id)!.shortName
  return catalog.ninjas.map((ninja) => {
    const r = ninja.unlock
    const required =
      r.kind === 'mastered-count' ? r.required : r.kind === 'jutsu-set' ? r.jutsuIds.length : 1
    const value =
      r.kind === 'starter'
        ? 1
        : r.kind === 'first-cast'
          ? Number(mastered.has(r.jutsuId))
          : r.kind === 'jutsu-set'
            ? r.jutsuIds.filter((id) => mastered.has(id)).length
            : mastered.size
    const unlocked = owned.has(ninja.id)
    const condition =
      r.kind === 'starter'
        ? '初始伙伴'
        : r.kind === 'first-cast'
          ? `首次成功施放${name(r.jutsuId)}`
          : r.kind === 'jutsu-set'
            ? `掌握${r.jutsuIds.map(name).join('、')}`
            : `掌握 ${required} 种不同忍术`
    return {
      ninja,
      required,
      current: unlocked ? required : Math.min(value, required),
      unlocked,
      condition,
    }
  })
}
