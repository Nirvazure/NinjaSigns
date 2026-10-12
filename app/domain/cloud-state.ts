import { integer, list, object, text, type Catalog } from './catalog'
import type { PlayerState, CastResult } from './player-session'

export function parsePlayerState(raw: unknown, catalog: Catalog): PlayerState {
  const data = object(raw),
    mastery: PlayerState['mastery'] = {}
  for (const [id, raw] of Object.entries(object(data.mastery))) {
    if (!catalog.jutsus.some((j) => j.id === id)) throw Error('进度引用了不存在的忍术')
    const row = object(raw),
      lastCastAt = text(row.lastCastAt)
    if (Number.isNaN(Date.parse(lastCastAt))) throw Error('施术时间无效')
    mastery[id] = { casts: integer(row.casts, 1), lastCastAt }
  }
  const unlockedIds = list(data.unlockedIds).map(text)
  const companionId = text(data.companionId)
  if (
    !unlockedIds.includes(companionId) ||
    unlockedIds.some((id) => !catalog.ninjas.some((n) => n.id === id))
  )
    throw Error('伙伴记录无效')
  return {
    userId: text(data.userId),
    version: integer(data.version),
    displayName: text(data.displayName),
    avatarUrl: data.avatarUrl === null ? null : text(data.avatarUrl),
    companionId,
    mastery,
    unlockedIds,
  }
}
export function parseCastResult(raw: unknown, catalog: Catalog): CastResult {
  const data = object(raw)
  const state = parsePlayerState(data.state, catalog)
  const newlyUnlocked = list(data.newlyUnlocked).map(text)
  if (newlyUnlocked.some((id) => !state.unlockedIds.includes(id))) throw Error('解锁结果无效')
  return { state, newlyUnlocked }
}
